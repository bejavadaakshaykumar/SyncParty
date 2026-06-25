import dotenv from 'dotenv';
dotenv.config();

const rawPort = process.env.PORT?.trim();
const parsedPort = parseInt(rawPort || '10000', 10);

export const env = {
  PORT: isNaN(parsedPort) ? 10000 : parsedPort,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/syncparty',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
