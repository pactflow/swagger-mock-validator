import {
    ParsedSpecOperation,
    ParsedSpecParameter,
    ParsedSpecParameterCollection
} from '../../parsed-spec';
import {Openapi3Schema, Parameter, Reference} from '../openapi3';
import {dereferenceComponent} from './dereference-component';
import {toParsedSpecParameter} from './to-parsed-spec-parameter';

type ParameterInValue = 'query' | 'header' | 'path';

type ParameterOrReference = Parameter | Reference;

interface ParsedParameters {
    query: ParsedSpecParameterCollection;
    header: ParsedSpecParameterCollection;
    path: ParsedSpecParameterCollection;
}

interface ParseParametersOptions {
    pathItemParameters: ParameterOrReference[] | undefined;
    operationParameters: ParameterOrReference[] | undefined;
    parentOperation: ParsedSpecOperation;
    spec: Openapi3Schema;
}

const toParsedSpecParameterCollection = (parameters: ParsedSpecParameter[]): ParsedSpecParameterCollection =>
    parameters.reduce<ParsedSpecParameterCollection>((collection, parameter) => {
        collection[parameter.name] = parameter;
        return collection;
    }, {});

const filterByParameterType = (
    inValue: ParameterInValue, parsedSpecParameters: ParsedSpecParameter[]
): ParsedSpecParameter[] =>
    parsedSpecParameters.filter((parameter) => parameter.value.in === inValue);

const toParsedSpecParameters = (
    parameters: ParameterOrReference[],
    parentOperation: ParsedSpecOperation,
    spec: Openapi3Schema
): ParsedSpecParameter[] =>
    parameters
        .map((parameterOrReference, index) => {
            const parameter = dereferenceComponent(parameterOrReference, spec);
            const location = `${parentOperation.location}.parameters[${index}]`;
            return toParsedSpecParameter({parameter, name: parameter.name, parentOperation, location});
        });

const doParseParameters = (
    parameters: ParameterOrReference[],
    parentOperation: ParsedSpecOperation,
    spec: Openapi3Schema
): ParsedParameters => {
    const parsedSpecParameters = toParsedSpecParameters(parameters, parentOperation, spec);

    return {
        header: toParsedSpecParameterCollection(filterByParameterType('header', parsedSpecParameters)),
        path: toParsedSpecParameterCollection(filterByParameterType('path', parsedSpecParameters)),
        query: toParsedSpecParameterCollection(filterByParameterType('query', parsedSpecParameters))
    };
};

const defaultParsedParameters = (): ParsedParameters =>
    ({header: {}, query: {}, path: {}});

const toParsedParameters = (
    parameters: ParameterOrReference[] | undefined,
    parentOperation: ParsedSpecOperation,
    spec: Openapi3Schema
): ParsedParameters =>
    parameters
        ? doParseParameters(parameters, parentOperation, spec)
        : defaultParsedParameters();

const mergePathItemAndOperationParameters = (
    pathItemParameters: ParsedParameters,
    operationParameters: ParsedParameters
): ParsedParameters => ({
    header: {...pathItemParameters.header, ...operationParameters.header},
    path: {...pathItemParameters.path, ...operationParameters.path},
    query: {...pathItemParameters.query, ...operationParameters.query}
});

export const parseParameters = (
    {pathItemParameters, operationParameters, parentOperation, spec}: ParseParametersOptions
): ParsedParameters =>
    mergePathItemAndOperationParameters(
        toParsedParameters(pathItemParameters, parentOperation, spec),
        toParsedParameters(operationParameters, parentOperation, spec)
    );
