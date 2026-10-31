// app/lib/definitions/user.ts

// Wire-format types live in @iam/shared-types — re-export so existing imports work.
export { UserRole, type AppUser, type User, type PartialUser, type Author } from '@iam/shared-types'

// DB-level document lives in @iam/db — re-export for server-side callers.
export type { UserDocument } from '@iam/db'
