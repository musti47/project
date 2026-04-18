import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { pbkdf2Sync, timingSafeEqual } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private verifyPassword(plainText: string, storedPassword: string) {
    if (!storedPassword) {
      return false;
    }

    if (storedPassword.startsWith('pbkdf2$')) {
      const [, iterationsRaw, salt, hash] = storedPassword.split('$');
      const iterations = Number(iterationsRaw || 0);
      if (!iterations || !salt || !hash) {
        return false;
      }

      const derived = pbkdf2Sync(plainText, salt, iterations, 64, 'sha512').toString('hex');
      return timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
    }

    return storedPassword === plainText;
  }

  async login(email: string, password: string) {
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password?.trim()) {
      throw new UnauthorizedException('Geçersiz giriş');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        restaurant: true,
      },
    });

    if (!user || !this.verifyPassword(password, user.password)) {
      throw new UnauthorizedException('Geçersiz giriş');
    }

    const secret = process.env.JWT_SECRET || 'development-secret';

    const token = jwt.sign(
      {
        userId: user.id,
        restaurantId: user.restaurantId,
        role: user.role,
      },
      secret,
      { expiresIn: '7d' },
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
        restaurantName: user.restaurant?.name ?? null,
      },
    };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        restaurant: {
          include: {
            settings: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      restaurant: user.restaurant,
    };
  }
}
