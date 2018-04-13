"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require("uuidjs");
exports.defaultUuidGenerator = {
    generate: () => uuid.generate()
};
