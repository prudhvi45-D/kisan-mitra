import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IListing extends Document {
  farmerId: Types.ObjectId;
  title: string;
  cropType: string;
  quantity: number;
  unit: string;
  images: string[];
  location?: string;
  status: 'available' | 'sold' | 'hidden' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  suggestedPrice?: number;
  qualityScore?: number;
  qualityLabel?: string;
  marketPriceSnapshot?: number;
  adminPriceOverride?: number;
}

const ListingSchema = new Schema<IListing>({
  farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  cropType: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  images: { type: [String], default: [] }, // Stores Cloudinary URLs
  location: { type: String },
  status: { type: String, enum: ['available', 'sold', 'hidden', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'], default: 'PENDING_APPROVAL' },
  suggestedPrice: { type: Number },
  qualityScore: { type: Number },
  qualityLabel: { type: String },
  marketPriceSnapshot: { type: Number },
  adminPriceOverride: { type: Number }
}, { timestamps: true });

export default mongoose.model<IListing>('Listing', ListingSchema);
