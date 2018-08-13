import {ParsedSpecOperation} from '../parsed-spec';

export const createEmptyParentOperation = (specPathOrUrl: string, location: string): ParsedSpecOperation => {
    const emptyParentOperation = {
        consumes: {
            location,
            parentOperation: undefined as any,
            value: []
        },
        location,
        method: null,
        parentOperation: undefined as any,
        pathName: null,
        pathNameSegments: [],
        produces: {
            location,
            parentOperation: undefined as any,
            value: []
        },
        requestBodyParameter: undefined,
        requestHeaderParameters: {},
        requestQueryParameters: {},
        responses: {
            location,
            parentOperation: undefined as any,
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
