"use strict";
const _ = require("lodash");
const toParsedSpecValue = (parameters, parentLocation, parentOperation) => _.map(parameters, (parameter, index) => ({
    location: `${parentLocation}.parameters[${index}]`,
    parentOperation,
    value: parameter
}));
const mergePathAndOperationParameters = (pathParameters, operationParameters) => {
    const mergedParameters = _.clone(pathParameters);
    _.each(operationParameters, (operationParameter) => {
        const duplicateIndex = _.findIndex(mergedParameters, {
            value: {
                in: operationParameter.value.in,
                name: operationParameter.value.name
            }
        });
        if (duplicateIndex > -1) {
            mergedParameters[duplicateIndex] = operationParameter;
        }
        else {
            mergedParameters.push(operationParameter);
        }
    });
    return mergedParameters;
};
const parsePathNameSegments = (pathName, pathParameters, parsedOperation) => {
    return _(pathName.split('/'))
        .filter((pathNameSegment) => pathNameSegment.length > 0)
        .map((pathNameSegment) => {
        const parsedPathNameSegment = { parentOperation: parsedOperation };
        const isParameter = pathNameSegment[0] === '{' && pathNameSegment[pathNameSegment.length - 1] === '}';
        if (isParameter) {
            const pathNameSegmentValue = pathNameSegment.substring(1, pathNameSegment.length - 1);
            parsedPathNameSegment.parameter = _.find(pathParameters, { name: pathNameSegmentValue });
            parsedPathNameSegment.validatorType = 'jsonSchema';
            parsedPathNameSegment.value = pathNameSegmentValue;
        }
        else {
            parsedPathNameSegment.validatorType = 'equal';
            parsedPathNameSegment.value = pathNameSegment;
        }
        return parsedPathNameSegment;
    })
        .value();
};
const removeRequiredPropertiesFromSchema = (schema) => {
    if (!schema) {
        return schema;
    }
    if (schema.required) {
        delete schema.required;
    }
    removeRequiredPropertiesFromSchema(schema.items);
    _.each(schema.properties, removeRequiredPropertiesFromSchema);
    return undefined;
};
const addAdditionalPropertiesFalseToSchema = (schema) => {
    if (!schema) {
        return schema;
    }
    if (schema.type === 'object') {
        schema.additionalProperties = false;
        _.each(schema.properties, addAdditionalPropertiesFalseToSchema);
    }
    else if (schema.type === 'array') {
        addAdditionalPropertiesFalseToSchema(schema.items);
    }
    return undefined;
};
const toParsedParameter = (parameter, name) => ({
    enum: parameter.value.enum,
    exclusiveMaximum: parameter.value.exclusiveMaximum,
    exclusiveMinimum: parameter.value.exclusiveMinimum,
    format: parameter.value.format,
    location: parameter.location,
    maxLength: parameter.value.maxLength,
    maximum: parameter.value.maximum,
    minLength: parameter.value.minLength,
    minimum: parameter.value.minimum,
    multipleOf: parameter.value.multipleOf,
    name,
    parentOperation: parameter.parentOperation,
    pattern: parameter.value.pattern,
    required: parameter.value.required || false,
    type: parameter.value.type,
    value: parameter.value
});
const parseResponseHeaders = (headers, responseLocation, parentOperation) => _.reduce(headers, (result, header, headerName) => {
    const value = {
        location: `${responseLocation}.headers.${headerName}`,
        parentOperation,
        value: header
    };
    result[headerName.toLowerCase()] = toParsedParameter(value, headerName);
    return result;
}, {});
const parseResponses = (responses, parentOperation) => {
    const parsedResponses = {
        location: `${parentOperation.location}.responses`,
        parentOperation,
        value: responses
    };
    _.each(responses, (response, responseStatus) => {
        const responseLocation = `${parsedResponses.location}.${responseStatus}`;
        const originalSchema = response.schema;
        const modifiedSchema = _.cloneDeep(originalSchema);
        removeRequiredPropertiesFromSchema(modifiedSchema);
        addAdditionalPropertiesFalseToSchema(modifiedSchema);
        parsedResponses[responseStatus] = {
            getFromSchema: (pathToGet) => ({
                location: `${responseLocation}.schema.${pathToGet}`,
                parentOperation,
                value: _.get(originalSchema, pathToGet)
            }),
            headers: parseResponseHeaders(response.headers, responseLocation, parentOperation),
            location: responseLocation,
            parentOperation,
            schema: modifiedSchema,
            value: response
        };
    });
    return parsedResponses;
};
const toHeaderCollection = (headerParameters) => _.reduce(headerParameters, (result, headerParameter) => {
    result[headerParameter.name.toLowerCase()] = headerParameter;
    return result;
}, {});
const toRequestBodyParameter = (parameters) => _(parameters)
    .filter((parameter) => parameter.value.in === 'body')
    .map((parameter) => ({
    getFromSchema: (pathToGet) => ({
        location: `${parameter.location}.schema.${pathToGet}`,
        parentOperation: parameter.parentOperation,
        value: _.get(parameter.value.schema, pathToGet)
    }),
    location: parameter.location,
    name: parameter.value.name,
    parentOperation: parameter.parentOperation,
    required: parameter.value.required,
    schema: parameter.value.schema,
    value: parameter.value
}))
    .first();
const toParsedParametersFor = (inValue, parameters) => _(parameters)
    .filter({ value: { in: inValue } })
    .map((parameter) => toParsedParameter(parameter, parameter.value.name))
    .value();
const parseParameters = (path, pathLocation, parsedOperation) => {
    const pathParameters = toParsedSpecValue(path.parameters, pathLocation, parsedOperation);
    const operationParameters = toParsedSpecValue(parsedOperation.value.parameters, parsedOperation.location, parsedOperation);
    const mergedParameters = mergePathAndOperationParameters(pathParameters, operationParameters);
    return {
        requestBody: toRequestBodyParameter(mergedParameters),
        requestHeaders: toHeaderCollection(toParsedParametersFor('header', mergedParameters)),
        requestPath: toParsedParametersFor('path', mergedParameters)
    };
};
const parseOperationFromPath = (path, pathName) => _(path)
    .omit(['parameters'])
    .map((operation, operationName) => {
    const pathLocation = `[swaggerRoot].paths.${pathName}`;
    const operationLocation = `${pathLocation}.${operationName}`;
    const parsedOperation = {
        location: operationLocation,
        method: operationName,
        pathName,
        value: operation
    };
    const parsedParameters = parseParameters(path, pathLocation, parsedOperation);
    parsedOperation.parentOperation = parsedOperation;
    parsedOperation.pathNameSegments =
        parsePathNameSegments(pathName, parsedParameters.requestPath, parsedOperation);
    parsedOperation.requestBodyParameter = parsedParameters.requestBody;
    parsedOperation.requestHeaderParameters = parsedParameters.requestHeaders;
    parsedOperation.responses = parseResponses(operation.responses, parsedOperation);
    return parsedOperation;
})
    .value();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    parse: (swaggerJson, swaggerPathOrUrl) => ({
        operations: _(swaggerJson.paths)
            .map(parseOperationFromPath)
            .flatten()
            .value(),
        pathOrUrl: swaggerPathOrUrl,
        paths: {
            location: '[swaggerRoot].paths',
            parentOperation: {
                location: null,
                method: null,
                parentOperation: null,
                pathName: null,
                pathNameSegments: [],
                requestBodyParameter: null,
                requestHeaderParameters: null,
                responses: null,
                value: null
            },
            value: swaggerJson.paths
        }
    })
};
