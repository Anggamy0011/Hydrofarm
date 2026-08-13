import { Router } from 'express';
import {
  getProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController';
import { authenticateJWT, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.get('/categories', getCategories);
router.get('/products', getProducts);
router.get('/products/:id', getProductById);

// Admin endpoints
router.post('/products', authenticateJWT, requireRole(['ADMIN']), createProduct);
router.put('/products/:id', authenticateJWT, requireRole(['ADMIN']), updateProduct);
router.delete('/products/:id', authenticateJWT, requireRole(['ADMIN']), deleteProduct);

export default router;
