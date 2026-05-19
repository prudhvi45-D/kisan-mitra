import mongoose, { Schema, Document } from 'mongoose';

export interface IPriceRange extends Document {
    cropName: string;
    date: Date;
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
}

const PriceRangeSchema: Schema = new Schema({
    cropName: { type: String, required: true },
    date: { type: Date, default: Date.now },
    minPrice: { type: Number, required: true },
    maxPrice: { type: Number, required: true },
    avgPrice: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model<IPriceRange>('PriceRange', PriceRangeSchema);
