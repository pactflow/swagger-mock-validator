import * as _ from 'lodash';
import {
    JsonSchema,
    ParsedSpec,
    ParsedSpecBody,
    ParsedSpecHeaderCollection,
    ParsedSpecOperation,
    ParsedSpecParameter,
    ParsedSpecPathNameSegment,
    ParsedSpecResponses,
    ParsedSpecValue,
    Swagger,
    SwaggerBodyParameter,
    SwaggerOperation,
    SwaggerParameter,
    SwaggerParameterBase,
    SwaggerPath,
    SwaggerPathParameter,
    SwaggerQueryParameter,
    SwaggerRequestHeaderParameter,
    SwaggerResponseHeader,
    SwaggerResponseHeaderCollection,
    SwaggerResponses
} from '../types';

const toParsedSpecValue = (
    parameters: SwaggerParameter[],
    parentLocation: string,
    parentOperation: ParsedSpecOperation
) => _.map(parameters, (parameter, index) => ({
    location: `${parentLocation}.parameters[${index}]`,
    parentOperation,
    value: parameter
}));

const mergePathAndOperationParameters = (
    pathParameters: Array<ParsedSpecValue<SwaggerParameter>>,
    operationParameters: Array<ParsedSpecValue<SwaggerParameter>>
) => {
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
        } else {
            mergedParameters.push(operationParameter);
        }
    });

    return mergedParameters;
};

const parsePathNameSegments = (
    pathName: string,
    pathParameters: ParsedSpecParameter[],
    parsedOperation: ParsedSpecOperation
) => {
    return _(pathName.split('/'))
        .filter((pathNameSegment) => pathNameSegment.length > 0)
        .map((pathNameSegment) => {
            const parsedPathNameSegment = {parentOperation: parsedOperation} as ParsedSpecPathNameSegment;
            const isParameter = pathNameSegment[0] === '{' && pathNameSegment[pathNameSegment.length - 1] === '}';

            if (isParameter) {
                const pathNameSegmentValue = pathNameSegment.substring(1, pathNameSegment.length - 1);

                parsedPathNameSegment.parameter = _.find(pathParameters, {name: pathNameSegmentValue});
                parsedPathNameSegment.validatorType = 'jsonSchema';
                parsedPathNameSegment.value = pathNameSegmentValue;
            } else {
                parsedPathNameSegment.validatorType = 'equal';
                parsedPathNameSegment.value = pathNameSegment;
            }

            return parsedPathNameSegment;
        })
        .value();
};

const removeRequiredPropertiesFromSchema = (schema: JsonSchema) => {
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

const addAdditionalPropertiesFalseToSchema = (schema: JsonSchema) => {
    if (!schema) {
        return schema;
    }

    if (schema.type === 'object') {
        schema.additionalProperties = false;
        _.each(schema.properties, addAdditionalPropertiesFalseToSchema);
    } else if (schema.type === 'array') {
        addAdditionalPropertiesFalseToSchema(schema.items);
    }

    return undefined;
};

type SwaggerHeaderPathOrQueryParameter = SwaggerRequestHeaderParameter | SwaggerPathParameter | SwaggerQueryParameter;

const toParsedParameter = (
    parameter: ParsedSpecValue<SwaggerParameterBase>,
    name: string
): ParsedSpecParameter => ({
    enum: parameter.value.enum,
    exclusiveMaximum: parameter.value.exclusiveMaximum,
    exclusiveMinimum: parameter.value.exclusiveMinimum,
    format: parameter.value.format,
    location: parameter.location,
    maximum: parameter.value.maximum,
    minimum: parameter.value.minimum,
    name,
    parentOperation: parameter.parentOperation,
    required: (parameter.value as SwaggerHeaderPathOrQueryParameter).required || false,
    type: parameter.value.type,
    value: parameter.value
});

const parseResponseHeaders = (
    headers: SwaggerResponseHeaderCollection,
    responseLocation: string,
    parentOperation: ParsedSpecOperation
): ParsedSpecHeaderCollection =>
    _.reduce<SwaggerResponseHeader, ParsedSpecHeaderCollection>(headers, (result, header, headerName) => {
        const value = {
            location: `${responseLocation}.headers.${headerName}`,
            parentOperation,
            value: header
        };

        result[headerName.toLowerCase()] = toParsedParameter(value, headerName);

        return result;
    }, {});

const parseResponses = (responses: SwaggerResponses, parentOperation: ParsedSpecOperation) => {
    const parsedResponses = {
        location: `${parentOperation.location}.responses`,
        parentOperation,
        value: responses
    } as ParsedSpecResponses;

    _.each(responses, (response, responseStatus) => {
        const responseLocation = `${parsedResponses.location}.${responseStatus}`;
        const originalSchema = response.schema;
        const modifiedSchema = _.cloneDeep(originalSchema);

        removeRequiredPropertiesFromSchema(modifiedSchema);
        addAdditionalPropertiesFalseToSchema(modifiedSchema);

        parsedResponses[responseStatus as any] = {
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

const toHeaderCollection = (headerParameters: ParsedSpecParameter[]) =>
    _.reduce<ParsedSpecParameter, ParsedSpecHeaderCollection>(headerParameters, (result, headerParameter) => {
        result[headerParameter.name.toLowerCase()] = headerParameter;
        return result;
    }, {});

const toRequestBodyParameter = (parameters: Array<ParsedSpecValue<SwaggerParameter>>): ParsedSpecBody =>
    _(parameters)
        .filter((parameter) => parameter.value.in === 'body')
        .map((parameter: ParsedSpecValue<SwaggerBodyParameter>) => ({
            getFromSchema: (pathToGet: string): ParsedSpecValue<any> => ({
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

const toParsedParametersFor = (
    inValue: 'header' | 'path' | 'query',
    parameters: Array<ParsedSpecValue<SwaggerParameter>>
): ParsedSpecParameter[] =>
    _(parameters)
        .filter({value: {in: inValue}})
        .map((parameter: ParsedSpecValue<SwaggerHeaderPathOrQueryParameter>) =>
            toParsedParameter(parameter, parameter.value.name))
        .value();

const parseParameters = (path: SwaggerPath, pathLocation: string, parsedOperation: ParsedSpecOperation) => {
    const pathParameters = toParsedSpecValue(path.parameters, pathLocation, parsedOperation);
    const operationParameters = toParsedSpecValue(
        parsedOperation.value.parameters,
        parsedOperation.location,
        parsedOperation
    );
    const mergedParameters = mergePathAndOperationParameters(pathParameters, operationParameters);

    return {
        requestBody: toRequestBodyParameter(mergedParameters),
        requestHeaders: toHeaderCollection(toParsedParametersFor('header', mergedParameters)),
        requestPath: toParsedParametersFor('path', mergedParameters)
    };
};

const parseOperationFromPath = (path: SwaggerPath, pathName: string): ParsedSpecOperation[] =>
    _(path)
        .omit(['parameters'])
        .map((operation: SwaggerOperation, operationName: string) => {
            const pathLocation = `[swaggerRoot].paths.${pathName}`;
            const operationLocation = `${pathLocation}.${operationName}`;
            const parsedOperation = {
                location: operationLocation,
                method: operationName,
                pathName,
                value: operation
            } as ParsedSpecOperation;

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

export default {
    parse: (swaggerJson: Swagger, swaggerPathOrUrl: string): ParsedSpec => ({
        operations: _(swaggerJson.paths)
            .map(parseOperationFromPath)
            .flatten<ParsedSpecOperation>()
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
