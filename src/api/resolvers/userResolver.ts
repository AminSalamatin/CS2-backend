import {GraphQLError} from 'graphql';
import {
  TokenContent,
  User,
  UserInput,
  UserOutput,
  LoginUser,
} from '../../types/DBTypes';
import {LoginResponse, UserResponse} from '../../types/MessageTypes';
import userModel from '../models/userModel';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import CustomError from '../../classes/CustomError';
import {MyContext} from '../../types/MyContext';

export default {
  Query: {
    users: async (): Promise<User[]> => {
      return await userModel.find();
    },
    userById: async (
      _parent: {},
      args: {
        id: mongoose.Types.ObjectId | string;
      },
    ): Promise<User | null> => {
      const {id} = args;
      return await userModel.findById(id);
    },
    checkToken: async (
      _parent: {},
      _args: {},
      context: MyContext,
    ): Promise<UserResponse> => {
      const token = context.userdata?.token;
      const user = context.userdata?.user;
      if (!user) {
        throw new CustomError('No user login', 403);
      }

      if (!token) {
        throw new CustomError('No token', 403);
      } else if (jwt.verify(token, process.env.JWT_SECRET as string)) {
        const message: UserResponse = {
          message: 'Token verified',
          user: user,
        };
        return message;
      } else {
        throw new CustomError('Wrong token', 403);
      }
    },
  },
  Mutation: {
    login: async (
      _parent: {},
      args: {
        username: string;
        password: string;
      },
    ): Promise<LoginResponse> => {
      const {username, password} = args;

      console.log('user, password', username, password);
      const user = await userModel.findOne({
        $or: [{email: username}, {user_name: username}],
      });

      if (!user) {
        throw new CustomError('Invalid username/email', 403);
      }

      if (!bcrypt.compareSync(password, user.password)) {
        throw new CustomError('Invalid password', 403);
      }

      const tokenContent: LoginUser = {
        username: user.username,
        email: user.email,
        id: user._id,
        role: user.role,
      };

      const token = jwt.sign(tokenContent, process.env.JWT_SECRET as string);
      const message: LoginResponse = {
        token,
        message: 'Login successful',
        user: {
          username: user.username,
          email: user.email,
          id: user._id,
        },
      };
      return message;
    },
  },
};
