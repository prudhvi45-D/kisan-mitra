import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dvtgajrf9',
    api_key: process.env.CLOUDINARY_API_KEY || '994352895965541',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'aWWSjZs9j-7DvEK-pLzavfcYko0'
});

export default cloudinary;
