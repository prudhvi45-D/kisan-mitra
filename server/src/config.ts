import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/agri_connect',
  jwtSecret: process.env.JWT_SECRET || 'dev',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000'
};
