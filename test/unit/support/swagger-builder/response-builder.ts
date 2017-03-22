import {cloneDeep} from 'lodash';
import {SwaggerResponse} from '../../../../lib/swagger-mock-validator/types';
import {setValueOn} from '../builder-utilities';
import {ResponseHeaderBuilder} from './response-header-builder';
import {SchemaBuilder} from './schema-builder';

export interface ResponseBuilder {
    build: () => SwaggerResponse;
}

const createResponseBuilder = (response: SwaggerResponse) => ({
    build: () => cloneDeep(response),
    withDescription: (description: string) => createResponseBuilder(setValueOn(response, 'description', description)),
    withHeader: (name: string, headerBuilder: ResponseHeaderBuilder) =>
        createResponseBuilder(setValueOn(response, `headers.${name}`, headerBuilder.build())),
    withSchema: (schemaBuilder: SchemaBuilder) =>
        createResponseBuilder(setValueOn(response, 'schema', schemaBuilder.build()))
});

export default createResponseBuilder({description: 'default-response'});
