const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySku,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { authenticateToken } = require('../middleware/authMiddleware');

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

// Create - 상품 생성 (관리자만)
router.post('/', authenticateToken, checkAdmin, createProduct);

// Read - 모든 상품 조회 (모두 접근 가능)
router.get('/', getAllProducts);

// Read - SKU로 상품 조회 (모두 접근 가능)
router.get('/sku/:sku', getProductBySku);

// Read - 특정 상품 조회 (ID로) (모두 접근 가능)
router.get('/:id', getProductById);

// Update - 상품 정보 수정 (관리자만)
router.put('/:id', authenticateToken, checkAdmin, updateProduct);

// Delete - 상품 삭제 (관리자만)
router.delete('/:id', authenticateToken, checkAdmin, deleteProduct);

module.exports = router;

