import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IListing extends Document {
  farmerId: Types.ObjectId;
  title: string;
  cropType: string;
  quantity: number;
  unit: string;
  images: string[];
  location?: string;
  status: 'available' | 'sold' | 'hidden';
  suggestedPrice?: number;
  qualityScore?: number;
  marketPriceSnapshot?: number;
}

const ListingSchema = new Schema<IListing>({
  farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  cropType: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  images: { type: [String], default: [] },
  location: { type: String },
  status: { type: String, enum: ['available', 'sold', 'hidden'], default: 'available' },
  suggestedPrice: { type: Number },
  qualityScore: { type: Number },
  marketPriceSnapshot: { type: Number }
}, { timestamps: true });

export default mongoose.model<IListing>('Listing', ListingSchema);
