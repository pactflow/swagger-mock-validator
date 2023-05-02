import * as _ from 'lodash';
import {ParsedSpecOperation, ParsedSpecResponse, ParsedSpecResponses} from '../../parsed-spec';
import {Openapi3Schema, Operation, Reference, Response} from '../openapi3';
import {dereferenceComponent} from './dereference-component';
import {getContentMimeTypes} from './get-content-mime-types';
import {getDefaultContentSchema, getContentSchemasByContentType} from './get-content-schema';
import {parseResponseHeaders} from './parse-response-headers';

interface ParseResponseOptions {
    response: Response | Reference;
    parentOperation: ParsedSpecOperation;
    responseLocation: string;
    spec: Openapi3Schema;
}

interface ParsedResponses {
    [statusCode: number]: ParsedSpecResponse;
    default?: ParsedSpecResponse;
}

const parseResponse = (
    {response, parentOperation, responseLocation, spec}: ParseResponseOptions
): ParsedSpecResponse => {
    const dereferencedResponse = dereferenceComponent(response, spec);
    const {schema, mediaType} = getDefaultContentSchema(dereferencedResponse.content, spec);
    const schemasByContentType = getContentSchemasByContentType(dereferencedResponse.content, spec);

    return {
        getFromSchema: (pathToGet, actualMediaType) => {
            return {
                location: `${responseLocation}.content.${actualMediaType || mediaType}.schema.${pathToGet}`,
                parentOperation,
                value: _.get(schema, pathToGet)
            };
        },
        headers: parseResponseHeaders(
            dereferencedResponse.headers, parentOperation, `${responseLocation}.headers`, spec),
        location: `${responseLocation}`,
        parentOperation,
        produces: {
            location: `${responseLocation}.content`,
            parentOperation,
            value: getContentMimeTypes(dereferencedResponse.content)
        },
        schema,
        schemasByContentType,
        value: response
    };
};

export const parseResponses = (
    operation: Operation,
    parentOperation: ParsedSpecOperation,
    spec: Openapi3Schema
): ParsedSpecResponses => {
    const responsesLocation = `${parentOperation.location}.responses`;
    const parsedResponses =  Object.keys(operation.responses)
        .reduce<ParsedResponses> ((allParsedResponses, responseStatus: any) => {
            const response = operation.responses[responseStatus];
            allParsedResponses[responseStatus] = parseResponse({
                parentOperation,
                response,
                responseLocation: `${responsesLocation}.${responseStatus}`,
                spec
            });
            return allParsedResponses;
        }, {});

    return {
        location: responsesLocation,
        parentOperation,
        value: operation.responses,
        ...parsedResponses
    };
};
