import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Yetkisiz erişim');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Geçersiz token');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
      request.user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException('Oturum doğrulanamadı');
    }
  }
}
