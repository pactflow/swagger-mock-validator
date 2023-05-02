import {ParsedSpecJsonSchema} from '../../parsed-spec';
import {Content, Openapi3Schema, Schema} from '../openapi3';
import {getSchemaWithSpecDefinitions} from './get-schema-with-spec-definitions';

interface GetContentSchemaResult {
    schema?: ParsedSpecJsonSchema;
    mediaType: string;
}

const defaultMediaType = 'application/json';

const findDefaultMediaType = (content: Content): string => {
    const mediaTypes = Object.keys(content);

    return mediaTypes.find((mediaType) =>
        mediaType.startsWith('application/json')
    ) || mediaTypes.find((mediaType) =>
        mediaType.match(/application\/.+json/)
    ) || mediaTypes[0] || defaultMediaType;
}

const getApplicationJsonContentSchema = (content: Content, spec: Openapi3Schema): GetContentSchemaResult => {
    const mediaType = findDefaultMediaType(content);

    const schema = content[mediaType] ? content[mediaType].schema : undefined;

    return schema
        ? {schema: getSchemaWithSpecDefinitions(schema, spec), mediaType}
        : {mediaType};
};

export const getDefaultContentSchema = (content: Content | undefined, spec: Openapi3Schema): GetContentSchemaResult =>
    content
        ? getApplicationJsonContentSchema(content, spec)
        : {mediaType: defaultMediaType};

// tslint:disable:cyclomatic-complexity
export const getContentSchemasByContentType = (content: Content | undefined, spec: Openapi3Schema): Record<string, ParsedSpecJsonSchema> => {
    const result: Record<string, ParsedSpecJsonSchema> = {};

    if (!content) {
        return result;
    }

    const mediaTypes: string[] = Object.keys(content);
    for (const mediaType of mediaTypes) {
        if (content[mediaType] && content[mediaType].schema) {
            result[mediaType] = getSchemaWithSpecDefinitions((content[mediaType] as Schema).schema, spec);
        }
    }

    return result
}
// tslint:enable:cyclomatic-complexity
