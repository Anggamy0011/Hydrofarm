import { Request, Response } from 'express';
import { coupons } from '../data/store';

export const validateCoupon = (req: Request, res: Response) => {
  const { code, subtotal = 0 } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, message: 'Kode kupon wajib diisi' });
  }

  const couponCode = String(code).trim().toUpperCase();
  const coupon = coupons.find(c => c.code === couponCode && c.isActive);

  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Kode kupon tidak valid atau sudah kedaluwarsa' });
  }

  if (coupon.currentUses >= coupon.maxUses) {
    return res.status(400).json({ success: false, message: 'Kuota penggunaan kupon telah habis' });
  }

  if (subtotal < coupon.minPurchase) {
    return res.status(400).json({
      success: false,
      message: `Minimal pembelian untuk kupon ini adalah Rp ${coupon.minPurchase.toLocaleString('id-ID')}`
    });
  }

  let discountAmount = 0;
  if (coupon.discountType === 'FIXED') {
    discountAmount = coupon.discountValue;
  } else if (coupon.discountType === 'PERCENTAGE') {
    discountAmount = (subtotal * coupon.discountValue) / 100;
  }

  return res.json({
    success: true,
    message: `Kupon ${coupon.code} berhasil dipasang!`,
    data: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount
    }
  });
};
