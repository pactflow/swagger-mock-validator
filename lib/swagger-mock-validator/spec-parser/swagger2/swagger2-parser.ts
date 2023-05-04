import _ from 'lodash';
import {createEmptyParentOperation} from '../common/create-empty-parent-operation';
import {parsePathNameSegments} from '../common/parse-path-name-segments';
import {
    ParsedSpec,
    ParsedSpecBody,
    ParsedSpecOperation,
    ParsedSpecParameter,
    ParsedSpecParameterCollection,
    ParsedSpecResponses,
    ParsedSpecSecurityRequirementCredential,
    ParsedSpecSecurityRequirements,
    ParsedSpecValue
} from '../parsed-spec';
import {
    Swagger2,
    Swagger2BodyParameter,
    Swagger2HttpMethod,
    Swagger2Item,
    Swagger2JsonSchema,
    Swagger2JsonSchemaDefinitions,
    Swagger2Operation,
    Swagger2Parameter,
    Swagger2Path,
    Swagger2PathParameter,
    Swagger2QueryParameter,
    Swagger2RequestHeaderParameter,
    Swagger2ResponseHeaderCollection,
    Swagger2SecurityDefinitions,
    Swagger2SecurityRequirement,
    Swagger2SecurityScheme
} from './swagger2';

const toParsedSpecValue = (
    parameters: Swagger2Parameter[] | undefined,
    parentLocation: string,
    parentOperation: ParsedSpecOperation
) => _.map(parameters as Swagger2Parameter[], (parameter, index) => ({
    location: `${parentLocation}.parameters[${index}]`,
    parentOperation,
    value: parameter
}));

const addDefinitionsToSchema = (
    schema: Swagger2JsonSchema | undefined, spec: Swagger2
): Swagger2JsonSchema | undefined => {
    if (schema) {
        const modifiedSchema = _.cloneDeep(schema);
        modifiedSchema.definitions = spec.definitions;
        return modifiedSchema;
    }
    return undefined;
};

const mergePathAndOperationParameters = (
    pathParameters: ParsedSpecValue<Swagger2Parameter>[],
    operationParameters: ParsedSpecValue<Swagger2Parameter>[]
) => {
    const mergedParameters = _.clone(pathParameters);

    for (const operationParameter of operationParameters) {
        const duplicateIndex = mergedParameters.findIndex(
            (mergedParameter) =>
                mergedParameter.value.in === operationParameter.value.in &&
                mergedParameter.value.name === operationParameter.value.name
        );

        if (duplicateIndex > -1) {
            mergedParameters[duplicateIndex] = operationParameter;
        } else {
            mergedParameters.push(operationParameter);
        }
    }

    return mergedParameters;
};

type SwaggerHeaderPathOrQueryParameter = Swagger2RequestHeaderParameter |
    Swagger2PathParameter |
    Swagger2QueryParameter;

const toParsedParameter = (
    parameter: ParsedSpecValue<Swagger2Item>,
    name: string
): ParsedSpecParameter => ({
    collectionFormat: parameter.value.collectionFormat,
    location: parameter.location,
    name,
    parentOperation: parameter.parentOperation,
    required: (parameter.value as SwaggerHeaderPathOrQueryParameter).required || false,
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

const parseResponseHeaders = (
    headers: Swagger2ResponseHeaderCollection | undefined,
    responseLocation: string,
    parentOperation: ParsedSpecOperation
): ParsedSpecParameterCollection => {
    if (!headers) {
        return {};
    }

    return Object.keys(headers).reduce<ParsedSpecParameterCollection>((result, headerName) => {
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

const parseResponses = (
    operation: Swagger2Operation,
    parentOperation: ParsedSpecOperation,
    specJson: Swagger2
): ParsedSpecResponses => {
    const responses = operation.responses;
    const parsedResponses = {
        location: `${parentOperation.location}.responses`,
        parentOperation,
        value: responses
    } as ParsedSpecResponses;

    const produces = parseMimeType({
        mimeTypeName: 'produces',
        operation,
        parsedOperation: parentOperation,
        specJson
    });

    _.each(responses, (response, responseStatus) => {
        const responseLocation = `${parsedResponses.location}.${responseStatus}`;
        const originalSchema = response.schema;

        parsedResponses[responseStatus as any] = {
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

const toSpecParameterCollection = (parameters: ParsedSpecParameter[]) =>
    _.reduce<ParsedSpecParameter, ParsedSpecParameterCollection>(parameters, (result, parameter) => {
        result[parameter.name] = parameter;
        return result;
    }, {});

const toRequestBodyParameter = (
    parameters: ParsedSpecValue<Swagger2Parameter>[],
    definitions?: Swagger2JsonSchemaDefinitions
): ParsedSpecBody | undefined =>
    _(parameters)
        .filter((parameter) => parameter.value.in === 'body')
        .map((parameter: ParsedSpecValue<Swagger2BodyParameter>) => {
            const modifiedSchema = _.cloneDeep(parameter.value.schema);
            modifiedSchema.definitions = definitions;

            return {
                getFromSchema: (pathToGet: string): ParsedSpecValue<any> => ({
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

const toParsedParametersFor = (
    inValue: 'header' | 'path' | 'query',
    parameters: ParsedSpecValue<Swagger2Parameter>[]
): ParsedSpecParameter[] =>
    _(parameters)
        .filter({value: {in: inValue}} as any)
        .map((parameter: ParsedSpecValue<SwaggerHeaderPathOrQueryParameter>) =>
            toParsedParameter(parameter, parameter.value.name))
        .value();

const parseParameters = (
    path: Swagger2Path,
    pathLocation: string,
    parsedOperation: ParsedSpecOperation,
    definitions?: Swagger2JsonSchemaDefinitions
) => {
    const pathParameters = toParsedSpecValue(path.parameters, pathLocation, parsedOperation);
    const operationParameters = toParsedSpecValue(
        parsedOperation.value.parameters,
        parsedOperation.location,
        parsedOperation
    );
    const mergedParameters = mergePathAndOperationParameters(pathParameters, operationParameters);

    return {
        requestBody: toRequestBodyParameter(mergedParameters, definitions),
        requestHeaders: toSpecParameterCollection(toParsedParametersFor('header', mergedParameters)),
        requestPath: toParsedParametersFor('path', mergedParameters),
        requestQuery: toSpecParameterCollection(toParsedParametersFor('query', mergedParameters))
    };
};

const parseMimeType = (options: {
    mimeTypeName: 'consumes' | 'produces',
    operation: Swagger2Operation,
    parsedOperation: ParsedSpecOperation,
    specJson: Swagger2
}) => {
    const operationValue = options.operation[options.mimeTypeName];
    const globalValue = options.specJson[options.mimeTypeName];

    if (operationValue) {
        return {
            location: `${options.parsedOperation.location}.${options.mimeTypeName}`,
            parentOperation: options.parsedOperation,
            value: operationValue
        };
    } else if (globalValue) {
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

const getSecurityRequirementsAndBaseLocation = (
    operationSecurityRequirements: Swagger2SecurityRequirement[] | undefined,
    globalSecurityRequirements: Swagger2SecurityRequirement[] | undefined,
    parsedOperation: ParsedSpecOperation
) => {
    if (operationSecurityRequirements && operationSecurityRequirements.length > 0) {
        return {
            baseLocation: parsedOperation.location,
            securityRequirements: operationSecurityRequirements
        };
    } else {
        return {
            baseLocation: '[root]',
            securityRequirements: globalSecurityRequirements || []
        };
    }
};

const getCredentialKeyAndLocation = (scheme: Swagger2SecurityScheme): ParsedSpecSecurityRequirementCredential => {
    switch (scheme.type) {
        case 'apiKey':
            return {credentialKey: scheme.name, credentialLocation: scheme.in};
        case 'basic':
            return {credentialKey: 'authorization', credentialLocation: 'header'};
        default:
            return {credentialKey: 'unknown', credentialLocation: 'unsupported'};
    }
};

const parseSecurityRequirements = (
    securityDefinitionsOrUndefined: Swagger2SecurityDefinitions | undefined,
    operationSecurityRequirements: Swagger2SecurityRequirement[] | undefined,
    globalSecurityRequirements: Swagger2SecurityRequirement[] | undefined,
    parsedOperation: ParsedSpecOperation
): ParsedSpecSecurityRequirements[] => {
    const securityDefinitions = securityDefinitionsOrUndefined || {};
    const securityRequirementsAndBaseLocation = getSecurityRequirementsAndBaseLocation(
        operationSecurityRequirements,
        globalSecurityRequirements,
        parsedOperation
    );

    return _(securityRequirementsAndBaseLocation.securityRequirements)
        .map((securityRequirement, index) =>
            _.map(securityRequirement, (requirement: string[], requirementName: string) => {
                const securityScheme = securityDefinitions[requirementName];
                const credential = getCredentialKeyAndLocation(securityScheme);

                return {
                    ...credential,
                    location:
                        `${securityRequirementsAndBaseLocation.baseLocation}.security[${index}].${requirementName}`,
                    parentOperation: parsedOperation,
                    type: securityScheme.type,
                    value: requirement
                };
            })
        )
        .value();
};

const typeSafeHttpMethods: {[method in Swagger2HttpMethod]: null} = {
    delete: null, get: null, head: null, options: null, patch: null, post: null, put: null
};

const supportedHttpMethods = Object.keys(typeSafeHttpMethods);

const isHttpMethod = (value: string): value is Swagger2HttpMethod =>
    supportedHttpMethods.indexOf(value) >= 0;

const parseOperationFromPath = (path: Swagger2Path, pathName: string, specPathOrUrl: string, specJson: Swagger2):
    ParsedSpecOperation[] =>
        Object.keys(path)
            .filter(isHttpMethod)
            .map((operationName) => {
                const operation = path[operationName] as Swagger2Operation;
                const pathLocation = `[root].paths.${pathName}`;
                const operationLocation = `${pathLocation}.${operationName}`;
                const parsedOperation = {
                    location: operationLocation,
                    method: operationName,
                    pathName,
                    specFile: specPathOrUrl,
                    value: operation
                } as ParsedSpecOperation;

                const parsedParameters = parseParameters(path, pathLocation, parsedOperation, specJson.definitions);

                parsedOperation.parentOperation = parsedOperation;
                parsedOperation.pathNameSegments =
                    parsePathNameSegments(pathName, parsedParameters.requestPath, parsedOperation, specJson.basePath);

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
                parsedOperation.securityRequirements = parseSecurityRequirements(
                    specJson.securityDefinitions,
                    operation.security,
                    specJson.security,
                    parsedOperation
                );

                return parsedOperation;
            });

export const swagger2Parser = {
    parse: (specJson: Swagger2, specPathOrUrl: string): ParsedSpec => ({
        operations: _(specJson.paths)
            .map(
                (path: Swagger2Path, pathName: string) =>
                    parseOperationFromPath(path, pathName, specPathOrUrl, specJson)
            )
            .flatten()
            .value(),
        pathOrUrl: specPathOrUrl,
        paths: {
            location: '[root].paths',
            parentOperation: createEmptyParentOperation(specPathOrUrl),
            value: specJson.paths
        }
    })
};
