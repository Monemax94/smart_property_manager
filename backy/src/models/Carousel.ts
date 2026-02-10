import { Schema, model, Document } from "mongoose";
import { FileInfo, FileInfoSchema } from "./File";

export interface ICarousel extends Document {
  title: string;
  backgroundColor: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  image?: FileInfo[];
  position: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CarouselSchema = new Schema<ICarousel>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    backgroundColor: { type: String },
    buttonText: { type: String },
    buttonLink: { type: String },
    image: { type: [FileInfoSchema], default: [] },
    position: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const CarouselModel = model<ICarousel>("Carousel", CarouselSchema);
