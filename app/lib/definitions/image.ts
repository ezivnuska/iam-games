// app/lib/definitions/image.ts
export {
  type ImageVariant,
  type Image,
} from '@iam/shared-types'

import type { Types } from 'mongoose'
import type { ImageVariant } from '@iam/shared-types'

// DB-level document (server only)
export interface ImageDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  username: string;
  alt?: string;
  variants: ImageVariant[];
  createdAt: string;
  updatedAt: Date;
}
