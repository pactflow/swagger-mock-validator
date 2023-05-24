import { GetContentSchemaResult } from '../../parsed-spec';
import { Content, Openapi3Schema } from '../openapi3';
import { getSchemaWithSpecDefinitions } from './get-schema-with-spec-definitions';
import { findMatchingType } from '../../../validate-spec-and-mock/content-negotiation';

export const schemaByContentType =
    (content: Content | undefined, spec: Openapi3Schema) =>
    (mediaType?: string): GetContentSchemaResult | undefined => {
        if (!content) {
            return undefined;
        }

        const contentMediaType = findMatchingType(mediaType || 'application/json', Object.keys(content));
        if (!contentMediaType) {
            return undefined;
        }

        const schema = content[contentMediaType]?.schema;
        if (!schema) {
            return undefined;
        }

        return {
            schema: getSchemaWithSpecDefinitions(schema, spec),
            mediaType: contentMediaType,
        };
    };
