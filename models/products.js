const mongoose = require('mongoose');

// Variant 서브스키마 (컬러와 사이즈 조합)
const variantSchema = new mongoose.Schema({
  color: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  image: {
    type: String,
    required: false,
    trim: true
  },
  variantSku: {
    type: String,
    required: false,
    trim: true,
    uppercase: true
  }
}, { _id: true });

// Variant의 color와 size 조합이 중복되지 않도록 검증
variantSchema.index({ color: 1, size: 1 }, { unique: false });

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
    originalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    discountedPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    }
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
  },
  variants: {
    type: [variantSchema],
    default: []
  },
  // 사용 가능한 컬러 옵션
  availableColors: {
    type: [String],
    default: []
  },
  // 사용 가능한 사이즈 옵션
  availableSizes: {
    type: [String],
    default: []
  },
  // 상품 상태
  status: {
    type: [{
      type: String,
      enum: ['NEW', 'SALE', 'IN_STOCK']
    }],
    default: []
  }
}, {
  timestamps: true // createdAt과 updatedAt 필드를 자동으로 생성
});

// 상품 내에서 color와 size 조합이 중복되지 않도록 검증
productSchema.pre('save', function(next) {
  if (this.variants && this.variants.length > 0) {
    const combinations = new Set();
    for (const variant of this.variants) {
      const key = `${variant.color}-${variant.size}`;
      if (combinations.has(key)) {
        return next(new Error(`중복된 variant 조합입니다: ${variant.color} - ${variant.size}`));
      }
      combinations.add(key);
    }
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

