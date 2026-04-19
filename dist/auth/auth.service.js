"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const jwt = __importStar(require("jsonwebtoken"));
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    verifyPassword(plainText, storedPassword) {
        if (!storedPassword) {
            return false;
        }
        if (storedPassword.startsWith('pbkdf2$')) {
            const [, iterationsRaw, salt, hash] = storedPassword.split('$');
            const iterations = Number(iterationsRaw || 0);
            if (!iterations || !salt || !hash) {
                return false;
            }
            const derived = (0, crypto_1.pbkdf2Sync)(plainText, salt, iterations, 64, 'sha512').toString('hex');
            return (0, crypto_1.timingSafeEqual)(Buffer.from(derived), Buffer.from(hash));
        }
        return storedPassword === plainText;
    }
    async login(email, password) {
        const normalizedEmail = email?.trim().toLowerCase();
        if (!normalizedEmail || !password?.trim()) {
            throw new common_1.UnauthorizedException('Geçersiz giriş');
        }
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: {
                restaurant: true,
            },
        });
        if (!user || !this.verifyPassword(password, user.password)) {
            throw new common_1.UnauthorizedException('Geçersiz giriş');
        }
        const secret = process.env.JWT_SECRET || 'development-secret';
        const token = jwt.sign({
            userId: user.id,
            restaurantId: user.restaurantId,
            role: user.role,
        }, secret, { expiresIn: '7d' });
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
    async me(userId) {
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
            throw new common_1.UnauthorizedException('Kullanıcı bulunamadı');
        }
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            restaurantId: user.restaurantId,
            restaurant: user.restaurant,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map