import { Category, Coupon, Order, Product, User } from '../types';

export const categories: Category[] = [
  { id: 'cat-1', name: 'Selada', slug: 'selada', description: 'Renyah & Segar', imageUrl: 'assets/images/cat-selada.png' },
  { id: 'cat-2', name: 'Kangkung', slug: 'kangkung', description: 'Nutrisi Tinggi', imageUrl: 'assets/images/cat-kangkung.png' },
  { id: 'cat-3', name: 'Bayam', slug: 'bayam', description: 'Zat Besi Alami', imageUrl: 'assets/images/cat-bayam.png' },
  { id: 'cat-4', name: 'Pakcoy', slug: 'pakcoy', description: 'Sangat Renyah', imageUrl: 'assets/images/cat-pakcoy.png' },
  { id: 'cat-5', name: 'Herba', slug: 'herba', description: 'Aromatik Segar', imageUrl: 'assets/images/cat-herba.png' }
];

export const products: Product[] = [];

export const coupons: Coupon[] = [];

export const users: User[] = [];

export const orders: Order[] = [];
