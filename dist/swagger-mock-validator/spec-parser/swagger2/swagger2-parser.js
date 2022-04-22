"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swagger2Parser = void 0;
const _ = require("lodash");
const create_empty_parent_operation_1 = require("../common/create-empty-parent-operation");
const parse_path_name_segments_1 = require("../common/parse-path-name-segments");
const toParsedSpecValue = (parameters, parentLocation, parentOperation) => _.map(parameters, (parameter, index) => ({
    location: `${parentLocation}.parameters[${index}]`,
    parentOperation,
    value: parameter
}));
const addDefinitionsToSchema = (schema, spec) => {
    if (schema) {
        const modifiedSchema = _.cloneDeep(schema);
        modifiedSchema.definitions = spec.definitions;
        return modifiedSchema;
    }
    return undefined;
};
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
const toParsedParameter = (parameter, name) => ({
    collectionFormat: parameter.value.collectionFormat,
    location: parameter.location,
    name,
    parentOperation: parameter.parentOperation,
    required: parameter.value.required || false,
    schema: {
        enum: parameter.value.enum,
        exclusiveMaximum: parameter.value.exclusiveMaximum,
        exclusiveMinimum: parameter.value.exclusiveMinimum,
        format: parameter.value.format,
        items: parameter.value.items,
        maxItems: parameter.value.maxItems,
        maxLength: parameter.value.maxLength,
        maximum: parameter.value.maximum,
        minItems: parameter.value.minItems,
        minLength: parameter.value.minLength,
        minimum: parameter.value.minimum,
        multipleOf: parameter.value.multipleOf,
        pattern: parameter.value.pattern,
        type: parameter.value.type,
        uniqueItems: parameter.value.uniqueItems
    },
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
        result[headerName] = toParsedParameter(value, headerName);
        return result;
    }, {});
};
const parseResponses = (operation, parentOperation, specJson) => {
    const responses = operation.responses;
    // tslint:disable:no-object-literal-type-assertion
    const parsedResponses = {
        location: `${parentOperation.location}.responses`,
        parentOperation,
        value: responses
    };
    const produces = parseMimeType({
        mimeTypeName: 'produces',
        operation,
        parsedOperation: parentOperation,
        specJson
    });
    _.each(responses, (response, responseStatus) => {
        const responseLocation = `${parsedResponses.location}.${responseStatus}`;
        const originalSchema = response.schema;
        parsedResponses[responseStatus] = {
            getFromSchema: (pathToGet) => ({
                location: `${responseLocation}.schema.${pathToGet}`,
                parentOperation,
                value: _.get(originalSchema, pathToGet)
            }),
            headers: parseResponseHeaders(response.headers, responseLocation, parentOperation),
            location: responseLocation,
            parentOperation,
            produces,
            schema: addDefinitionsToSchema(response.schema, specJson),
            value: response
        };
    });
    return parsedResponses;
};
const toSpecParameterCollection = (parameters) => _.reduce(parameters, (result, parameter) => {
    result[parameter.name] = parameter;
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
            location: `[root].${options.mimeTypeName}`,
            parentOperation: options.parsedOperation,
            value: globalValue
        };
    }
    return {
        location: `[root].${options.mimeTypeName}`,
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
            baseLocation: '[root]',
            securityRequirements: globalSecurityRequirements || []
        };
    }
};
const getCredentialKeyAndLocation = (scheme) => {
    switch (scheme.type) {
        case 'apiKey':
            return { credentialKey: scheme.name, credentialLocation: scheme.in };
        case 'basic':
            return { credentialKey: 'authorization', credentialLocation: 'header' };
        default:
            return { credentialKey: 'unknown', credentialLocation: 'unsupported' };
    }
};
const parseSecurityRequirements = (securityDefinitionsOrUndefined, operationSecurityRequirements, globalSecurityRequirements, parsedOperation) => {
    const securityDefinitions = securityDefinitionsOrUndefined || {};
    const securityRequirementsAndBaseLocation = getSecurityRequirementsAndBaseLocation(operationSecurityRequirements, globalSecurityRequirements, parsedOperation);
    return _(securityRequirementsAndBaseLocation.securityRequirements)
        .map((securityRequirement, index) => _.map(securityRequirement, (requirement, requirementName) => {
        const securityScheme = securityDefinitions[requirementName];
        const credential = getCredentialKeyAndLocation(securityScheme);
        return Object.assign(Object.assign({}, credential), { location: `${securityRequirementsAndBaseLocation.baseLocation}.security[${index}].${requirementName}`, parentOperation: parsedOperation, type: securityScheme.type, value: requirement });
    }))
        .value();
};
const typeSafeHttpMethods = {
    delete: null, get: null, head: null, options: null, patch: null, post: null, put: null
};
const supportedHttpMethods = Object.keys(typeSafeHttpMethods);
const isHttpMethod = (value) => supportedHttpMethods.indexOf(value) >= 0;
const parseOperationFromPath = (path, pathName, specPathOrUrl, specJson) => Object.keys(path)
    .filter(isHttpMethod)
    .map((operationName) => {
    const operation = path[operationName];
    const pathLocation = `[root].paths.${pathName}`;
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
        (0, parse_path_name_segments_1.parsePathNameSegments)(pathName, parsedParameters.requestPath, parsedOperation, specJson.basePath);
    parsedOperation.consumes = parseMimeType({
        mimeTypeName: 'consumes',
        operation,
        parsedOperation,
        specJson
    });
    parsedOperation.produces = parseMimeType({
        mimeTypeName: 'produces',
        operation,
        parsedOperation,
        specJson
    });
    parsedOperation.requestBodyParameter = parsedParameters.requestBody;
    parsedOperation.requestHeaderParameters = parsedParameters.requestHeaders;
    parsedOperation.requestQueryParameters = parsedParameters.requestQuery;
    parsedOperation.responses = parseResponses(operation, parsedOperation, specJson);
    parsedOperation.securityRequirements = parseSecurityRequirements(specJson.securityDefinitions, operation.security, specJson.security, parsedOperation);
    return parsedOperation;
});
exports.swagger2Parser = {
    parse: (specJson, specPathOrUrl) => ({
        operations: _(specJson.paths)
            .map((path, pathName) => parseOperationFromPath(path, pathName, specPathOrUrl, specJson))
            .flatten()
            .value(),
        pathOrUrl: specPathOrUrl,
        paths: {
            location: '[root].paths',
            parentOperation: (0, create_empty_parent_operation_1.createEmptyParentOperation)(specPathOrUrl),
            value: specJson.paths
        }
    })
};
