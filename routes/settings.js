// settings.js
// 사이트 설정(홍보바) 관련 API 라우트 정의
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/authMiddleware');
const User = require('../models/users');

// 관리자 권한 체크 미들웨어
const checkAdmin = (req, res, next) => {
  if (req.user && req.user.user_type === 'admin') {
    next();
  } else {
    return res.status(403).json({
      error: '관리자 권한이 필요합니다.'
    });
  }
};

// 홍보바 설정 가져오기 (인증 불필요)
router.get('/promo-bar', settingsController.getPromoBar);

// 홍보바 설정 업데이트 (관리자만)
router.put('/promo-bar', authenticateToken, checkAdmin, settingsController.updatePromoBar);

module.exports = router;

