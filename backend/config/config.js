require('dotenv').config();

/**
 * Application configuration
 * Environment-specific configuration values are loaded from .env file
 */
const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
  },
  
  // MongoDB configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-docusign',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  
  // JWT configuration for authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'saafi-development-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  
  // AI Services configuration
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || 'mock-api-key-for-development',
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS, 10) || 2000,
    }
  },
  
  // File storage configuration
  storage: {
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
    allowedTypes: ['.pdf', '.docx', '.txt'],
  },
  
  // Email service configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'smtp',
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    from: process.env.EMAIL_FROM || 'noreply@ai-docusign.com',
  },
  
  // Rate limiting to prevent abuse
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // limit each IP to 100 requests per windowMs
  }
};

// Export configuration
module.exports = config;
