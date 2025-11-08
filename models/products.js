const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['OUTER', 'TOP', 'BOTTOM', 'DRESS', 'ACC'],
    uppercase: true
  },
  image: {
    type: String,
    required: true,
    trim: true
  },
  detailPage: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true
  }
}, {
  timestamps: true // createdAt과 updatedAt 필드를 자동으로 생성
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

