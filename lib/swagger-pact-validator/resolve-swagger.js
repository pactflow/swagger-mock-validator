'use strict';

const q = require('q');
const swaggerTools = require('swagger-tools');

module.exports = q.nbind(swaggerTools.specs.v2.resolve, swaggerTools.specs.v2);
