import {SwaggerMockValidatorOptionsSpec} from '../api-types';
import {validateAndResolveSwagger} from './resolve-swagger';
import {ParsedSpec} from './spec-parser/parsed-spec';
import {swagger2Parser} from './spec-parser/swagger2/swagger2-parser';
import {transformStringToObject} from './transform-string-to-object';

export const specParser = {
    parseSpec: async (spec: SwaggerMockValidatorOptionsSpec): Promise<ParsedSpec> => {
        const specJson = transformStringToObject<object>(spec.content, spec.pathOrUrl);
        const resolvedSpec = await validateAndResolveSwagger(specJson, spec.pathOrUrl);
        return swagger2Parser.parse(resolvedSpec, spec.pathOrUrl);
    }
};
