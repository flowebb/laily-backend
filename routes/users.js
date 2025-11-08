const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');

// Create - 유저 생성
router.post('/', createUser);

// Read - 모든 유저 조회
router.get('/', getAllUsers);

// Read - 특정 유저 조회 (ID로)
router.get('/:id', getUserById);

// Update - 유저 정보 수정
router.put('/:id', updateUser);

// Delete - 유저 삭제
router.delete('/:id', deleteUser);

module.exports = router;

