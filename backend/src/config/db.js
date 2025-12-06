import mongoose from 'mongoose';

export default async function connectDB(uri) {
  if (!uri) throw new Error('MONGO_URI is not set');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    dbName: process.env.DB_NAME || undefined,
  });
  console.log('MongoDB connected');
}
