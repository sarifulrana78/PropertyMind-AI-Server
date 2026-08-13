import mongoose, { Document, Schema } from 'mongoose';

export interface IAIReport {
  positioning: string;
  targetBuyer: string;
  predictedDaysToSell: number;
  confidence: number;
  generatedAt: Date;
}

export interface IProperty extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  aiDescription?: string;
  price: number;
  pricePerSqft?: number;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  type: 'house' | 'apartment' | 'villa' | 'condo' | 'land';
  status: 'for-sale' | 'for-rent' | 'sold';
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt: number;
  parking: number;
  amenities: string[];
  images: string[];
  owner: mongoose.Types.ObjectId;
  rating: number;
  reviewCount: number;
  views: number;
  isFeatured: boolean;
  aiReport?: IAIReport;
  createdAt: Date;
  updatedAt: Date;
}

const propertySchema = new Schema<IProperty>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    aiDescription: { type: String, default: '' },
    price: { type: Number, required: true },
    pricePerSqft: { type: Number },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, default: 'USA' },
    },
    type: { type: String, enum: ['house', 'apartment', 'villa', 'condo', 'land'], required: true },
    status: { type: String, enum: ['for-sale', 'for-rent', 'sold'], default: 'for-sale' },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    sqft: { type: Number, required: true },
    yearBuilt: { type: Number, required: true },
    parking: { type: Number, default: 1 },
    amenities: [{ type: String }],
    images: [{ type: String }],
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    aiReport: {
      positioning: String,
      targetBuyer: String,
      predictedDaysToSell: Number,
      confidence: Number,
      generatedAt: Date,
    },
  },
  { timestamps: true }
);

// Indexes for search performance
propertySchema.index({ 'address.city': 1, type: 1, price: 1 });
propertySchema.index({ title: 'text', description: 'text', 'address.city': 'text' });

propertySchema.pre('save', function (next) {
  if (this.sqft && this.price) {
    this.pricePerSqft = Math.round(this.price / this.sqft);
  }
  next();
});

export const Property = mongoose.model<IProperty>('Property', propertySchema);
