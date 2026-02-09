import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  from: Types.ObjectId;
  to: Types.ObjectId;
  body?: string;
  image?: string;
}

const MessageSchema = new Schema<IMessage>({
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String },
  image: { type: String }
}, { timestamps: true });

export default mongoose.model<IMessage>('Message', MessageSchema);
