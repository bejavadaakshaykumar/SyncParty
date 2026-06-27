import mongoose from 'mongoose';
import { env } from './env.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

export async function connectDB(): Promise<void> {
  try {
    // Try standard connection first with a short timeout
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.log('⚠️  Standard MongoDB connection failed. Starting in-memory fallback...');
    try {
      const mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log('✅ In-Memory MongoDB connected successfully (Data will reset on restart)');
    } catch (memError) {
      console.error('❌ Failed to start in-memory database:', memError);
      process.exit(1);
    }
  }
}

export default mongoose;
