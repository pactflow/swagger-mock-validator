"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openApi3Parser = void 0;
const create_empty_parent_operation_1 = require("../common/create-empty-parent-operation");
const parse_operation_1 = require("./openapi3-parser/parse-operation");
const typeSafeHttpMethods = {
    delete: null, get: null, head: null, options: null, patch: null, post: null, put: null, trace: null
};
const supportedHttpMethods = Object.keys(typeSafeHttpMethods);
const isHttpMethod = (value) => supportedHttpMethods.indexOf(value) >= 0;
const getPathHttpMethodNames = (pathItem) => Object.keys(pathItem).filter(isHttpMethod);
const parsePathOperations = (pathName, specJson, rootLocation, specPathOrUrl) => {
    const path = specJson.paths[pathName];
    return getPathHttpMethodNames(path)
        .map((pathHttpMethod) => {
        const pathLocation = `${rootLocation}.paths.${pathName}`;
        return (0, parse_operation_1.parseOperation)({
            operation: path[pathHttpMethod],
            operationLocation: `${pathLocation}.${pathHttpMethod}`,
            operationName: pathHttpMethod,
            pathItemParameters: path.parameters,
            pathLocation,
            pathName,
            spec: specJson,
            specPathOrUrl
        });
    });
};
const parseOperations = (specJson, rootLocation, specPathOrUrl) => {
    return Object.keys(specJson.paths)
        .map((pathName) => parsePathOperations(pathName, specJson, rootLocation, specPathOrUrl))
        .reduce((accumulator, nextOperations) => [...accumulator, ...nextOperations], []);
};
exports.openApi3Parser = {
    parse: (specJson, specPathOrUrl) => {
        const rootLocation = '[root]';
        return {
            operations: parseOperations(specJson, rootLocation, specPathOrUrl),
            pathOrUrl: specPathOrUrl,
            paths: {
                location: `${rootLocation}.paths`,
                parentOperation: (0, create_empty_parent_operation_1.createEmptyParentOperation)(specPathOrUrl),
                value: specJson.paths
            }
        };
    }
};
