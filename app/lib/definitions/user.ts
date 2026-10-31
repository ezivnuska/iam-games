// app/lib/definitions/user.ts
export {
  UserRole,
  type AppUser,
  type User,
  type PartialUser,
  type Author,
} from '@iam/shared-types'

import type { Document, Types } from 'mongoose'
import type { ImageDocument } from './image'
import type { UserRole } from '@iam/shared-types'

// DB-level document (server only)
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
