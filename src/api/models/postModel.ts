import mongoose from 'mongoose';
import {Post} from '../../types/DBTypes';

const postModel = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
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

postModel.virtual('id').get(function () {
  return this._id.toHexString();
});

postModel.set('toJSON', {
  virtuals: true,
});

export default mongoose.model<Post>('Post', postModel);
