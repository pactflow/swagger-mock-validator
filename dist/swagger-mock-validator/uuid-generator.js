"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UuidGenerator = void 0;
const uuid = require("uuidjs");
class UuidGenerator {
    generate() {
        return uuid.generate();
    }
}
exports.UuidGenerator = UuidGenerator;
