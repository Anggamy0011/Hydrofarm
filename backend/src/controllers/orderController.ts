import { Response } from 'express';
import { orders, products, coupons } from '../data/store';
import { Order, OrderItem } from '../types';
import { AuthRequest } from '../middlewares/authMiddleware';

export const checkout = (req: AuthRequest, res: Response) => {
  try {
    const { items, couponCode, recipientName, recipientPhone, shippingAddress, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Keranjang belanja tidak boleh kosong' });
    }

    if (!recipientName || !recipientPhone || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Nama, telepon, dan alamat pengiriman wajib diisi' });
    }

    let subtotal = 0;
    const orderItems: OrderItem[] = [];

    // Lock & validate product stock
    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `Produk ${item.name || item.id} tidak tersedia` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stok produk ${product.name} tidak mencukupi (Tersisa: ${product.stock})`
        });
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        orderId: '', // populated below
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });
    }

    // Apply Coupon if present
    let discountAmount = 0;
    if (couponCode) {
      const codeUpper = String(couponCode).toUpperCase();
      const coupon = coupons.find(c => c.code === codeUpper && c.isActive);
      if (coupon) {
        if (coupon.discountType === 'FIXED') {
          discountAmount = coupon.discountValue;
        } else {
          discountAmount = (subtotal * coupon.discountValue) / 100;
        }
        coupon.currentUses += 1;
      }
    }

    const shippingCost = 10000;
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingCost);

    const orderNumber = `HF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = `ord-${Date.now()}`;

    // Link orderItems
    orderItems.forEach(i => (i.orderId = orderId));

    // Deduct stock
    items.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (product) {
        product.stock -= item.quantity;
      }
    });

    // Mock Midtrans Snap token generation
    const paymentToken = `SNAP-TOKEN-${Date.now()}`;
    const paymentUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${paymentToken}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      userId: req.user?.userId || 'guest',
      couponCode,
      status: 'PENDING',
      subtotal,
      discountAmount,
      shippingCost,
      totalAmount,
      recipientName,
      recipientPhone,
      shippingAddress,
      items: orderItems,
      paymentToken,
      paymentUrl,
      createdAt: new Date().toISOString()
    };

    orders.unshift(newOrder);

    return res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat',
      data: {
        order: newOrder,
        snapToken: paymentToken,
        redirectUrl: paymentUrl
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrders = (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  
  if (req.user?.role === 'ADMIN') {
    return res.json({ success: true, data: orders });
  }

  const userOrders = orders.filter(o => o.userId === userId);
  return res.json({ success: true, data: userOrders });
};

export const getOrderById = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const order = orders.find(o => o.id === id || o.orderNumber === id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
  }

  return res.json({ success: true, data: order });
};

export const updateOrderStatus = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = orders.find(o => o.id === id || o.orderNumber === id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
  }

  order.status = status;

  return res.json({
    success: true,
    message: `Status pesanan berhasil diperbarui menjadi ${status}`,
    data: order
  });
};
