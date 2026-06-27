import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/syncparty',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
