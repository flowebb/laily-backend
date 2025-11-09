const Product = require('../models/products');

// Create - 상품 생성
const createProduct = async (req, res) => {
  try {
    const { sku, name, price, category, image, detailPage, description, variants, availableColors, availableSizes, status } = req.body;

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

    // price 객체 검증
    if (!price.originalPrice) {
      return res.status(400).json({
        error: 'price 객체에 originalPrice가 필요합니다.'
      });
    }

    if (typeof price.originalPrice !== 'number' || price.originalPrice < 0) {
      return res.status(400).json({
        error: 'originalPrice는 0 이상의 숫자여야 합니다.'
      });
    }

    // 할인율 또는 할인가 중 하나는 필수
    if (price.discountPercentage === undefined && price.discountedPrice === undefined) {
      return res.status(400).json({
        error: 'discountPercentage 또는 discountedPrice 중 하나는 필요합니다.'
      });
    }

    let discountPercentage, discountedPrice, discountAmount;

    // 할인율이 제공된 경우: 할인가와 할인금액 계산
    if (price.discountPercentage !== undefined) {
      if (typeof price.discountPercentage !== 'number' || price.discountPercentage < 0 || price.discountPercentage > 100) {
        return res.status(400).json({
          error: 'discountPercentage는 0과 100 사이의 숫자여야 합니다.'
        });
      }

      discountPercentage = price.discountPercentage;
      discountAmount = Math.round(price.originalPrice * (discountPercentage / 100));
      discountedPrice = price.originalPrice - discountAmount;
    }
    // 할인가가 제공된 경우: 할인율과 할인금액 계산
    else if (price.discountedPrice !== undefined) {
      if (typeof price.discountedPrice !== 'number' || price.discountedPrice < 0) {
        return res.status(400).json({
          error: 'discountedPrice는 0 이상의 숫자여야 합니다.'
        });
      }

      if (price.discountedPrice > price.originalPrice) {
        return res.status(400).json({
          error: 'discountedPrice는 originalPrice보다 작거나 같아야 합니다.'
        });
      }

      discountedPrice = price.discountedPrice;
      discountAmount = price.originalPrice - discountedPrice;
      discountPercentage = price.originalPrice > 0 
        ? Math.round((discountAmount / price.originalPrice) * 100) 
        : 0;
    }

    const priceData = {
      originalPrice: price.originalPrice,
      discountedPrice,
      discountPercentage,
      discountAmount
    };

    // variants 검증 및 처리
    const processedVariants = [];
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const combinations = new Set();
      for (const variant of variants) {
        if (!variant.color || !variant.size) {
          return res.status(400).json({
            error: 'variant에는 color와 size가 필수입니다.'
          });
        }

        const key = `${variant.color}-${variant.size.toUpperCase()}`;
        if (combinations.has(key)) {
          return res.status(400).json({
            error: `중복된 variant 조합입니다: ${variant.color} - ${variant.size}`
          });
        }
        combinations.add(key);

        const stock = variant.stock !== undefined ? Number(variant.stock) : 0;
        if (isNaN(stock) || stock < 0) {
          return res.status(400).json({
            error: 'stock은 0 이상의 숫자여야 합니다.'
          });
        }

        processedVariants.push({
          color: variant.color.trim(),
          size: variant.size.trim().toUpperCase(),
          stock: stock,
          image: variant.image ? variant.image.trim() : undefined,
          variantSku: variant.variantSku ? variant.variantSku.trim().toUpperCase() : undefined
        });
      }
    }

    // availableColors와 availableSizes 자동 추출 (variants가 있는 경우)
    let colors = availableColors || [];
    let sizes = availableSizes || [];
    
    if (processedVariants.length > 0) {
      const uniqueColors = [...new Set(processedVariants.map(v => v.color))];
      const uniqueSizes = [...new Set(processedVariants.map(v => v.size))];
      colors = uniqueColors;
      sizes = uniqueSizes;
    }

    // status 검증 및 처리
    let productStatus = [];
    if (status !== undefined) {
      if (!Array.isArray(status)) {
        return res.status(400).json({
          error: 'status는 배열이어야 합니다.'
        });
      }

      const validStatuses = ['NEW', 'SALE', 'IN_STOCK'];
      for (const s of status) {
        const upperStatus = s.toUpperCase();
        if (!validStatuses.includes(upperStatus)) {
          return res.status(400).json({
            error: `유효하지 않은 status입니다: ${s}. 유효한 값: NEW, SALE, IN_STOCK`
          });
        }
        if (!productStatus.includes(upperStatus)) {
          productStatus.push(upperStatus);
        }
      }
    }

    const product = new Product({
      sku: sku.toUpperCase().trim(),
      name: name.trim(),
      price: priceData,
      category: category.toUpperCase(),
      image: image.trim(),
      detailPage: detailPage.trim(),
      description: description ? description.trim() : undefined,
      variants: processedVariants,
      availableColors: colors,
      availableSizes: sizes,
      status: productStatus
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
    const { category, status } = req.query;
    let query = {};

    // 카테고리 필터링
    if (category) {
      query.category = category.toUpperCase();
    }

    // 상태 필터링
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      const upperStatusArray = statusArray.map(s => s.toUpperCase());
      query.status = { $in: upperStatusArray };
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
    const { sku, name, price, category, image, detailPage, description, variants, availableColors, availableSizes, status } = req.body;
    const updateData = {};

    if (sku) updateData.sku = sku.toUpperCase().trim();
    if (name) updateData.name = name.trim();
    if (price !== undefined) {
      // price 객체 검증
      if (!price.originalPrice) {
        return res.status(400).json({
          error: 'price 객체에 originalPrice가 필요합니다.'
        });
      }

      if (typeof price.originalPrice !== 'number' || price.originalPrice < 0) {
        return res.status(400).json({
          error: 'originalPrice는 0 이상의 숫자여야 합니다.'
        });
      }

      // 할인율 또는 할인가 중 하나는 필수
      if (price.discountPercentage === undefined && price.discountedPrice === undefined) {
        return res.status(400).json({
          error: 'discountPercentage 또는 discountedPrice 중 하나는 필요합니다.'
        });
      }

      let discountPercentage, discountedPrice, discountAmount;

      // 할인율이 제공된 경우: 할인가와 할인금액 계산
      if (price.discountPercentage !== undefined) {
        if (typeof price.discountPercentage !== 'number' || price.discountPercentage < 0 || price.discountPercentage > 100) {
          return res.status(400).json({
            error: 'discountPercentage는 0과 100 사이의 숫자여야 합니다.'
          });
        }

        discountPercentage = price.discountPercentage;
        discountAmount = Math.round(price.originalPrice * (discountPercentage / 100));
        discountedPrice = price.originalPrice - discountAmount;
      }
      // 할인가가 제공된 경우: 할인율과 할인금액 계산
      else if (price.discountedPrice !== undefined) {
        if (typeof price.discountedPrice !== 'number' || price.discountedPrice < 0) {
          return res.status(400).json({
            error: 'discountedPrice는 0 이상의 숫자여야 합니다.'
          });
        }

        if (price.discountedPrice > price.originalPrice) {
          return res.status(400).json({
            error: 'discountedPrice는 originalPrice보다 작거나 같아야 합니다.'
          });
        }

        discountedPrice = price.discountedPrice;
        discountAmount = price.originalPrice - discountedPrice;
        discountPercentage = price.originalPrice > 0 
          ? Math.round((discountAmount / price.originalPrice) * 100) 
          : 0;
      }

      updateData.price = {
        originalPrice: price.originalPrice,
        discountedPrice,
        discountPercentage,
        discountAmount
      };
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

    // variants 업데이트
    if (variants !== undefined) {
      if (!Array.isArray(variants)) {
        return res.status(400).json({
          error: 'variants는 배열이어야 합니다.'
        });
      }

      const processedVariants = [];
      const combinations = new Set();
      
      for (const variant of variants) {
        if (!variant.color || !variant.size) {
          return res.status(400).json({
            error: 'variant에는 color와 size가 필수입니다.'
          });
        }

        const key = `${variant.color}-${variant.size.toUpperCase()}`;
        if (combinations.has(key)) {
          return res.status(400).json({
            error: `중복된 variant 조합입니다: ${variant.color} - ${variant.size}`
          });
        }
        combinations.add(key);

        const stock = variant.stock !== undefined ? Number(variant.stock) : 0;
        if (isNaN(stock) || stock < 0) {
          return res.status(400).json({
            error: 'stock은 0 이상의 숫자여야 합니다.'
          });
        }

        processedVariants.push({
          color: variant.color.trim(),
          size: variant.size.trim().toUpperCase(),
          stock: stock,
          image: variant.image ? variant.image.trim() : undefined,
          variantSku: variant.variantSku ? variant.variantSku.trim().toUpperCase() : undefined
        });
      }

      updateData.variants = processedVariants;

      // availableColors와 availableSizes 자동 업데이트
      if (processedVariants.length > 0) {
        const uniqueColors = [...new Set(processedVariants.map(v => v.color))];
        const uniqueSizes = [...new Set(processedVariants.map(v => v.size))];
        updateData.availableColors = uniqueColors;
        updateData.availableSizes = uniqueSizes;
      } else {
        updateData.availableColors = [];
        updateData.availableSizes = [];
      }
    }

    // availableColors와 availableSizes 직접 업데이트 (variants가 없는 경우)
    if (availableColors !== undefined) {
      updateData.availableColors = Array.isArray(availableColors) ? availableColors : [];
    }
    if (availableSizes !== undefined) {
      updateData.availableSizes = Array.isArray(availableSizes) ? availableSizes.map(s => s.toUpperCase()) : [];
    }

    // status 업데이트
    if (status !== undefined) {
      if (!Array.isArray(status)) {
        return res.status(400).json({
          error: 'status는 배열이어야 합니다.'
        });
      }

      const validStatuses = ['NEW', 'SALE', 'IN_STOCK'];
      const productStatus = [];
      for (const s of status) {
        const upperStatus = s.toUpperCase();
        if (!validStatuses.includes(upperStatus)) {
          return res.status(400).json({
            error: `유효하지 않은 status입니다: ${s}. 유효한 값: NEW, SALE, IN_STOCK`
          });
        }
        if (!productStatus.includes(upperStatus)) {
          productStatus.push(upperStatus);
        }
      }
      updateData.status = productStatus;
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

// Variant 재고 업데이트
const updateVariantStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { variantId, stock } = req.body;

    if (stock === undefined || typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({
        error: 'stock은 0 이상의 숫자여야 합니다.'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ error: 'variant를 찾을 수 없습니다.' });
    }

    variant.stock = stock;
    await product.save();

    res.status(200).json({
      message: 'variant 재고가 성공적으로 업데이트되었습니다.',
      variant: {
        id: variant._id,
        color: variant.color,
        size: variant.size,
        stock: variant.stock
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: '유효하지 않은 ID입니다.' });
    }
    res.status(500).json({
      error: 'variant 재고 업데이트 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// Variant 추가
const addVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const { color, size, stock, image, variantSku } = req.body;

    if (!color || !size) {
      return res.status(400).json({
        error: 'color와 size는 필수입니다.'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    }

    // 중복 체크
    const existingVariant = product.variants.find(
      v => v.color === color.trim() && v.size === size.trim().toUpperCase()
    );

    if (existingVariant) {
      return res.status(400).json({
        error: '이미 존재하는 variant 조합입니다.'
      });
    }

    const newVariant = {
      color: color.trim(),
      size: size.trim().toUpperCase(),
      stock: stock !== undefined ? Number(stock) : 0,
      image: image ? image.trim() : undefined,
      variantSku: variantSku ? variantSku.trim().toUpperCase() : undefined
    };

    if (isNaN(newVariant.stock) || newVariant.stock < 0) {
      return res.status(400).json({
        error: 'stock은 0 이상의 숫자여야 합니다.'
      });
    }

    product.variants.push(newVariant);

    // availableColors와 availableSizes 업데이트
    if (!product.availableColors.includes(newVariant.color)) {
      product.availableColors.push(newVariant.color);
    }
    if (!product.availableSizes.includes(newVariant.size)) {
      product.availableSizes.push(newVariant.size);
    }

    await product.save();

    const addedVariant = product.variants[product.variants.length - 1];

    res.status(201).json({
      message: 'variant가 성공적으로 추가되었습니다.',
      variant: addedVariant
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: '유효하지 않은 상품 ID입니다.' });
    }
    res.status(500).json({
      error: 'variant 추가 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// Variant 삭제
const deleteVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ error: 'variant를 찾을 수 없습니다.' });
    }

    const deletedVariant = {
      color: variant.color,
      size: variant.size
    };

    product.variants.pull(variantId);

    // availableColors와 availableSizes 업데이트
    const remainingColors = [...new Set(product.variants.map(v => v.color))];
    const remainingSizes = [...new Set(product.variants.map(v => v.size))];
    product.availableColors = remainingColors;
    product.availableSizes = remainingSizes;

    await product.save();

    res.status(200).json({
      message: 'variant가 성공적으로 삭제되었습니다.',
      variant: deletedVariant
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: '유효하지 않은 ID입니다.' });
    }
    res.status(500).json({
      error: 'variant 삭제 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// 특정 variant 조회 (color와 size로)
const getVariantByColorAndSize = async (req, res) => {
  try {
    const { productId } = req.params;
    const { color, size } = req.query;

    if (!color || !size) {
      return res.status(400).json({
        error: 'color와 size 쿼리 파라미터가 필요합니다.'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    }

    const variant = product.variants.find(
      v => v.color === color.trim() && v.size === size.trim().toUpperCase()
    );

    if (!variant) {
      return res.status(404).json({ error: 'variant를 찾을 수 없습니다.' });
    }

    res.status(200).json({
      message: 'variant를 성공적으로 조회했습니다.',
      variant
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: '유효하지 않은 상품 ID입니다.' });
    }
    res.status(500).json({
      error: 'variant 조회 중 오류가 발생했습니다.',
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
  deleteProduct,
  updateVariantStock,
  addVariant,
  deleteVariant,
  getVariantByColorAndSize
};

