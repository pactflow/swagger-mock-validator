"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require("uuidjs");
const uuidGenerator = {
    generate: () => uuid.generate()
};
exports.default = uuidGenerator;
