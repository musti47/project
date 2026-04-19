"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const payments_service_1 = require("./payments.service");
let PaymentsController = class PaymentsController {
    paymentsService;
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    createCustomerPayment(body) {
        return this.paymentsService.createCustomerPayment(body.sessionId, body.amount, body.idempotencyKey);
    }
    payItems(body) {
        return this.paymentsService.payItems(body.sessionId, body.itemIds, body.idempotencyKey);
    }
    createEqualSplit(body) {
        return this.paymentsService.createEqualSplitForSession(body.sessionId, body.personCount);
    }
    findPendingSplitsBySession(sessionId) {
        return this.paymentsService.getPendingSplitPaymentsBySession(sessionId);
    }
    payPendingSplit(paymentId, body) {
        return this.paymentsService.payPendingSplitPayment(paymentId, body.sessionId);
    }
    findPendingSplits(tableId, req) {
        return this.paymentsService.findPendingSplitPayments(tableId, req.user);
    }
    markAsSucceeded(id, body) {
        return this.paymentsService.markAsSucceeded(id, body.providerPaymentId);
    }
    manualPay(id, body, req) {
        return this.paymentsService.markAsManual(id, body.method, req.user);
    }
    manualCustom(tableId, body, req) {
        return this.paymentsService.createManualCustomPayment(tableId, body.amount, body.method, req.user);
    }
    manualSettlement(tableId, body, req) {
        return this.paymentsService.settleRemainingManually(tableId, body.method, req.user);
    }
    cancelSplit(tableId, req) {
        return this.paymentsService.cancelSplit(tableId, req.user);
    }
    webhook(body) {
        const mapStatus = (status) => {
            if (status === "PENDING")
                return "PENDING";
            if (status === "SUCCEEDED")
                return "SUCCEEDED";
            if (status === "FAILED")
                return "FAILED";
            return "FAILED";
        };
        const sanitizedBody = {
            paymentId: body.paymentId,
            providerPaymentId: body.providerPaymentId,
            status: mapStatus(body.status),
        };
        return this.paymentsService.webhook(sanitizedBody);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('customer/custom'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createCustomerPayment", null);
__decorate([
    (0, common_1.Post)('customer/items'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "payItems", null);
__decorate([
    (0, common_1.Post)('customer/split/equal'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createEqualSplit", null);
__decorate([
    (0, common_1.Get)('session/:sessionId/pending-splits'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findPendingSplitsBySession", null);
__decorate([
    (0, common_1.Post)('customer/split/:paymentId/pay'),
    __param(0, (0, common_1.Param)('paymentId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "payPendingSplit", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('table/:tableId/pending-splits'),
    __param(0, (0, common_1.Param)('tableId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findPendingSplits", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/success'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "markAsSucceeded", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/manual'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "manualPay", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('table/:tableId/manual-custom'),
    __param(0, (0, common_1.Param)('tableId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "manualCustom", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('table/:tableId/manual-settlement'),
    __param(0, (0, common_1.Param)('tableId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "manualSettlement", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('table/:tableId/cancel-split'),
    __param(0, (0, common_1.Param)('tableId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "cancelSplit", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "webhook", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map