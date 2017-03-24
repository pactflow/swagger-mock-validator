"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require("uuid");
const uuidGenerator = {
    generate: () => uuid.v4()
};
exports.default = uuidGenerator;
