const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = 5000;

// 미들웨어
app.use(cors()); // CORS 허용
app.use(express.json()); // JSON 요청 본문 파싱

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laily';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('몽고디비 연결 성공');
  })
  .catch((error) => {
    console.error('몽고디비 연결 실패:', error);
  });

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: '서버가 실행 중입니다.' });
});

// 유저 라우트
app.use('/api/users', userRoutes);

// 인증 라우트
app.use('/api/auth', authRoutes);

// 상품 라우트
app.use('/api/products', productRoutes);

// 설정 라우트
app.use('/api/settings', settingsRoutes);

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}번에서 실행 중입니다.`);
});

