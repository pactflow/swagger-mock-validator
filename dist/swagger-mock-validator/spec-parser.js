"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const openapi3_parser_1 = require("./spec-parser/openapi3/openapi3-parser");
const validate_and_dereference_openapi3_spec_1 = require("./spec-parser/openapi3/validate-and-dereference-openapi3-spec");
const resolve_spec_format_1 = require("./spec-parser/resolve-spec-format");
const swagger2_parser_1 = require("./spec-parser/swagger2/swagger2-parser");
const validate_and_dereference_swagger2_spec_1 = require("./spec-parser/swagger2/validate-and-dereference-swagger2-spec");
const transform_string_to_object_1 = require("./transform-string-to-object");
class SpecParser {
    static parse(spec) {
        return __awaiter(this, void 0, void 0, function* () {
            const specJson = transform_string_to_object_1.transformStringToObject(spec.content, spec.pathOrUrl);
            const format = resolve_spec_format_1.resolveSpecFormat(spec.format, specJson, spec.pathOrUrl);
            return format === 'swagger2'
                ? this.validateAndParseSwagger2(specJson, spec.pathOrUrl)
                : this.validateAndParseOpenApi3(specJson, spec.pathOrUrl);
        });
    }
    static validateAndParseSwagger2(specJson, pathOrUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const spec = yield validate_and_dereference_swagger2_spec_1.validateAndDereferenceSwagger2Spec(specJson, pathOrUrl);
            return swagger2_parser_1.swagger2Parser.parse(spec, pathOrUrl);
        });
    }
    static validateAndParseOpenApi3(specJson, pathOrUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const spec = yield validate_and_dereference_openapi3_spec_1.validateAndDereferenceOpenApi3Spec(specJson, pathOrUrl);
            return openapi3_parser_1.openApi3Parser.parse(spec, pathOrUrl);
        });
    }
}
exports.SpecParser = SpecParser;
