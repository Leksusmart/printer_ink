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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
let AppController = class AppController {
    appService;
    constructor(appService) {
        this.appService = appService;
    }
    async getHello() {
        const users = await this.appService.findAll();
        return users;
    }
    async checkPhone(phone) {
        let checkedPhone = phone.trim();
        if (checkedPhone.length === 11 && checkedPhone.startsWith('7')) {
            checkedPhone = '+' + checkedPhone;
        }
        else if (checkedPhone.length === 11 && checkedPhone.startsWith('8')) {
            checkedPhone = '+7' + checkedPhone.slice(1);
        }
        if (!checkedPhone) {
            throw new common_1.NotFoundException('Параметр phone обязателен, Бэк ожидает /employers/search?phone=+79008000010');
        }
        const employer = await this.appService.findByPhone(checkedPhone);
        if (!employer) {
            throw new common_1.NotFoundException('Сотрудник с таким номером не найден');
        }
        return employer;
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('phone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "checkPhone", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('employers'),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map