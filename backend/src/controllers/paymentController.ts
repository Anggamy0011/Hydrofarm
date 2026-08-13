import { Request, Response } from 'express';
import crypto from 'crypto';
import { orders } from '../data/store';
import { PaymentNotification } from '../types';

export const handleMidtransWebhook = (req: Request, res: Response) => {
  try {
    const notification: PaymentNotification = req.body;

    const { order_id, transaction_status, gross_amount, status_code, signature_key } = notification;

    console.log(`[Midtrans Webhook Received] Order: ${order_id}, Status: ${transaction_status}`);

    const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SANDBOX_KEY';

    // Verify SHA512 signature key if provided
    if (signature_key && status_code && gross_amount) {
      const payload = order_id + status_code + gross_amount + serverKey;
      const expectedSignature = crypto.createHash('sha512').update(payload).digest('hex');

      if (signature_key !== expectedSignature && process.env.NODE_ENV === 'production') {
        console.error('[Midtrans Webhook] Invalid signature key');
        return res.status(403).json({ success: false, message: 'Signature Key tidak valid' });
      }
    }

    const order = orders.find(o => o.orderNumber === order_id || o.id === order_id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      order.status = 'PAID';
      console.log(`[Order Paid] Order ${order_id} marked as PAID`);
    } else if (transaction_status === 'expire' || transaction_status === 'cancel' || transaction_status === 'deny') {
      order.status = 'CANCELLED';
      console.log(`[Order Cancelled] Order ${order_id} marked as CANCELLED`);
    }

    return res.json({
      success: true,
      message: 'Status pembayaran berhasil diproses'
    });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
