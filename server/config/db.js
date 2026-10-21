const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('<username>')) {
    console.warn('\n⚠️  [MongoDB] MONGO_URI is not configured in .env.');
    console.warn('   Please set your MongoDB Atlas connection string in .env to enable database operations.\n');
    return null;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn('⚠️  Server will continue running. Check your MONGO_URI credentials in .env.\n');
    return null;
  }
};

module.exports = connectDB;
