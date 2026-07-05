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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartridgesService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let CartridgesService = class CartridgesService {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async findAll() {
        const result = await this.databaseService.query(`
      SELECT *
      FROM cartridges
      ORDER BY Model
      `);
        return result.rows;
    }
    async findByGuid(guid) {
        const result = await this.databaseService.query(`
      SELECT *
      FROM cartridges
      WHERE guid = $1
      `, [guid]);
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    }
};
exports.CartridgesService = CartridgesService;
exports.CartridgesService = CartridgesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], CartridgesService);
//# sourceMappingURL=cartridges.service.js.map