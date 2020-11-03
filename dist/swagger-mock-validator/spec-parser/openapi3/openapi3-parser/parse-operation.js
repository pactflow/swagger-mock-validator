"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOperation = void 0;
const parse_path_name_segments_1 = require("../../common/parse-path-name-segments");
const parse_parameters_1 = require("./parse-parameters");
const parse_request_body_1 = require("./parse-request-body");
const parse_responses_1 = require("./parse-responses");
const parse_security_requirements_1 = require("./parse-security-requirements");
exports.parseOperation = ({ operation, operationName, pathName, pathItemParameters, operationLocation, spec, specPathOrUrl }) => {
    // tslint:disable-next-line:no-object-literal-type-assertion
    const parsedOperation = {
        location: operationLocation,
        method: operationName,
        pathName,
        specFile: specPathOrUrl,
        value: operation
    };
    parsedOperation.parentOperation = parsedOperation;
    parsedOperation.securityRequirements = parse_security_requirements_1.parseSecurityRequirements(spec.security, operation.security, parsedOperation, spec);
    const parsedParameters = parse_parameters_1.parseParameters({
        operationParameters: operation.parameters,
        parentOperation: parsedOperation,
        pathItemParameters,
        spec
    });
    parsedOperation.requestQueryParameters = parsedParameters.query;
    parsedOperation.requestHeaderParameters = parsedParameters.header;
    const pathParameters = Object.keys(parsedParameters.path).map((key) => parsedParameters.path[key]);
    parsedOperation.pathNameSegments = parse_path_name_segments_1.parsePathNameSegments(pathName, pathParameters, parsedOperation);
    const parsedRequestBodyProperties = parse_request_body_1.getParsedRequestBodyValues(parsedOperation, spec);
    parsedOperation.consumes = parsedRequestBodyProperties.consumes;
    parsedOperation.requestBodyParameter = parsedRequestBodyProperties.requestBodyParameter;
    parsedOperation.responses = parse_responses_1.parseResponses(operation, parsedOperation, spec);
    return parsedOperation;
};
