import {SwaggerMockValidatorOptionsMock} from '../api-types';
import {pactParser} from './mock-parser/pact/pact-parser';
import {ParsedMock} from './mock-parser/parsed-mock';
import {transformStringToObject} from './transform-string-to-object';
import {validateAndResolvePact} from './validate-and-resolve-pact';

export const mockParser = {
    parseMock: (mock: SwaggerMockValidatorOptionsMock): ParsedMock => {
        const mockJson = transformStringToObject<object>(mock.content, mock.pathOrUrl);
        const resolvedPact = validateAndResolvePact(mockJson, mock.pathOrUrl);
        return pactParser.parse(resolvedPact, mock.pathOrUrl);
    }
};
