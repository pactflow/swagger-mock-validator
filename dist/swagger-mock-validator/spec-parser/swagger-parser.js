"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const removeRequiredPropertiesFromSchema = (schema) => {
    if (schema) {
        _.each(schema.allOf, removeRequiredPropertiesFromSchema);
        delete schema.required;
        removeRequiredPropertiesFromSchema(schema.items);
        _.each(schema.properties, removeRequiredPropertiesFromSchema);
    }
};
const addAdditionalPropertiesFalseToObjectSchema = (objectSchema) => {
    if (typeof objectSchema.additionalProperties !== 'object') {
        objectSchema.additionalProperties = false;
    }
    _.each(objectSchema.properties, addAdditionalPropertiesFalseToSchema);
};
const addAdditionalPropertiesFalseToSchema = (schema) => {
    if (!schema) {
        return;
    }
    if (schema.type === 'object') {
        addAdditionalPropertiesFalseToObjectSchema(schema);
    }
    else if (schema.type === 'array') {
        addAdditionalPropertiesFalseToSchema(schema.items);
    }
    return;
};
const modifySchemaForResponses = (schema) => {
    const modifiedSchema = _.cloneDeep(schema);
    removeRequiredPropertiesFromSchema(modifiedSchema);
    return modifiedSchema;
};
const parseDefinitionsForResponses = (definitions) => {
    if (!definitions) {
        return {};
    }
    return Object.keys(definitions).reduce((parsedDefinitions, definitionName) => {
        const definitionSchema = definitions[definitionName];
        parsedDefinitions[definitionName] = modifySchemaForResponses(definitionSchema);
        return parsedDefinitions;
    }, {});
};
const toParsedSpecValue = (parameters, parentLocation, parentOperation) => _.map(parameters, (parameter, index) => ({
    location: `${parentLocation}.parameters[${index}]`,
    parentOperation,
    value: parameter
}));
const mergePathAndOperationParameters = (pathParameters, operationParameters) => {
    const mergedParameters = _.clone(pathParameters);
    for (const operationParameter of operationParameters) {
        const duplicateIndex = mergedParameters.findIndex((mergedParameter) => mergedParameter.value.in === operationParameter.value.in &&
            mergedParameter.value.name === operationParameter.value.name);
        if (duplicateIndex > -1) {
            mergedParameters[duplicateIndex] = operationParameter;
        }
        else {
            mergedParameters.push(operationParameter);
        }
    }
    return mergedParameters;
};
const parsePathNameSegments = (pathName, pathParameters, parsedOperation, basePath) => {
    const path = (basePath) ? basePath + pathName : pathName;
    return _(path.split('/'))
        .filter((pathNameSegment) => pathNameSegment.length > 0)
        .map((pathNameSegment) => {
        let parsedPathNameSegment;
        const isParameter = pathNameSegment[0] === '{' && pathNameSegment[pathNameSegment.length - 1] === '}';
        if (isParameter) {
            const pathNameSegmentValue = pathNameSegment.substring(1, pathNameSegment.length - 1);
            parsedPathNameSegment = {
                location: parsedOperation.location,
                parameter: _.find(pathParameters, { name: pathNameSegmentValue }),
                parentOperation: parsedOperation,
                validatorType: 'jsonSchema',
                value: pathNameSegmentValue
            };
        }
        else {
            parsedPathNameSegment = {
                location: parsedOperation.location,
                parentOperation: parsedOperation,
                validatorType: 'equal',
                value: pathNameSegment
            };
        }
        return parsedPathNameSegment;
    })
        .value();
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
const parseResponseHeaders = (headers, responseLocation, parentOperation) => {
    if (!headers) {
        return {};
    }
    return Object.keys(headers).reduce((result, headerName) => {
        const header = headers[headerName];
        const value = {
            location: `${responseLocation}.headers.${headerName}`,
            parentOperation,
            value: header
        };
        result[headerName.toLowerCase()] = toParsedParameter(value, headerName);
        return result;
    }, {});
};
const parseResponses = (responses, parentOperation, definitions) => {
    // tslint:disable:no-object-literal-type-assertion
    const parsedResponses = {
        location: `${parentOperation.location}.responses`,
        parentOperation,
        value: responses
    };
    const parsedDefinitions = parseDefinitionsForResponses(definitions);
    _.each(responses, (response, responseStatus) => {
        const responseLocation = `${parsedResponses.location}.${responseStatus}`;
        const originalSchema = response.schema;
        let modifiedSchema;
        if (response.schema) {
            modifiedSchema = modifySchemaForResponses(response.schema);
            modifiedSchema.definitions = parsedDefinitions;
        }
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
const toRequestBodyParameter = (parameters, definitions) => _(parameters)
    .filter((parameter) => parameter.value.in === 'body')
    .map((parameter) => {
    const modifiedSchema = _.cloneDeep(parameter.value.schema);
    modifiedSchema.definitions = definitions;
    return {
        getFromSchema: (pathToGet) => ({
            location: `${parameter.location}.schema.${pathToGet}`,
            parentOperation: parameter.parentOperation,
            value: _.get(parameter.value.schema, pathToGet)
        }),
        location: parameter.location,
        name: parameter.value.name,
        parentOperation: parameter.parentOperation,
        required: parameter.value.required,
        schema: modifiedSchema,
        value: parameter.value
    };
})
    .first();
const toParsedParametersFor = (inValue, parameters) => _(parameters)
    .filter({ value: { in: inValue } })
    .map((parameter) => toParsedParameter(parameter, parameter.value.name))
    .value();
const parseParameters = (path, pathLocation, parsedOperation, definitions) => {
    const pathParameters = toParsedSpecValue(path.parameters, pathLocation, parsedOperation);
    const operationParameters = toParsedSpecValue(parsedOperation.value.parameters, parsedOperation.location, parsedOperation);
    const mergedParameters = mergePathAndOperationParameters(pathParameters, operationParameters);
    return {
        requestBody: toRequestBodyParameter(mergedParameters, definitions),
        requestHeaders: toSpecParameterCollection(toParsedParametersFor('header', mergedParameters)),
        requestPath: toParsedParametersFor('path', mergedParameters),
        requestQuery: toSpecParameterCollection(toParsedParametersFor('query', mergedParameters))
    };
};
const parseMimeType = (options) => {
    const operationValue = options.operation[options.mimeTypeName];
    const globalValue = options.specJson[options.mimeTypeName];
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
            credentialKey,
            credentialLocation,
            location: `${securityRequirementsAndBaseLocation.baseLocation}.security[${index}].${requirementName}`,
            parentOperation: parsedOperation,
            type: securityDefinition.type,
            value: requirement
        };
    }))
        .reject((requirements) => _.some(requirements, (requirement) => requirement.type === 'oauth2'))
        .value();
};
const parseOperationFromPath = (path, pathName, specPathOrUrl, specJson) => _(path)
    .omit(['parameters'])
    .map((operation, operationName) => {
    const pathLocation = `[swaggerRoot].paths.${pathName}`;
    const operationLocation = `${pathLocation}.${operationName}`;
    const parsedOperation = {
        location: operationLocation,
        method: operationName,
        pathName,
        specFile: specPathOrUrl,
        value: operation
    };
    const parsedParameters = parseParameters(path, pathLocation, parsedOperation, specJson.definitions);
    parsedOperation.parentOperation = parsedOperation;
    parsedOperation.pathNameSegments =
        parsePathNameSegments(pathName, parsedParameters.requestPath, parsedOperation, specJson.basePath);
    parsedOperation.produces = parseMimeType({
        mimeTypeName: 'produces',
        operation,
        parsedOperation,
        specJson
    });
    parsedOperation.consumes = parseMimeType({
        mimeTypeName: 'consumes',
        operation,
        parsedOperation,
        specJson
    });
    parsedOperation.requestBodyParameter = parsedParameters.requestBody;
    parsedOperation.requestHeaderParameters = parsedParameters.requestHeaders;
    parsedOperation.requestQueryParameters = parsedParameters.requestQuery;
    parsedOperation.responses = parseResponses(operation.responses, parsedOperation, specJson.definitions);
    parsedOperation.securityRequirements = parseSecurityRequirements(specJson.securityDefinitions, operation.security, specJson.security, parsedOperation);
    return parsedOperation;
})
    .value();
const createEmptyParentOperation = (specPathOrUrl, location) => {
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
exports.swaggerParser = {
    parse: (specJson, specPathOrUrl) => ({
        operations: _(specJson.paths)
            .map((path, pathName) => parseOperationFromPath(path, pathName, specPathOrUrl, specJson))
            .flatten()
            .value(),
        pathOrUrl: specPathOrUrl,
        paths: {
            location: '[swaggerRoot].paths',
            parentOperation: createEmptyParentOperation(specPathOrUrl, '[swaggerRoot].paths'),
            value: specJson.paths
        }
    })
};
