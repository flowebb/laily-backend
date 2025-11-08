const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  user_type: {
    type: String,
    required: true,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  address: {
    type: String,
    required: false,
    trim: true
  }
}, {
  timestamps: true // createdAt과 updatedAt 필드를 자동으로 생성
});

const User = mongoose.model('User', userSchema);

module.exports = User;

