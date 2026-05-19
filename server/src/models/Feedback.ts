import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFeedback extends Document {
  listingId: Types.ObjectId;
  farmerId: Types.ObjectId;
  buyerId: Types.ObjectId;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>({
  listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
  farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String }
}, { timestamps: true });

export default mongoose.model<IFeedback>('Feedback', FeedbackSchema);
