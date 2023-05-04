import _ from 'lodash';
import {ParsedSpecBody, ParsedSpecOperation, ParsedSpecValue} from '../../parsed-spec';
import {Openapi3Schema, Reference, RequestBody} from '../openapi3';
import {dereferenceComponent} from './dereference-component';
import {getContentMimeTypes} from './get-content-mime-types';
import {getDefaultContentSchema, getContentSchemasByContentType} from './get-content-schema';

interface ParsedRequestBodyValues {
    consumes: ParsedSpecValue<string[]>;
    requestBodyParameter?: ParsedSpecBody;
}

const parseRequestBody = (
    parentOperation: ParsedSpecOperation, requestBody: RequestBody, spec: Openapi3Schema
): ParsedSpecBody | undefined => {
    const {schema, mediaType} = getDefaultContentSchema(requestBody.content, spec);
    const schemasByContentType = getContentSchemasByContentType(requestBody.content, spec);

    return schema
        ? {
            getFromSchema: (pathToGet, actualMediaType) => {
                return {
                    location:
                        `${parentOperation.location}.requestBody.content.${actualMediaType || mediaType}.schema.${pathToGet}`,
                    parentOperation,
                    value: _.get(schema, pathToGet)
                };
            },
            name: '',
            required: requestBody.required || false,
            schema,
            schemasByContentType
        }
        : undefined;
};

const createConsumesWithMimeTypes = (
    parentOperation: ParsedSpecOperation, mimeTypes: string[]
): ParsedSpecValue<string[]> => ({
    location: `${parentOperation.location}.requestBody.content`,
    parentOperation,
    value: mimeTypes
});

const defaultConsumesAndRequestBodyParameter = (parentOperation: ParsedSpecOperation): ParsedRequestBodyValues => ({
    consumes: createConsumesWithMimeTypes(parentOperation, [])
});

const getConsumesAndRequestBodyParameter = (
    requestBody: RequestBody | Reference,
    parentOperation: ParsedSpecOperation,
    spec: Openapi3Schema
): ParsedRequestBodyValues => {
    const dereferencedRequestBody = dereferenceComponent(requestBody, spec);
    const requestBodyParameter = parseRequestBody(parentOperation, dereferencedRequestBody, spec);

    return {
        consumes: createConsumesWithMimeTypes(parentOperation, getContentMimeTypes(dereferencedRequestBody.content)),
        requestBodyParameter
    };
};

export const getParsedRequestBodyValues = (
    parentOperation: ParsedSpecOperation, spec: Openapi3Schema
): ParsedRequestBodyValues => {
    return parentOperation.value.requestBody
        ? getConsumesAndRequestBodyParameter(parentOperation.value.requestBody, parentOperation, spec)
        : defaultConsumesAndRequestBodyParameter(parentOperation);
};
