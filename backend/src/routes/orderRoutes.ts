import { Router } from 'express';
import { checkout, getOrders, getOrderById, updateOrderStatus } from '../controllers/orderController';
import { authenticateJWT, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.post('/checkout', checkout);
router.get('/', authenticateJWT, getOrders);
router.get('/:id', authenticateJWT, getOrderById);
router.put('/:id/status', authenticateJWT, requireRole(['ADMIN']), updateOrderStatus);

export default router;
