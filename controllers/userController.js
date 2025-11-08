const bcrypt = require('bcrypt');
const User = require('../models/users');

// Create - 유저 생성
const createUser = async (req, res) => {
  try {
    const { email, name, password, user_type, address } = req.body;

    // 필수 필드 검증
    if (!email || !name || !password || !user_type) {
      return res.status(400).json({ 
        error: '필수 필드가 누락되었습니다. (email, name, password, user_type)' 
      });
    }

    // user_type 검증
    if (!['customer', 'admin'].includes(user_type)) {
      return res.status(400).json({ 
        error: 'user_type은 customer 또는 admin이어야 합니다.' 
      });
    }

    // 패스워드 암호화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({
      email,
      name,
      password: hashedPassword,
      user_type,
      address: address || undefined
    });

    const savedUser = await user.save();
    res.status(201).json({
      message: '유저가 성공적으로 생성되었습니다.',
      user: savedUser
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: '이미 존재하는 이메일입니다.' });
    }
    res.status(500).json({ error: '유저 생성 중 오류가 발생했습니다.', details: error.message });
  }
};

// Read - 모든 유저 조회
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // password 필드 제외
    res.status(200).json({
      message: '유저 목록을 성공적으로 조회했습니다.',
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ error: '유저 조회 중 오류가 발생했습니다.', details: error.message });
  }
};

// Read - 특정 유저 조회 (ID로)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
    }

    res.status(200).json({
      message: '유저를 성공적으로 조회했습니다.',
      user
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: '유효하지 않은 유저 ID입니다.' });
    }
    res.status(500).json({ error: '유저 조회 중 오류가 발생했습니다.', details: error.message });
  }
};

// Update - 유저 정보 수정
const updateUser = async (req, res) => {
  try {
    const { email, name, password, user_type, address } = req.body;
    const updateData = {};

    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (password) {
      // 패스워드가 업데이트될 때도 암호화
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }
    if (user_type) {
      if (!['customer', 'admin'].includes(user_type)) {
        return res.status(400).json({ 
          error: 'user_type은 customer 또는 admin이어야 합니다.' 
        });
      }
      updateData.user_type = user_type;
    }
    if (address !== undefined) updateData.address = address;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
    }

    res.status(200).json({
      message: '유저 정보가 성공적으로 수정되었습니다.',
      user
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: '유효하지 않은 유저 ID입니다.' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: '이미 존재하는 이메일입니다.' });
    }
    res.status(500).json({ error: '유저 수정 중 오류가 발생했습니다.', details: error.message });
  }
};

// Delete - 유저 삭제
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
    }

    res.status(200).json({
      message: '유저가 성공적으로 삭제되었습니다.',
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: '유효하지 않은 유저 ID입니다.' });
    }
    res.status(500).json({ error: '유저 삭제 중 오류가 발생했습니다.', details: error.message });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};

