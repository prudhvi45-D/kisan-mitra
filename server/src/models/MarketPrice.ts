import mongoose, { Schema, Document } from 'mongoose';

interface IItem { name: string; unit: string; price: number }

export interface IMarketPrice extends Document {
  date: string;
  items: IItem[];
}

const MarketPriceSchema = new Schema<IMarketPrice>({
  date: { type: String, required: true, unique: true },
  items: [{
    name: { type: String, required: true },
    unit: { type: String, default: 'kg' },
    price: { type: Number, required: true }
  }]
}, { timestamps: true });

export default mongoose.model<IMarketPrice>('MarketPrice', MarketPriceSchema);
