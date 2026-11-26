// Implements connectToDatabase using iam-games's own mongoose instance.
// @iam/db has its own mongoose in node_modules (different version/instance) so
// re-exporting connectToDatabase from there would connect the wrong instance.
import mongoose from 'mongoose'

mongoose.set('bufferCommands', false)

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null }
global._mongooseCache = cached

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')

  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn

  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null
    cached.promise = null
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    }).then(m => m)
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}
