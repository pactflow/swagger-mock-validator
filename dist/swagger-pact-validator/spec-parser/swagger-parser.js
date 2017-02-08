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
            parsedPathNameSegment.parameter =
                _.find(pathParameters, { name: pathNameSegmentValue });
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
const addAdditionalPropertiesFalseToObjectSchema = (objectSchema) => {
    if (typeof objectSchema.additionalProperties !== 'object') {
        objectSchema.additionalProperties = false;
    }
    _.each(objectSchema.properties, addAdditionalPropertiesFalseToSchema);
};
const addAdditionalPropertiesFalseToSchema = (schema) => {
    if (!schema) {
        return schema;
    }
    if (schema.type === 'object') {
        addAdditionalPropertiesFalseToObjectSchema(schema);
    }
    else if (schema.type === 'array') {
        addAdditionalPropertiesFalseToSchema(schema.items);
    }
    return undefined;
};
const toParsedParameter = (parameter, name) => ({
    collectionFormat: parameter.value.collectionFormat,
    enum: parameter.value.enum,
    exclusiveMaximum: parameter.value.exclusiveMaximum,
    exclusiveMinimum: parameter.value.exclusiveMinimum,
    format: parameter.value.format,
    items: parameter.value.items,
    location: parameter.location,
    maxItems: parameter.value.maxItems,
    maxLength: parameter.value.maxLength,
    maximum: parameter.value.maximum,
    minItems: parameter.value.minItems,
    minLength: parameter.value.minLength,
    minimum: parameter.value.minimum,
    multipleOf: parameter.value.multipleOf,
    name,
    parentOperation: parameter.parentOperation,
    pattern: parameter.value.pattern,
    required: parameter.value.required || false,
    type: parameter.value.type,
    uniqueItems: parameter.value.uniqueItems,
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
const toSpecParameterCollection = (parameters) => _.reduce(parameters, (result, parameter) => {
    result[parameter.name.toLowerCase()] = parameter;
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
        requestHeaders: toSpecParameterCollection(toParsedParametersFor('header', mergedParameters)),
        requestPath: toParsedParametersFor('path', mergedParameters),
        requestQuery: toSpecParameterCollection(toParsedParametersFor('query', mergedParameters))
    };
};
const parseMimeType = (options) => {
    const operationValue = options.operation[options.mimeTypeName];
    const globalValue = options.swaggerJson[options.mimeTypeName];
    if (operationValue) {
        return {
            location: `${options.parsedOperation.location}.${options.mimeTypeName}`,
            parentOperation: options.parsedOperation,
            value: operationValue
        };
    }
    else if (globalValue) {
        return {
            location: `[swaggerRoot].${options.mimeTypeName}`,
            parentOperation: options.parsedOperation,
            value: globalValue
        };
    }
    return {
        location: `[swaggerRoot].${options.mimeTypeName}`,
        parentOperation: options.parsedOperation,
        value: []
    };
};
const getSecurityRequirementsAndBaseLocation = (operationSecurityRequirements, globalSecurityRequirements, parsedOperation) => {
    if (operationSecurityRequirements && operationSecurityRequirements.length > 0) {
        return {
            baseLocation: parsedOperation.location,
            securityRequirements: operationSecurityRequirements
        };
    }
    else {
        return {
            baseLocation: '[swaggerRoot]',
            securityRequirements: globalSecurityRequirements || []
        };
    }
};
const parseSecurityRequirements = (securityDefinitionsOrUndefined, operationSecurityRequirements, globalSecurityRequirements, parsedOperation) => {
    const securityDefinitions = securityDefinitionsOrUndefined || {};
    const securityRequirementsAndBaseLocation = getSecurityRequirementsAndBaseLocation(operationSecurityRequirements, globalSecurityRequirements, parsedOperation);
    return _(securityRequirementsAndBaseLocation.securityRequirements)
        .map((securityRequirement, index) => _.map(securityRequirement, (requirement, requirementName) => {
        const securityDefinition = securityDefinitions[requirementName];
        let credentialKey = 'authorization';
        let credentialLocation = 'header';
        if (securityDefinition.type === 'apiKey') {
            credentialKey = securityDefinition.name.toLowerCase();
            credentialLocation = securityDefinition.in;
        }
        return {
            credentialLocation,
            credentialKey,
            location: `${securityRequirementsAndBaseLocation.baseLocation}.security[${index}].${requirementName}`,
            parentOperation: parsedOperation,
            type: securityDefinition.type,
            value: requirement
        };
    }))
        .reject((requirements) => _.some(requirements, (requirement) => requirement.type === 'oauth2'))
        .value();
};
const parseOperationFromPath = (path, pathName, swaggerPathOrUrl, swaggerJson) => _(path)
    .omit(['parameters'])
    .map((operation, operationName) => {
    const pathLocation = `[swaggerRoot].paths.${pathName}`;
    const operationLocation = `${pathLocation}.${operationName}`;
    const parsedOperation = {
        location: operationLocation,
        method: operationName,
        pathName,
        swaggerFile: swaggerPathOrUrl,
        value: operation
    };
    const parsedParameters = parseParameters(path, pathLocation, parsedOperation);
    parsedOperation.parentOperation = parsedOperation;
    parsedOperation.pathNameSegments =
        parsePathNameSegments(pathName, parsedParameters.requestPath, parsedOperation);
    parsedOperation.produces = parseMimeType({
        mimeTypeName: 'produces',
        operation,
        parsedOperation,
        swaggerJson
    });
    parsedOperation.consumes = parseMimeType({
        mimeTypeName: 'consumes',
        operation,
        parsedOperation,
        swaggerJson
    });
    parsedOperation.requestBodyParameter = parsedParameters.requestBody;
    parsedOperation.requestHeaderParameters = parsedParameters.requestHeaders;
    parsedOperation.requestQueryParameters = parsedParameters.requestQuery;
    parsedOperation.responses = parseResponses(operation.responses, parsedOperation);
    parsedOperation.securityRequirements = parseSecurityRequirements(swaggerJson.securityDefinitions, operation.security, swaggerJson.security, parsedOperation);
    return parsedOperation;
})
    .value();
const createEmptyParentOperation = (swaggerPathOrUrl, location) => {
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
        swaggerFile: swaggerPathOrUrl,
        value: undefined
    };
    emptyParentOperation.parentOperation = emptyParentOperation;
    emptyParentOperation.responses.parentOperation = emptyParentOperation;
    return emptyParentOperation;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    parse: (swaggerJson, swaggerPathOrUrl) => ({
        operations: _(swaggerJson.paths)
            .map((path, pathName) => parseOperationFromPath(path, pathName, swaggerPathOrUrl, swaggerJson))
            .flatten()
            .value(),
        pathOrUrl: swaggerPathOrUrl,
        paths: {
            location: '[swaggerRoot].paths',
            parentOperation: createEmptyParentOperation(swaggerPathOrUrl, '[swaggerRoot].paths'),
            value: swaggerJson.paths
        }
    })
};
