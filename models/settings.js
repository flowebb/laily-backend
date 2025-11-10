// settings.js
// 홍보바 등 사이트 전역 설정을 저장하는 스키마 정의
const mongoose = require('mongoose');

const promoBarMessageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: String,
    required: false,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  messages: {
    type: [promoBarMessageSchema],
    default: []
  }
}, {
  timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;

