"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pact_parser_1 = require("./mock-parser/pact/pact-parser");
const transform_string_to_object_1 = require("./transform-string-to-object");
const validate_and_resolve_pact_1 = require("./validate-and-resolve-pact");
class MockParser {
    static parse(mock) {
        const mockJson = transform_string_to_object_1.transformStringToObject(mock.content, mock.pathOrUrl);
        const resolvedPact = validate_and_resolve_pact_1.validateAndResolvePact(mockJson, mock.pathOrUrl);
        return pact_parser_1.pactParser.parse(resolvedPact, mock.pathOrUrl);
    }
}
exports.MockParser = MockParser;
