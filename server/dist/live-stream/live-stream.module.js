"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveStreamModule = void 0;
const common_1 = require("@nestjs/common");
const live_stream_gateway_1 = require("./live-stream.gateway");
const live_stream_service_1 = require("./live-stream.service");
let LiveStreamModule = class LiveStreamModule {
};
exports.LiveStreamModule = LiveStreamModule;
exports.LiveStreamModule = LiveStreamModule = __decorate([
    (0, common_1.Module)({
        providers: [live_stream_gateway_1.LiveStreamGateway, live_stream_service_1.LiveStreamService],
    })
], LiveStreamModule);
//# sourceMappingURL=live-stream.module.js.map