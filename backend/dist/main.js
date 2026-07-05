"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const port = Number(configService.get('PORT')) || 3000;
    const host = configService.get('HOST') || '0.0.0.0';
    await app.listen(port, host);
    const displayHost = host === '0.0.0.0' ? 'localhost' : host;
    console.log(`Application is running on: http://${displayHost}:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map