import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'admin' | 'farmer' | 'buyer';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  locale?: string;
  phone?: string;
  location?: string;
  ratingAverage: number;
  ratingCount: number;
  status: 'active' | 'blocked';
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'farmer', 'buyer'], required: true },
  locale: { type: String, default: 'en' },
  phone: { type: String },
  location: { type: String },
  ratingAverage: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
