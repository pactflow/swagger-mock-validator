import {SwaggerMockValidatorOptionsSpec} from '../api-types';
import {validateAndResolveSwagger} from './resolve-swagger';
import {swaggerParser} from './spec-parser/swagger-parser';
import {transformStringToObject} from './transform-string-to-object';
import {ParsedSpec} from './types';

export const specParser = {
    parseSpec: async (spec: SwaggerMockValidatorOptionsSpec): Promise<ParsedSpec> => {
        const specJson = transformStringToObject<object>(spec.content, spec.pathOrUrl);
        const resolvedSpec = await validateAndResolveSwagger(specJson, spec.pathOrUrl);
        return swaggerParser.parse(resolvedSpec, spec.pathOrUrl);
    }
};
