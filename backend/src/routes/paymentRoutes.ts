import { Router } from 'express';
import { handleMidtransWebhook } from '../controllers/paymentController';

const router = Router();

router.post('/midtrans-webhook', handleMidtransWebhook);

export default router;
