"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const to_map_with_lower_case_keys_1 = require("./to-map-with-lower-case-keys");
const toParsedMockInteractionWithNormalizedHeaders = (parsedMockInteraction) => (Object.assign({}, parsedMockInteraction, { requestHeaders: to_map_with_lower_case_keys_1.toMapWithLowerCaseKeys(parsedMockInteraction.requestHeaders), responseHeaders: to_map_with_lower_case_keys_1.toMapWithLowerCaseKeys(parsedMockInteraction.responseHeaders) }));
exports.toNormalizedParsedMock = (parsedMock) => (Object.assign({}, parsedMock, { interactions: parsedMock.interactions.map(toParsedMockInteractionWithNormalizedHeaders) }));
