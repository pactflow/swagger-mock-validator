import {GetContentSchemaResult} from '../../parsed-spec';
import {Content, Openapi3Schema} from '../openapi3';
import {getSchemaWithSpecDefinitions} from './get-schema-with-spec-definitions';
import {areMediaTypesCompatible, normalizeMediaType} from '../../../validate-spec-and-mock/content-negotiation';

const defaultMediaType = 'application/json';

const findDefaultMediaType = (content: Content): string => {
    const mediaTypes = Object.keys(content);

    return mediaTypes.find((mediaType) =>
        mediaType.startsWith('application/json')
    ) || mediaTypes.find((mediaType) =>
        mediaType.match(/application\/.+json/)
    ) || mediaTypes[0] || defaultMediaType;
}

// tslint:disable:cyclomatic-complexity
export const schemaByContentType = (content: Content | undefined, spec: Openapi3Schema) => (mediaType?: string): GetContentSchemaResult | undefined => {
  if (!content) {
      return undefined;
  }

  const effectiveMediaType = mediaType || findDefaultMediaType(content);
  const normalizedMediaType = normalizeMediaType(effectiveMediaType)

  const mediaTypes = Object.keys(content);
  const contentMediaType = mediaTypes.find(type => areMediaTypesCompatible(normalizeMediaType(type), normalizedMediaType));

  if (!contentMediaType) {
      return undefined;
  }

  const schema = content[contentMediaType]?.schema;
  if (!schema) {
      return undefined;
  }

  return {
      schema: getSchemaWithSpecDefinitions(schema, spec),
      mediaType: contentMediaType
  }
}
// tslint:enable:cyclomatic-complexity
