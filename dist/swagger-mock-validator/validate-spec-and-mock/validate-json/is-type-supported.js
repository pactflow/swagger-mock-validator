"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTypeSupported = void 0;
const isTypeSupported = (typeToCheck, typesInSchema) => Array.isArray(typesInSchema)
    ? typesInSchema.indexOf(typeToCheck) >= 0
    : typeToCheck === typesInSchema;
exports.isTypeSupported = isTypeSupported;
