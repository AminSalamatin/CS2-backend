import {Point} from 'geojson';
import {UserOutput, Post, Comment} from './DBTypes';

type MessageResponse = {
  message: string;
};

type ErrorResponse = MessageResponse & {
  stack?: string;
};

type UserResponse = MessageResponse & {
  user: UserOutput;
};

type LoginResponse = MessageResponse & {
  token: string;
  user: UserOutput;
};

type UploadResponse = MessageResponse & {
  data: {
    filename: string;
    location: Point;
  };
};

type PostResponse = MessageResponse & {
  response: Post;
};

type CommentResponse = MessageResponse & {
  response: Comment;
};

export {
  MessageResponse,
  ErrorResponse,
  UserResponse,
  LoginResponse,
  UploadResponse,
  PostResponse,
  CommentResponse,
};
