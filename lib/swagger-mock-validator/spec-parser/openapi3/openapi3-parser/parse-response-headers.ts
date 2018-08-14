import {
    ParsedSpecOperation,
    ParsedSpecParameter,
    ParsedSpecParameterCollection
} from '../../parsed-spec';
import {Header, Openapi3Schema, Reference, ResponseHeaders} from '../openapi3';
import {dereferenceComponent} from './dereference-component';
import {toParsedSpecParameter} from './to-parsed-spec-parameter';

const parseHeader = (
    header: Header | Reference,
    name: string,
    parentOperation: ParsedSpecOperation,
    headersRootLocation: string,
    spec: Openapi3Schema
): ParsedSpecParameter => {
    const dereferencedHeader = dereferenceComponent(header, spec);
    const location = `${headersRootLocation}.${name}`;
    return toParsedSpecParameter({parameter: dereferencedHeader, name, parentOperation, location, spec});
};

const doParseResponseHeaders = (
    headers: ResponseHeaders,
    parentOperation: ParsedSpecOperation,
    headersRootLocation: string,
    spec: Openapi3Schema
): ParsedSpecParameterCollection =>
    Object.keys(headers)
        .reduce<ParsedSpecParameterCollection>((parsedHeaders, headerName) => {
            parsedHeaders[headerName] = parseHeader(
                headers[headerName], headerName, parentOperation, headersRootLocation, spec
            );
            return parsedHeaders;
        }, {});

export const parseResponseHeaders = (
    headers: ResponseHeaders | undefined,
    parentOperation: ParsedSpecOperation,
    headersRootLocation: string,
    spec: Openapi3Schema
): ParsedSpecParameterCollection =>
    headers
        ? doParseResponseHeaders(headers, parentOperation, headersRootLocation, spec)
        : {};
