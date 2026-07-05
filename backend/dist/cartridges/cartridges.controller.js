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
exports.CartridgesController = void 0;
const common_1 = require("@nestjs/common");
const cartridges_service_1 = require("./cartridges.service");
let CartridgesController = class CartridgesController {
    cartridgesService;
    constructor(cartridgesService) {
        this.cartridgesService = cartridgesService;
    }
    async findAll() {
        return this.cartridgesService.findAll();
    }
    async searchByGuid(guid) {
        if (!guid) {
            throw new common_1.BadRequestException('Параметр guid обязателен, Бэк ожидает /cartridges/search?guid=...');
        }
        const cartridge = await this.cartridgesService.findByGuid(guid);
        if (!cartridge) {
            throw new common_1.NotFoundException(`Картридж с GUID "${guid}" не найден`);
        }
        return cartridge;
    }
};
exports.CartridgesController = CartridgesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CartridgesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('guid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CartridgesController.prototype, "searchByGuid", null);
exports.CartridgesController = CartridgesController = __decorate([
    (0, common_1.Controller)('cartridges'),
    __metadata("design:paramtypes", [cartridges_service_1.CartridgesService])
], CartridgesController);
//# sourceMappingURL=cartridges.controller.js.map