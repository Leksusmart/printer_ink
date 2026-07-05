"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const database_module_1 = require("./database/database.module");
const database_service_1 = require("./database/database.service");
const cartridges_module_1 = require("./cartridges/cartridges.module");
const cartridges_controller_1 = require("./cartridges/cartridges.controller");
const cartridges_service_1 = require("./cartridges/cartridges.service");
const employers_module_1 = require("./employers/employers.module");
const employers_controller_1 = require("./employers/employers.controller");
const employers_service_1 = require("./employers/employers.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            database_module_1.DatabaseModule,
            cartridges_module_1.CartridgesModule,
            employers_module_1.EmployersModule,
        ],
        controllers: [
            app_controller_1.AppController,
            cartridges_controller_1.CartridgesController,
            employers_controller_1.EmployersController,
        ],
        providers: [
            app_service_1.AppService,
            database_service_1.DatabaseService,
            cartridges_service_1.CartridgesService,
            employers_service_1.EmployersService,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map