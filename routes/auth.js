const express = require('express');
const router = express.Router();
const {
  login,
  kakaoLogin,
  naverLogin,
  getMe
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// 이메일과 비밀번호로 로그인
router.post('/login', login);

// 카카오 로그인
router.post('/kakao', kakaoLogin);

// 네이버 로그인
router.post('/naver', naverLogin);

// 토큰으로 유저 정보 가져오기 (인증 필요)
router.get('/me', authenticateToken, getMe);

module.exports = router;

