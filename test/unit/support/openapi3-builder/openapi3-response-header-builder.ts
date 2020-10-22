import {cloneDeep} from 'lodash';
import {
    HeaderWithSchemaWithExample as OpenApi3ResponseHeader
} from '../../../../lib/swagger-mock-validator/spec-parser/openapi3/openapi3';
import {setValueOn} from '../builder-utilities';
import {OpenApi3ContentBuilder} from './openapi3-content-builder';
import {OpenApi3SchemaBuilder} from './openapi3-schema-builder';

export interface OpenApi3ResponseHeaderBuilder {
    build: () => OpenApi3ResponseHeader;
}

const createOpenApi3ResponseHeaderBuilder = (header: OpenApi3ResponseHeader) => {
    return {
        build: () => cloneDeep(header),
        withContent: (contentBuilder: OpenApi3ContentBuilder) => {
            const parameterWithContent = setValueOn(header, 'content', contentBuilder.build());
            delete (parameterWithContent as Partial<OpenApi3ResponseHeader>).schema;
            return createOpenApi3ResponseHeaderBuilder(parameterWithContent);
        },
        withRequired: () =>
            createOpenApi3ResponseHeaderBuilder(setValueOn(header, 'required', true)),
        withSchema: (schemaBuilder: OpenApi3SchemaBuilder) =>
            createOpenApi3ResponseHeaderBuilder(setValueOn(header, 'schema', schemaBuilder.build())),
        withSchemaRef: (refName: string) =>
            createOpenApi3ResponseHeaderBuilder(setValueOn(header, 'schema', {$ref: refName}))
    };
};

export const openApi3ResponseHeaderBuilder = createOpenApi3ResponseHeaderBuilder({
    schema: {type: 'number'}
});
