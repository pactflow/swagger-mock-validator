"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMapWithLowerCaseKeys = (originalMap) => Object.keys(originalMap).reduce((lowerCaseMap, originalKey) => {
    lowerCaseMap[originalKey.toLowerCase()] = originalMap[originalKey];
    return lowerCaseMap;
}, {});
