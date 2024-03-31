import {TokenContent} from './DBTypes';

type MyContext = {
  userdata?: TokenContent;
  ip?: string;
};

export {MyContext};
