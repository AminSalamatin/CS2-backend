import {Document, Types} from 'mongoose';

type User = Partial<Document> & {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  password: string;
};

type Post = Partial<Document> & {
  author: Types.ObjectId | User;
  title: string;
  content: string;
  createdAt: Date;
};

type Comment = Partial<Document> & {
  author: Types.ObjectId | User;
  post: Types.ObjectId;
  content: string;
  createdAt: Date;
};

type UserOutput = Omit<User, 'password' | 'role'>;

type UserInput = Omit<User, 'id' | 'role'>;

type UserTest = Partial<User>;

type LoginUser = Omit<User, 'password'>;

type Credentials = Pick<User, 'username' | 'password'>;

type TokenContent = {
  token: string;
  user: LoginUser;
};

export {User, Post, Comment, UserOutput, UserInput, UserTest, LoginUser, Credentials, TokenContent};
