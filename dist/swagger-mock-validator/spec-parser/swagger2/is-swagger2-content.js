"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSwagger2Content = void 0;
const isSwagger2Content = (specContent) => specContent.hasOwnProperty('swagger');
exports.isSwagger2Content = isSwagger2Content;
