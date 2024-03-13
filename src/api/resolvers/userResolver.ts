import {GraphQLError} from 'graphql';
import {
  TokenContent,
  User,
  UserInput,
  UserOutput,
  LoginUser,
  Credentials,
  UserModify,
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
        credentials: Credentials;
      },
    ): Promise<LoginResponse> => {
      const {username, password} = args.credentials;

      console.log('user, password', username, password);
      const user = await userModel.findOne({
        $or: [{email: username}, {username: username}],
      });

      if (!user) {
        throw new CustomError('Invalid username/email', 403);
      }

      if (!bcrypt.compareSync(password, user.password)) {
        throw new CustomError('Invalid password ', 403);
      }

      const tokenContent: LoginUser = {
        username: user.username,
        email: user.email,
        id: user._id,
        role: user.role,
      };
      console.log(tokenContent);

      const token = jwt.sign(tokenContent, process.env.JWT_SECRET as string, {
        expiresIn: '1h',
      });
      const response: LoginResponse = {
        token,
        message: 'Login successful',
        user: {
          username: user.username,
          email: user.email,
          id: user._id,
        },
      };
      return response;
    },
    register: async (
      _parent: {},
      args: {
        user: UserInput;
      },
    ): Promise<UserResponse> => {
      const userFound = await userModel.findOne({email: args.user.email});
      if (userFound) {
        throw new CustomError('User already registered on that email', 403);
      }
      const salt = 10;
      const userData = {
        ...args.user,
        password: bcrypt.hashSync(args.user.password, salt),
      };
      const user = new userModel(userData);
      await user.save();
      const response: UserResponse = {
        message: 'User created successfully',
        user: {
          username: user.username,
          email: user.email,
          id: user._id,
        },
      };
      return response;
    },
    updateUser: async (
      _parent: {},
      args: {user: UserModify; id?: string},
      context: MyContext,
    ): Promise<UserResponse> => {
      const user = context.userdata?.user;

      if (!user) {
        throw new CustomError('User not logged in', 403);
      }

      let userId = user.id;

      if (args.id && user.role === 'admin') {
        userId = args.id;
      } else {
        throw new CustomError('Unauthorized', 403);
      }
      const updatedUser = await userModel.findByIdAndUpdate(userId, args.user, {
        new: true,
      });

      if (!updatedUser) {
        throw new CustomError('User not found', 403);
      }

      const response: UserResponse = {
        message: 'User updated successfully',
        user: {
          username: updatedUser.username,
          email: updatedUser.email,
          id: updatedUser._id,
        },
      };
      return response;
    },
    deleteUser: async (
      _parent: {},
      args: {id?: string},
      context: MyContext,
    ): Promise<UserResponse> => {
      const user = context.userdata?.user;

      if (!user) {
        throw new CustomError('User not logged in', 403);
      }

      let userId = user.id;

      if (args.id && user.role === 'admin') {
        userId = args.id;
      } else if (args.id && user.role !== 'admin') {
        throw new CustomError('Unauthorized', 403);
      }

      const deletedUser = await userModel.findByIdAndDelete(userId);

      if (!deletedUser) {
        throw new Error('User not found');
      }
      const response: UserResponse = {
        message: 'User deleted successfully',
        user: {
          username: deletedUser.username,
          email: deletedUser.email,
          id: deletedUser._id,
        },
      };
      return response;
    },
  },
};
