'use strict';

const fs = require('fs');
const q = require('q');

module.exports = {readFile: q.nbind(fs.readFile, fs)};
