// app/lib/definitions/user.ts

import type { Document, Types } from "mongoose";
import type { Image, ImageDocument } from "./image";

export enum UserRole {
  User = "user",
  Admin = "admin",
}

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  role: UserRole;
  bio: string;
  avatar?: Types.ObjectId | ImageDocument | null;
  password: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  emailVerified?: Date | null;
}

export interface AppUser {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  emailVerified?: Date | null;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  emailVerified?: Date | null;
  bio: string;
  avatar: Image | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  isGuest?: boolean;
}

export interface PartialUser {
  id: string;
  username: string;
  avatar?: Image;
}

export interface Author {
  id: string;
  username: string;
  avatar?: Image;
}
