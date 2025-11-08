const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/users');

// JWT 시크릿 키 (환경 변수로 관리하는 것이 좋지만, 일단 하드코딩)
const JWT_SECRET = process.env.JWT_SECRET || 'laily_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // 7일

// 이메일과 비밀번호로 로그인
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 필수 필드 검증
    if (!email || !password) {
      return res.status(400).json({
        error: '이메일과 비밀번호를 입력해주세요.'
      });
    }

    // 이메일로 유저 찾기
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({
        error: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        user_type: user.user_type
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN
      }
    );

    // 로그인 성공 - 비밀번호 제외하고 유저 정보 반환
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      user_type: user.user_type,
      address: user.address,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(200).json({
      message: '로그인에 성공했습니다.',
      token,
      user: userData
    });
  } catch (error) {
    res.status(500).json({
      error: '로그인 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// 카카오 로그인 (추후 구현)
const kakaoLogin = async (req, res) => {
  try {
    // TODO: 카카오 로그인 구현
    res.status(501).json({
      error: '카카오 로그인 기능은 추후 구현 예정입니다.'
    });
  } catch (error) {
    res.status(500).json({
      error: '카카오 로그인 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// 네이버 로그인 (추후 구현)
const naverLogin = async (req, res) => {
  try {
    // TODO: 네이버 로그인 구현
    res.status(501).json({
      error: '네이버 로그인 기능은 추후 구현 예정입니다.'
    });
  } catch (error) {
    res.status(500).json({
      error: '네이버 로그인 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// 토큰으로 유저 정보 가져오기
const getMe = async (req, res) => {
  try {
    // authenticateToken 미들웨어를 통해 req.user에 유저 정보가 설정됨
    const userData = {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      user_type: req.user.user_type,
      address: req.user.address,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    };

    res.status(200).json({
      message: '유저 정보를 성공적으로 조회했습니다.',
      user: userData
    });
  } catch (error) {
    res.status(500).json({
      error: '유저 정보 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

module.exports = {
  login,
  kakaoLogin,
  naverLogin,
  getMe
};

