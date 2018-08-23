"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require("uuidjs");
class UuidGenerator {
    generate() {
        return uuid.generate();
    }
}
exports.UuidGenerator = UuidGenerator;
