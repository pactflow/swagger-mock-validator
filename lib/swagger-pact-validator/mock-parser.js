'use strict';

const pactParser = require('./mock-parser/pact-parser');

module.exports = {parsePact: pactParser.parse};
