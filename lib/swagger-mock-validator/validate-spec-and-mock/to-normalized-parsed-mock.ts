import {ParsedMock, ParsedMockInteraction} from '../types';
import {toMapWithLowerCaseKeys} from './to-map-with-lower-case-keys';

const toParsedMockInteractionWithNormalizedHeaders = (
    parsedMockInteraction: ParsedMockInteraction
): ParsedMockInteraction => ({
    ...parsedMockInteraction,
    requestHeaders: toMapWithLowerCaseKeys(parsedMockInteraction.requestHeaders),
    responseHeaders: toMapWithLowerCaseKeys(parsedMockInteraction.responseHeaders)
});

export const toNormalizedParsedMock = (parsedMock: ParsedMock): ParsedMock => ({
    ...parsedMock,
    interactions: parsedMock.interactions.map(toParsedMockInteractionWithNormalizedHeaders)
});
