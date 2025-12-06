// Upload service stub for file upload functionality
const path = require('path');
const fs = require('fs');

// Mock upload to local filesystem
const uploadImage = async (base64Image) => {
  try {
    // Extract the base64 data
    const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 image format');
    }
    
    const contentType = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');
    
    // Generate a unique filename
    const timestamp = Date.now();
    const extension = contentType.split('/')[1] || 'jpg';
    const filename = `${timestamp}.${extension}`;
    const filepath = path.join(__dirname, '..', 'uploads', filename);
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(filepath, buffer);
    
    // Return the public URL
    const imageUrl = `/uploads/${filename}`;
    console.log(`✅ Image uploaded successfully: ${imageUrl}`);
    
    return imageUrl;
  } catch (error) {
    console.error('❌ Image upload failed:', error);
    throw new Error('Failed to upload image');
  }
};

// Mock upload to cloud service (S3, Cloudinary, etc.)
const uploadImageToCloud = async (base64Image, service = 'cloudinary') => {
  try {
    console.log(`☁️ Uploading to ${service}:`, base64Image.substring(0, 50) + '...');
    
    // In a real implementation, you would use the actual cloud service
    // For now, just return a mock URL
    const mockUrl = `https://${service}.example.com/images/${Date.now()}.jpg`;
    
    console.log(`✅ Image uploaded to ${service}: ${mockUrl}`);
    return mockUrl;
  } catch (error) {
    console.error(`❌ Cloud upload failed:`, error);
    throw new Error(`Failed to upload to ${service}`);
  }
};

// Delete image from local filesystem
const deleteImage = async (imageUrl) => {
  try {
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      const filename = imageUrl.replace('/uploads/', '');
      const filepath = path.join(__dirname, '..', 'uploads', filename);
      
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log(`🗑️ Image deleted: ${imageUrl}`);
        return true;
      }
    }
    
    console.log(`⚠️ Image not found for deletion: ${imageUrl}`);
    return false;
  } catch (error) {
    console.error('❌ Image deletion failed:', error);
    return false;
  }
};

// Validate image format and size
const validateImage = (base64Image, maxSize = 5 * 1024 * 1024) => { // 5MB default
  try {
    if (!base64Image) {
      throw new Error('No image provided');
    }
    
    // Check if it's a valid base64 image
    const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid image format');
    }
    
    const contentType = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');
    
    // Check file size
    if (buffer.length > maxSize) {
      throw new Error(`Image size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
    }
    
    // Check content type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      throw new Error('Unsupported image format. Only JPEG, PNG, GIF, and WebP are allowed');
    }
    
    return {
      isValid: true,
      size: buffer.length,
      contentType,
      extension: contentType.split('/')[1]
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message
    };
  }
};

module.exports = {
  uploadImage,
  uploadImageToCloud,
  deleteImage,
  validateImage
};
