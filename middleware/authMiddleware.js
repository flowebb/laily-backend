const jwt = require('jsonwebtoken');
const User = require('../models/users');

const JWT_SECRET = process.env.JWT_SECRET || 'laily_secret_key_change_in_production';

// JWT 토큰 검증 미들웨어
const authenticateToken = async (req, res, next) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN" 형식

    if (!token) {
      return res.status(401).json({
        error: '인증 토큰이 제공되지 않았습니다.'
      });
    }

    // 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 유저 정보 조회
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        error: '유효하지 않은 토큰입니다.'
      });
    }

    // req.user에 유저 정보 추가
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: '유효하지 않은 토큰입니다.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: '토큰이 만료되었습니다.'
      });
    }
    return res.status(500).json({
      error: '토큰 검증 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

module.exports = { authenticateToken };

