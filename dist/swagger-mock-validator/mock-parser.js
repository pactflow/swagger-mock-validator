"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pact_parser_1 = require("./mock-parser/pact-parser");
exports.mockParser = { parsePact: pact_parser_1.pactParser.parse };
