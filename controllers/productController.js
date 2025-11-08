const Product = require('../models/products');

// Create - 상품 생성
const createProduct = async (req, res) => {
  try {
    const { sku, name, price, category, image, detailPage, description } = req.body;

    // 필수 필드 검증
    if (!sku || !name || !price || !category || !image || !detailPage) {
      return res.status(400).json({
        error: '필수 필드가 누락되었습니다. (sku, name, price, category, image, detailPage)'
      });
    }

    // category 검증
    if (!['OUTER', 'TOP', 'BOTTOM', 'DRESS', 'ACC'].includes(category.toUpperCase())) {
      return res.status(400).json({
        error: 'category는 OUTER, TOP, BOTTOM, DRESS, ACC 중 하나여야 합니다.'
      });
    }

    // price 검증
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({
        error: 'price는 0 이상의 숫자여야 합니다.'
      });
    }

    const product = new Product({
      sku: sku.toUpperCase().trim(),
      name: name.trim(),
      price,
      category: category.toUpperCase(),
      image: image.trim(),
      detailPage: detailPage.trim(),
      description: description ? description.trim() : undefined
    });

    const savedProduct = await product.save();
    res.status(201).json({
      message: '상품이 성공적으로 생성되었습니다.',
      product: savedProduct
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: '이미 존재하는 SKU입니다.' });
    }
    res.status(500).json({
      error: '상품 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// Read - 모든 상품 조회
const getAllProducts = async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};

    // 카테고리 필터링
    if (category) {
      query.category = category.toUpperCase();
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      message: '상품 목록을 성공적으로 조회했습니다.',
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({
      error: '상품 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// Read - 특정 상품 조회 (ID로)
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    }

    res.status(200).json({
      message: '상품을 성공적으로 조회했습니다.',
      product
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: '유효하지 않은 상품 ID입니다.' });
    }
    res.status(500).json({
      error: '상품 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// Read - SKU로 상품 조회
const getProductBySku = async (req, res) => {
  try {
    const product = await Product.findOne({ sku: req.params.sku.toUpperCase() });

    if (!product) {
      return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    }

    res.status(200).json({
      message: '상품을 성공적으로 조회했습니다.',
      product
    });
  } catch (error) {
    res.status(500).json({
      error: '상품 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// Update - 상품 정보 수정
const updateProduct = async (req, res) => {
  try {
    const { sku, name, price, category, image, detailPage, description } = req.body;
    const updateData = {};

    if (sku) updateData.sku = sku.toUpperCase().trim();
    if (name) updateData.name = name.trim();
    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({
          error: 'price는 0 이상의 숫자여야 합니다.'
        });
      }
      updateData.price = price;
    }
    if (category) {
      if (!['OUTER', 'TOP', 'BOTTOM', 'DRESS', 'ACC'].includes(category.toUpperCase())) {
        return res.status(400).json({
          error: 'category는 OUTER, TOP, BOTTOM, DRESS, ACC 중 하나여야 합니다.'
        });
      }
      updateData.category = category.toUpperCase();
    }
    if (image) updateData.image = image.trim();
    if (detailPage) updateData.detailPage = detailPage.trim();
    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    }

    res.status(200).json({
      message: '상품 정보가 성공적으로 수정되었습니다.',
      product
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: '유효하지 않은 상품 ID입니다.' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: '이미 존재하는 SKU입니다.' });
    }
    res.status(500).json({
      error: '상품 수정 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// Delete - 상품 삭제
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    }

    res.status(200).json({
      message: '상품이 성공적으로 삭제되었습니다.',
      product: {
        id: product._id,
        sku: product.sku,
        name: product.name
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: '유효하지 않은 상품 ID입니다.' });
    }
    res.status(500).json({
      error: '상품 삭제 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySku,
  updateProduct,
  deleteProduct
};

