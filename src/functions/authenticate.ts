import {Request} from 'express';
import jwt from 'jsonwebtoken';
import {LoginUser, TokenContent} from '../types/DBTypes';
import {MyContext} from '../types/MyContext';

export default async (req: Request): Promise<MyContext> => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;
      const userFromToken = jwt.verify(
        token,
        process.env.JWT_SECRET as string,
      ) as LoginUser;
      if (!userFromToken) {
        return {};
      }
      const tokenContent: TokenContent = {
        token: token,
        user: userFromToken,
      };
      return {userdata: tokenContent};
    } catch (error) {
      return {};
    }
  }
  return {};
};
