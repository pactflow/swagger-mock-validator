import {cloneDeep} from 'lodash';
import {Response} from '../../../../lib/swagger-mock-validator/spec-parser/openapi3/openapi3';
import {setValueOn} from '../builder-utilities';
import {OpenApi3ContentBuilder} from './openapi3-content-builder';
import {OpenApi3ResponseHeaderBuilder} from './openapi3-response-header-builder';

export interface OpenApi3ResponseBuilder {
    build: () => Response;
}

const createOpenApi3ResponseBuilder = (response: Response) => ({
    build: () => cloneDeep(response),
    withContent: (contentBuilder: OpenApi3ContentBuilder) =>
        createOpenApi3ResponseBuilder(setValueOn(response, 'content', contentBuilder.build())),
    withDescription: (description: string) =>
        createOpenApi3ResponseBuilder(setValueOn(response, 'description', description)),
    withHeader: (name: string, headerBuilder: OpenApi3ResponseHeaderBuilder) =>
        createOpenApi3ResponseBuilder(setValueOn(response, `headers.${name}`, headerBuilder.build())),
    withHeaderRef: (name: string, reference: string) =>
        createOpenApi3ResponseBuilder(setValueOn(response, `headers.${name}`, {$ref: reference}))
});

export const openApi3ResponseBuilder = createOpenApi3ResponseBuilder({description: 'default-response'});
