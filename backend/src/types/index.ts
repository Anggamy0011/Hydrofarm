export type UserRole = 'ADMIN' | 'CUSTOMER' | 'FARMER';

export interface User {
  id: string;
  name: string;
  email: string;
  googleId?: string;
  avatarUrl?: string;
  passwordHash: string;
  phone: string;
  role: UserRole;
  address: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

export interface Product {
  id: number | string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  unit: string;
  weight: string;
  badge: string;
  badgeClass: string;
  image: string;
  isActive: boolean;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  minPurchase: number;
  maxUses: number;
  currentUses: number;
  validUntil: string;
  isActive: boolean;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: number | string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  couponCode?: string;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  paymentToken?: string;
  paymentUrl?: string;
  createdAt: string;
}

export interface PaymentNotification {
  order_id: string;
  transaction_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_status: 'pending' | 'settlement' | 'expire' | 'cancel' | 'deny' | 'capture';
  signature_key?: string;
  status_code?: string;
}
