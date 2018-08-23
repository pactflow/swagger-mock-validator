"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dereference_component_1 = require("./dereference-component");
const to_parsed_spec_parameter_1 = require("./to-parsed-spec-parameter");
const toParsedSpecParameterCollection = (parameters) => parameters.reduce((collection, parameter) => {
    collection[parameter.name] = parameter;
    return collection;
}, {});
const filterByParameterType = (inValue, parsedSpecParameters) => parsedSpecParameters.filter((parameter) => parameter.value.in === inValue);
const toParsedSpecParameters = (parameters, parentOperation, spec) => parameters
    .map((parameterOrReference, index) => {
    const parameter = dereference_component_1.dereferenceComponent(parameterOrReference, spec);
    const location = `${parentOperation.location}.parameters[${index}]`;
    return to_parsed_spec_parameter_1.toParsedSpecParameter({ parameter, name: parameter.name, parentOperation, location, spec });
});
const doParseParameters = (parameters, parentOperation, spec) => {
    const parsedSpecParameters = toParsedSpecParameters(parameters, parentOperation, spec);
    return {
        header: toParsedSpecParameterCollection(filterByParameterType('header', parsedSpecParameters)),
        path: toParsedSpecParameterCollection(filterByParameterType('path', parsedSpecParameters)),
        query: toParsedSpecParameterCollection(filterByParameterType('query', parsedSpecParameters))
    };
};
const defaultParsedParameters = () => ({ header: {}, query: {}, path: {} });
const toParsedParameters = (parameters, parentOperation, spec) => parameters
    ? doParseParameters(parameters, parentOperation, spec)
    : defaultParsedParameters();
const mergePathItemAndOperationParameters = (pathItemParameters, operationParameters) => ({
    header: Object.assign({}, pathItemParameters.header, operationParameters.header),
    path: Object.assign({}, pathItemParameters.path, operationParameters.path),
    query: Object.assign({}, pathItemParameters.query, operationParameters.query)
});
exports.parseParameters = ({ pathItemParameters, operationParameters, parentOperation, spec }) => mergePathItemAndOperationParameters(toParsedParameters(pathItemParameters, parentOperation, spec), toParsedParameters(operationParameters, parentOperation, spec));
