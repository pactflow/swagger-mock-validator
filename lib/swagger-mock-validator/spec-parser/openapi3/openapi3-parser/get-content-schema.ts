import {ParsedSpecJsonSchema} from '../../parsed-spec';
import {Content, Openapi3Schema} from '../openapi3';
import {getSchemaWithSpecDefinitions} from './get-schema-with-spec-definitions';

interface GetContentSchemaResult {
    schema?: ParsedSpecJsonSchema;
    mediaType: string;
}

const defaultMediaType = 'application/json';

const findApplicationJsonMediaType = (content: Content): string =>
    Object.keys(content).find((mediaType) => mediaType.indexOf('application/json') === 0)
    || defaultMediaType;

const getApplicationJsonContentSchema = (content: Content, spec: Openapi3Schema): GetContentSchemaResult => {
    const jsonMediaType = findApplicationJsonMediaType(content);

    const jsonContent = content[jsonMediaType];
    const jsonSchema = jsonContent ? jsonContent.schema : undefined;

    return jsonSchema
        ? {schema: getSchemaWithSpecDefinitions(jsonSchema, spec), mediaType: jsonMediaType}
        : {mediaType: jsonMediaType};
};

export const getContentSchema = (content: Content | undefined, spec: Openapi3Schema): GetContentSchemaResult =>
    content
        ? getApplicationJsonContentSchema(content, spec)
        : {mediaType: defaultMediaType};
