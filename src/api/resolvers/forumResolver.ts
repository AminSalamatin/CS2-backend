import {
  Filter,
  FilterQuery,
  Post,
  Comment,
  WritePost,
  WriteComment,
  User,
  PostPage,
  SortOrder,
} from '../../types/DBTypes';
import mongoose from 'mongoose';
import postModel from '../models/postModel';
import commentModel from '../models/commentModel';
import userModel from '../models/userModel';
import CustomError from '../../classes/CustomError';
import {MyContext} from '../../types/MyContext';
import {PostResponse, CommentResponse} from '../../types/MessageTypes';

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

      if (filter?.authorName) {
        const author = await userModel.findOne({
          username: filter.authorName.toLowerCase(),
        });
        if (author) {
          toFilter.author = author._id;
        }
      }
      const sortOrder = filter?.sortOrder ?? 'ASC';
      const page = filter?.page ?? 1;
      const limit = filter?.limit ?? 15;
      const filteredPosts = await postModel
        .find(toFilter)
        .populate('author')
        .sort({createdAt: SortOrder[sortOrder as keyof typeof SortOrder] ?? 1})
        .skip((page - 1) * limit)
        .limit(limit);

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
      const totalPosts = await postModel.find(toFilter).countDocuments();
      const response: PostPage = {
        posts: postsWithComments,
        numberOfPages: Math.ceil(totalPosts / limit),
      };

      return response;
    },
    postById: async (
      _parent: {},
      args: {id: mongoose.Types.ObjectId | string},
    ): Promise<Post> => {
      const post = await postModel.findById(args.id).populate('author');
      if (!post) {
        throw new CustomError('Post not found', 404);
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
    ): Promise<PostResponse> => {
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

      const response: PostResponse = {
        message: 'Post created',
        response: {
          id: savedPost._id,
          author: savedPost.author,
          title: savedPost.title,
          content: savedPost.content,
          createdAt: savedPost.createdAt,
          comments: [],
        },
      };

      return response;
    },
    createComment: async (
      _parent: {},
      args: {commentContent: WriteComment},
      context: MyContext,
    ): Promise<CommentResponse> => {
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

      const response: CommentResponse = {
        message: 'Comment created',
        response: {
          id: savedComment._id,
          author: savedComment.author,
          postId: savedComment.postId,
          content: savedComment.content,
          createdAt: savedComment.createdAt,
        },
      };

      return response;
    },
    deletePost: async (
      _parent: {},
      args: {id: string},
      context: MyContext,
    ): Promise<PostResponse> => {
      const {id} = args;
      const author = context.userdata?.user;
      const postToDelete = await postModel.findById(id).populate('author');
      if (!author) {
        throw new CustomError('User not authorized', 401);
      } else if (!postToDelete) {
        throw new CustomError('Post not found', 404);
      } else if (
        author.id.toString() !== postToDelete.author.id.toString() ||
        (author.role !== 'admin' &&
          author.id.toString() !== postToDelete.author.id.toString())
      ) {
        console.log(author.id, postToDelete.author.id);
        throw new CustomError('User is not permitted to delete this post', 403);
      }

      const comments: Comment[] = await commentModel
        .find({postId: id})
        .sort({createdAt: 1})
        .populate('author');
      await commentModel.deleteMany({postId: id});

      const deletedPost = await postModel
        .findByIdAndDelete(id)
        .populate('author');
      if (!deletedPost) {
        throw new CustomError('Post not found or already deleted', 404);
      }

      const response: PostResponse = {
        message: 'Post deleted(with comments)',
        response: {
          id: id,
          author: {
            id: deletedPost.author.id,
            username: (deletedPost.author as User).username,
            email: (deletedPost.author as User).email,
            role: (deletedPost.author as User).role,
            password: (deletedPost.author as User).password,
          },
          title: deletedPost.title,
          content: deletedPost.content,
          createdAt: deletedPost.createdAt,
          comments: comments.map((comment) => ({
            id: comment._id,
            author: comment.author,
            postId: comment.postId,
            content: comment.content,
            createdAt: comment.createdAt,
          })),
        },
      };
      console.log(response);
      return response;
    },
    deleteComment: async (
      _parent: {},
      args: {id: string},
      context: MyContext,
    ): Promise<CommentResponse> => {
      const {id} = args;
      const author = context.userdata?.user;
      const commentToDelete = await commentModel
        .findById(id)
        .populate('author');
      if (!author) {
        throw new CustomError('User not authorized', 401);
      } else if (!commentToDelete) {
        throw new CustomError('Comment not found', 404);
      } else if (
        author.id.toString() !== commentToDelete.author.id.toString() ||
        (author.role !== 'admin' &&
          author.id.toString() !== commentToDelete.author.id.toString())
      ) {
        console.log(author.id, commentToDelete.author.id);
        throw new CustomError(
          'User is not permitted to delete this comment',
          403,
        );
      }

      const deletedComment = await commentModel
        .findByIdAndDelete(id)
        .populate('author');
      if (!deletedComment) {
        throw new CustomError('Comment not found or already deleted', 404);
      }

      const response: CommentResponse = {
        message: 'Comment deleted',
        response: {
          id: deletedComment._id,
          author: deletedComment.author,
          postId: deletedComment.postId,
          content: deletedComment.content,
          createdAt: deletedComment.createdAt,
        },
      };
      console.log(response);
      return response;
    },
  },
};
