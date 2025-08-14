import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model<ICategory>('Category', CategorySchema);
