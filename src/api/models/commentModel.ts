import mongoose from 'mongoose';
import {Comment} from '../../types/DBTypes';

const commentModel = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  postId: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

commentModel.virtual('id').get(function () {
  return this._id.toHexString();
});

commentModel.set('toJSON', {
  virtuals: true,
});

export default mongoose.model<Comment>('Comment', commentModel);
