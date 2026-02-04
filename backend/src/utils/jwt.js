const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (userId, email, tenantId) => {
  return jwt.sign(
    { 
      userId, 
      email,
      tenantId
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '7d' 
    }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  generateToken,
  verifyToken
};
