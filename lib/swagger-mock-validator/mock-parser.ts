import {pactParser} from './mock-parser/pact/pact-parser';
import {ParsedMock} from './mock-parser/parsed-mock';
import {transformStringToObject} from './transform-string-to-object';
import {SerializedMock} from './types';
import {validateAndResolvePact} from './validate-and-resolve-pact';

export class MockParser {
    public static parse(mock: SerializedMock): ParsedMock {
        const mockJson = transformStringToObject<object>(mock.content, mock.pathOrUrl);
        const resolvedPact = validateAndResolvePact(mockJson, mock.pathOrUrl);
        return pactParser.parse(resolvedPact, mock.pathOrUrl);
    }
}
