import { vi } from 'vitest';
import { beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';

beforeAll(async () => {

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/betconnect_test';
  

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
}, 30000); 

afterEach(async () => {
 
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  // Only drop and close if connected
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    } catch (error) {
      console.error('Error cleaning up database:', error);
    }
  }
}, 30000); // Increase timeout to 30 seconds


process.env.JWT_SECRET = 'jwt secret key ';
process.env.GROQ_API_KEY = 'your groq api '
process.env.MONGO_URI = 'mongodb://localhost:27017/property_test_db';
process.env.EMAIL_HOST = 'smtp.test.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'test@test.com';
process.env.EMAIL_PASS = 'testpass';
process.env.FRONTEND_URL = 'http://localhost:5173';


global.vi = vi;