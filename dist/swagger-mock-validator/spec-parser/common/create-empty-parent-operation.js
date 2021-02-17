"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmptyParentOperation = void 0;
const createEmptyParentOperation = (specPathOrUrl) => {
    const location = '';
    const emptyParentOperation = {
        consumes: {
            location,
            parentOperation: undefined,
            value: []
        },
        location,
        method: null,
        parentOperation: undefined,
        pathName: null,
        pathNameSegments: [],
        produces: {
            location,
            parentOperation: undefined,
            value: []
        },
        requestBodyParameter: undefined,
        requestHeaderParameters: {},
        requestQueryParameters: {},
        responses: {
            location,
            parentOperation: undefined,
            value: undefined
        },
        securityRequirements: [],
        specFile: specPathOrUrl,
        value: undefined
    };
    emptyParentOperation.parentOperation = emptyParentOperation;
    emptyParentOperation.responses.parentOperation = emptyParentOperation;
    return emptyParentOperation;
};
exports.createEmptyParentOperation = createEmptyParentOperation;
