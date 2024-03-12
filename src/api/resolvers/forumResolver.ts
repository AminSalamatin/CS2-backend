import {GraphQLError} from 'graphql';
import {
  Filter,
  FilterQuery,
  Post,
  Comment,
  WritePost,
  WriteComment,
  User,
  PostPage,
} from '../../types/DBTypes';
import mongoose from 'mongoose';
import postModel from '../models/postModel';
import commentModel from '../models/commentModel';
import userModel from '../models/userModel';
import CustomError from '../../classes/CustomError';
import {MyContext} from '../../types/MyContext';

export default {
  Query: {
    getPosts: async (
      _parent: {},
      args: {filter: Filter},
    ): Promise<PostPage> => {
      const {filter} = args;
      const toFilter: FilterQuery = {};
      if (filter?.title) {
        toFilter.title = {$regex: filter.title, $options: 'i'};
      }
      if (filter?.startDate && filter?.endDate) {
        toFilter.createdAt = {
          $gte: new Date(filter.startDate),
          $lte: new Date(filter.endDate),
        };
      } else if (filter?.startDate) {
        toFilter.createdAt = {$gte: new Date(filter.startDate)};
      } else if (filter?.endDate) {
        toFilter.createdAt = {$lte: new Date(filter.endDate)};
      }
      const page = filter?.page ?? 1;
      const limit = filter?.limit ?? 15;
      console.log(args);
      let filteredPosts = await postModel
        .find(toFilter)
        .populate('author')
        .sort({createdAt: filter?.sortOrder ?? 1})
        .skip((page - 1) * limit)
        .limit(limit);
      if (filter?.authorName) {
        const author: string = filter.authorName;
        const filterByAuthorName = filteredPosts.filter(
          (e) =>
            (e.author as User).username.toLowerCase() === author.toLowerCase(),
        );
        filteredPosts = filterByAuthorName;
      }

      console.log(filteredPosts);

      const postsWithComments: Post[] = await Promise.all(
        filteredPosts.map(async (post) => {
          const comments: Comment[] = await commentModel
            .find({postId: post._id})
            .sort({createdAt: 1})
            .populate('author');
          return {
            id: post._id,
            author: post.author,
            title: post.title,
            content: post.content,
            createdAt: post.createdAt,
            comments: comments.map((comment) => ({
              id: comment._id,
              author: comment.author,
              postId: comment.postId,
              content: comment.content,
              createdAt: comment.createdAt,
            })),
          };
        }),
      );

      const response: PostPage = {
        posts: postsWithComments,
        numberOfPages: Math.ceil(filteredPosts.length / page),
      };

      return response;
    },
    postById: async (
      _parent: {},
      args: {id: mongoose.Types.ObjectId | string},
    ): Promise<Post> => {
      const post = await postModel.findById(args.id).populate('author');
      if (!post) {
        throw new CustomError('Post not found', 403);
      }
      const comments: Comment[] = await commentModel
        .find({postId: args.id})
        .sort({createdAt: 1})
        .populate('author');

      console.log(comments);

      const response: Post = {
        id: post._id,
        author: post.author,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        comments: comments.map((comment) => ({
          id: comment._id,
          author: comment.author,
          postId: comment.postId,
          content: comment.content,
          createdAt: comment.createdAt,
        })),
      };

      return response;
    },
  },
  Mutation: {
    createPost: async (
      _parent: {},
      args: {postContent: WritePost},
      context: MyContext,
    ): Promise<Post> => {
      const {title, content} = args.postContent;
      const author = context.userdata?.user.id;
      console.log(author);
      if (!author) {
        throw new CustomError('Trying to write post without login', 403);
      }
      const newPost = await new postModel({
        title: title,
        content: content,
        author: author,
      });
      console.log(newPost);

      const savedPost = await newPost.save();
      await savedPost.populate('author');

      const response: Post = {
        id: savedPost._id,
        author: savedPost.author,
        title: savedPost.title,
        content: savedPost.content,
        createdAt: savedPost.createdAt,
        comments: [],
      };

      return response;
    },
    createComment: async (
      _parent: {},
      args: {commentContent: WriteComment},
      context: MyContext,
    ): Promise<Comment> => {
      const {postId, content} = args.commentContent;
      const author = context.userdata?.user.id;
      if (!author) {
        throw new CustomError('Trying to write comment without login', 403);
      }
      const newComment = await new commentModel({
        postId: postId,
        content: content,
        author: author,
      });
      const savedComment = await newComment.save();
      await savedComment.populate('author');

      const response: Comment = {
        id: savedComment._id,
        author: savedComment.author,
        postId: savedComment.postId,
        content: savedComment.content,
        createdAt: savedComment.createdAt,
      };
      console.log(savedComment, response);
      return response;
    },
    deletePost: async (
      _parent: {},
      args: {id: string},
      context: MyContext,
    ): Promise<Post> => {
      const {id} = args;
      const author = context.userdata?.user;
      if (!author) {
        throw new CustomError('User not authorized', 403);
      } //else if (author !== )
      const deletedPost = await postModel.findByIdAndDelete(id);
      if (!deletedPost) {
        throw new CustomError('Post not found', 403);
      }
      return deletedPost;
    },
    deleteComment: async (
      _parent: {},
      _args: {id: string},
      _context: {},
    ): Promise<Comment> => {
      const {id} = _args;
      const deletedComment = await commentModel.findByIdAndDelete(id);
      if (!deletedComment) {
        throw new Error('Comment not found');
      }
      return deletedComment;
    },
  },
};
