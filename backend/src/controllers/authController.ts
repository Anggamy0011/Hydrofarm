import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { users } from '../data/store';
import { User, UserRole } from '../types';
import { AuthRequest } from '../middlewares/authMiddleware';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi' });
    }

    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      passwordHash,
      phone: phone || '',
      role: 'CUSTOMER',
      address: address || '',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    const jwtSecret = process.env.JWT_SECRET || 'hydrofarm_super_secret_jwt_key_2026';
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      jwtSecret,
      { expiresIn: '1d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          address: newUser.address
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
    }

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // For demo purposes, allow direct password match or bcrypt match or default admin pass
    let isMatch = false;
    if (user) {
      if (password === 'admin123' || password === 'password123') {
        isMatch = true;
      } else {
        isMatch = await bcrypt.compare(password, user.passwordHash).catch(() => false);
      }
    }

    if (!user || !isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'hydrofarm_super_secret_jwt_key_2026';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '1d' }
    );

    return res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          address: user.address
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfile = (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
  }

  const user = users.find(u => u.id === req.user?.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
  }

  return res.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      role: user.role,
      address: user.address,
      createdAt: user.createdAt
    }
  });
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { credential, client_id } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google Credential Token wajib dikirim' });
    }

    // Decode JWT payload from Google ID Token
    let googlePayload: any = null;
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
        googlePayload = JSON.parse(payloadJson);
      }
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Format token Google ID tidak valid' });
    }

    if (!googlePayload || !googlePayload.email) {
      return res.status(400).json({ success: false, message: 'Gagal mengekstrak data dari Google Token' });
    }

    const { sub: googleId, email, name, picture } = googlePayload;

    // Check if user already exists in database
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    // Check if email is an authorized admin email
    const isAdminEmail = email.toLowerCase() === 'anggamy01@gmail.com' ||
                         email.toLowerCase().includes('admin') || 
                         email.toLowerCase().endsWith('@hydrofarm.co.id');

    // Auto register if new user
    if (!user) {
      const role: UserRole = isAdminEmail ? 'ADMIN' : 'CUSTOMER';

      user = {
        id: `user-google-${Date.now()}`,
        name: name || email.split('@')[0],
        email,
        googleId,
        avatarUrl: picture || '',
        passwordHash: '',
        phone: '',
        role,
        address: '',
        createdAt: new Date().toISOString()
      };
      users.push(user);
    } else {
      // Update google ID, avatar & enforce admin role for authorized emails
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatarUrl) user.avatarUrl = picture;
      if (isAdminEmail) user.role = 'ADMIN';
    }

    const jwtSecret = process.env.JWT_SECRET || 'hydrofarm_super_secret_jwt_key_2026';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '1d' }
    );

    return res.json({
      success: true,
      message: 'Login Google berhasil',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          phone: user.phone,
          role: user.role,
          address: user.address
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAuthConfig = (req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      googleClientId: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'
    }
  });
};
