import { Request, Response } from 'express';
import { products, categories } from '../data/store';
import { Product } from '../types';

export const getCategories = (req: Request, res: Response) => {
  return res.json({
    success: true,
    data: categories
  });
};

export const getProducts = (req: Request, res: Response) => {
  const { category, search, page = '1', limit = '20' } = req.query;

  let result = [...products].filter(p => p.isActive);

  if (category) {
    const catSlug = String(category).toLowerCase();
    const catObj = categories.find(c => c.slug === catSlug || c.name.toLowerCase() === catSlug);
    if (catObj) {
      result = result.filter(p => p.categoryId === catObj.id);
    }
  }

  if (search) {
    const query = String(search).toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.badge.toLowerCase().includes(query)
    );
  }

  const pageNum = parseInt(String(page), 10);
  const limitNum = parseInt(String(limit), 10);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = pageNum * limitNum;

  const paginatedProducts = result.slice(startIndex, endIndex);

  return res.json({
    success: true,
    data: paginatedProducts,
    meta: {
      total: result.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(result.length / limitNum)
    }
  });
};

export const getProductById = (req: Request, res: Response) => {
  const { id } = req.params;
  const product = products.find(p => String(p.id) === id || p.slug === id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
  }

  return res.json({
    success: true,
    data: product
  });
};

export const createProduct = (req: Request, res: Response) => {
  const { name, categoryId, description, price, stock, weight, badge, image } = req.body;

  if (!name || !price || !categoryId) {
    return res.status(400).json({ success: false, message: 'Nama, harga, dan kategori wajib diisi' });
  }

  const newId = products.length + 1;
  const newProduct: Product = {
    id: newId,
    categoryId,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: description || '',
    price: Number(price),
    stock: Number(stock) || 10,
    unit: 'pack',
    weight: weight || '250g',
    badge: badge || 'Segar',
    badgeClass: 'badge-panen',
    image: image || 'assets/images/prod-selada-romaine.png',
    isActive: true,
    createdAt: new Date().toISOString()
  };

  products.push(newProduct);

  return res.status(201).json({
    success: true,
    message: 'Produk berhasil ditambahkan',
    data: newProduct
  });
};

export const updateProduct = (req: Request, res: Response) => {
  const { id } = req.params;
  const productIndex = products.findIndex(p => String(p.id) === id);

  if (productIndex === -1) {
    return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
  }

  const current = products[productIndex];
  const updatedProduct: Product = {
    ...current,
    ...req.body,
    id: current.id // preserve ID
  };

  products[productIndex] = updatedProduct;

  return res.json({
    success: true,
    message: 'Produk berhasil diperbarui',
    data: updatedProduct
  });
};

export const deleteProduct = (req: Request, res: Response) => {
  const { id } = req.params;
  const productIndex = products.findIndex(p => String(p.id) === id);

  if (productIndex === -1) {
    return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
  }

  products[productIndex].isActive = false; // soft delete

  return res.json({
    success: true,
    message: 'Produk berhasil dinonaktifkan'
  });
};
