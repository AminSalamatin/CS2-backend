import {Document, Types} from 'mongoose';

type User = Partial<Document> & {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  password: string;
};

type Post = Partial<Document> & {
  id: string;
  author: Types.ObjectId | User;
  title: string;
  content: string;
  createdAt: Date;
  comments: Comment[];
};

type Comment = Partial<Document> & {
  id: string;
  author: Types.ObjectId | User;
  postId: string;
  content: string;
  createdAt: Date;
};

type PostPage = {
  posts: Post[];
  numberOfPages: number;
};

type Filter = {
  title?: string;
  authorName?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
};

type FilterQuery = {
  title?: {$regex: string; $options: 'i'};
  author?: string;
  createdAt?: {$gte?: Date; $lte?: Date};
};

enum SortOrder {
  ASC = 1,
  DESC = -1,
}

type UserOutput = Omit<User, 'password' | 'role'>;

type UserInput = Omit<User, 'id' | 'role'>;

type UserModify = Partial<Omit<User, 'id' | 'role'>>;

type UserTest = Partial<User>;

type LoginUser = Omit<User, 'password'>;

type Credentials = Pick<User, 'username' | 'password'>;

type TokenContent = {
  token: string;
  user: LoginUser;
};

type WritePost = Pick<Post, 'title' | 'content'>;

type WriteComment = Pick<Comment, 'content' | 'postId'>;

export {
  User,
  Post,
  PostPage,
  WritePost,
  Comment,
  WriteComment,
  Filter,
  FilterQuery,
  UserOutput,
  UserInput,
  UserModify,
  UserTest,
  LoginUser,
  Credentials,
  TokenContent,
  SortOrder,
};
