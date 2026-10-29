// app/lib/definitions/image.ts

import type { Types } from "mongoose";

export interface ImageVariant {
  size: string;
  filename: string;
  width: number;
  height: number;
  url: string;
}

export interface ImageDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  username: string;
  alt?: string;
  variants: ImageVariant[];
  createdAt: string;
  updatedAt: Date;
}

export interface Image {
  id: string;
  userId: string;
  username: string;
  alt?: string;
  variants: {
    url: string;
    size: string;
    width: number;
    height: number;
  }[];
  createdAt?: string;
}
