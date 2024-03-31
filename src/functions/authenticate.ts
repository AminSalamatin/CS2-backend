import {Request} from 'express';
import jwt from 'jsonwebtoken';
import {LoginUser, TokenContent} from '../types/DBTypes';
import {MyContext} from '../types/MyContext';

export default async (req: Request): Promise<MyContext> => {
  const authHeader = req.headers.authorization;
  const returnContext: MyContext = {ip: req.ip};
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
        return returnContext;
      }
      const tokenContent: TokenContent = {
        token: token,
        user: userFromToken,
      };
      returnContext.userdata = tokenContent;
      return returnContext;
    } catch (error) {
      return returnContext;
    }
  }
  return returnContext;
};
