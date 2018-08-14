import {cloneDeep} from 'lodash';
import {Content} from '../../../../lib/swagger-mock-validator/spec-parser/openapi3/openapi3';
import {setValueOn} from '../builder-utilities';
import {OpenApi3SchemaBuilder} from './openapi3-schema-builder';

export interface OpenApi3ContentBuilder {
    build: () => Content;
}

const createOpenApi3ContentBuilder = (openApi3Content: Content) => ({
    build: () => cloneDeep(openApi3Content),
    withJsonContent: (schemaBuilder: OpenApi3SchemaBuilder) =>
        createOpenApi3ContentBuilder(
            setValueOn(openApi3Content, 'application/json.schema', schemaBuilder.build())
        ),
    withJsonContentRef: (refName: string) =>
        createOpenApi3ContentBuilder(
            setValueOn(openApi3Content, 'application/json.schema.$ref', refName)
        ),
    withMimeTypeContent: (mimeType: string, schemaBuilder: OpenApi3SchemaBuilder) =>
        createOpenApi3ContentBuilder(
            setValueOn(openApi3Content, `${mimeType}.schema`, schemaBuilder.build())
        ),
    withUtf8JsonContent: (schemaBuilder: OpenApi3SchemaBuilder) =>
        createOpenApi3ContentBuilder(
            setValueOn(openApi3Content, 'application/json;charset=utf-8.schema', schemaBuilder.build())
        ),
    withXmlContent: (schemaBuilder: OpenApi3SchemaBuilder) =>
        createOpenApi3ContentBuilder(
            setValueOn(openApi3Content, 'application/xml.schema', schemaBuilder.build())
        )
});

export const openApi3ContentBuilder = createOpenApi3ContentBuilder({});
