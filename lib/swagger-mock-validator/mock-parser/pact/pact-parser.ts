import _ from 'lodash';
import querystring from 'querystring';
import { MultiCollectionFormatSeparator } from '../../types';
import { ParsedMock, ParsedMockInteraction, ParsedMockValueCollection } from '../parsed-mock';
import { Pact, PactInteraction, PactInteractionHeaders, PactV1RequestQuery, PactV3RequestQuery } from './pact';

const parseRequestPathSegments = (requestPath: string, parentInteraction: ParsedMockInteraction) =>
    _(requestPath.split('/'))
        .filter((requestPathSegment) => requestPathSegment.length > 0)
        .map((requestPathSegment) => ({
            location: `${parentInteraction.location}.request.path`,
            parentInteraction,
            value: requestPathSegment,
        }))
        .value();

const parseValues = (
    values: { [name: string]: string } | undefined,
    location: string,
    parentInteraction: ParsedMockInteraction
): ParsedMockValueCollection => {
    return _.reduce(
        values as PactInteractionHeaders,
        (result: ParsedMockValueCollection, value: string, name: string) => {
            result[name] = {
                location: `${location}.${name}`,
                parentInteraction,
                value,
            };
            return result;
        },
        {}
    );
};

const parseHeaders = (headers: any | undefined, location: string, parentInteraction: ParsedMockInteraction) => {
    for (const key in headers) {
        if (typeof headers[key] !== 'string') {
            headers[key] = headers[key].toString();
        }
    }
    return parseValues(headers, location, parentInteraction);
};

const isPactV1RequestQuery = (query: PactV1RequestQuery | PactV3RequestQuery): query is PactV1RequestQuery =>
    typeof query === 'string';

const parseAsPactV1RequestQuery = (requestQuery: PactV1RequestQuery = ''): { [name: string]: string } => {
    const parsedQueryAsStringsOrArrayOfStrings = querystring.parse(requestQuery);
    const separator: MultiCollectionFormatSeparator = '[multi-array-separator]';

    return Object.keys(parsedQueryAsStringsOrArrayOfStrings).reduce<{ [name: string]: string }>(
        (accumulator, queryName) => {
            const queryValue = parsedQueryAsStringsOrArrayOfStrings[queryName] || '';
            accumulator[queryName] = queryValue instanceof Array ? queryValue.join(separator) : queryValue;
            return accumulator;
        },
        {}
    );
};

const parseAsPactV3RequestQuery = (requestQuery: PactV3RequestQuery = {}): { [name: string]: string } => {
    const separator: MultiCollectionFormatSeparator = '[multi-array-separator]';
    return Object.keys(requestQuery).reduce<{ [name: string]: string }>((accumulator, queryName) => {
        accumulator[queryName] = requestQuery[queryName].join(separator);
        return accumulator;
    }, {});
};

// Instead of relying on version number, it is more resilient to detect the capability
const parseRequestQuery = (
    requestQuery: PactV1RequestQuery | PactV3RequestQuery | undefined
): { [name: string]: string } => {
    requestQuery = requestQuery || '';

    return isPactV1RequestQuery(requestQuery)
        ? parseAsPactV1RequestQuery(requestQuery)
        : parseAsPactV3RequestQuery(requestQuery);
};

const parseAsPactV4Body = (body: any) => {
    if (!body) {
        return undefined;
    }

    const { encoded, content = '' } = body;

    try {
        if (!encoded) {
            return content;
        }

        if ((encoded as string).toUpperCase() === 'JSON') {
            return JSON.parse(content); // throws if fails to parse
        }

        return Buffer.from(content, encoded).toString(); // throws if unrecognised encoding
    } catch {
        return content;
    }
};

const passThrough = (x: any) => x;

const parseInteractionFor = (mockPathOrUrl: string, version: number) => {
    const parseBody = version >= 4 ? parseAsPactV4Body : passThrough;

    return (interaction: PactInteraction, interactionIndex: number) => {
        const parsedInteraction = {
            description: interaction.description,
            location: `[root].interactions[${interactionIndex}]`,
            mockFile: mockPathOrUrl,
            state: interaction.providerState || interaction.provider_state || '[none]',
            value: interaction,
        } as ParsedMockInteraction;

        const getBodyPath = (bodyValue: any, bodyLocation: string, path: string) => {
            let location = bodyLocation;
            let value = bodyValue;

            if (path) {
                location += `${path}`;
                value = _.get(value, path[0] === '.' ? path.substring(1) : path);
            }

            return {
                location,
                parentInteraction: parsedInteraction,
                value,
            };
        };

        parsedInteraction.getRequestBodyPath = (path) =>
            getBodyPath(interaction?.request?.body, `${parsedInteraction.location}.request.body`, path);

        parsedInteraction.getResponseBodyPath = (path) =>
            getBodyPath(interaction?.response?.body, `${parsedInteraction.location}.response.body`, path);

        parsedInteraction.parentInteraction = parsedInteraction;

        parsedInteraction.requestBody = {
            location: `${parsedInteraction.location}.request.body`,
            parentInteraction: parsedInteraction,
            value: parseBody(interaction.request.body),
        };

        parsedInteraction.requestHeaders = parseHeaders(
            interaction.request.headers,
            `${parsedInteraction.location}.request.headers`,
            parsedInteraction
        );

        parsedInteraction.requestMethod = {
            location: `${parsedInteraction.location}.request.method`,
            parentInteraction: parsedInteraction,
            value: interaction.request.method.toLowerCase(),
        };

        parsedInteraction.requestPath = {
            location: `${parsedInteraction.location}.request.path`,
            parentInteraction: parsedInteraction,
            value: interaction.request.path,
        };

        parsedInteraction.requestPathSegments = parseRequestPathSegments(interaction.request.path, parsedInteraction);

        parsedInteraction.requestQuery = parseValues(
            parseRequestQuery(interaction.request.query),
            `${parsedInteraction.location}.request.query`,
            parsedInteraction
        );

        parsedInteraction.responseBody = {
            location: `${parsedInteraction.location}.response.body`,
            parentInteraction: parsedInteraction,
            value: parseBody(interaction.response.body),
        };

        parsedInteraction.responseHeaders = parseHeaders(
            interaction.response.headers,
            `${parsedInteraction.location}.response.headers`,
            parsedInteraction
        );

        parsedInteraction.responseStatus = {
            location: `${parsedInteraction.location}.response.status`,
            parentInteraction: parsedInteraction,
            value: interaction.response.status,
        };

        return parsedInteraction;
    };
};

const filterUnsupportedTypes = (interaction: PactInteraction) => {
    if (!interaction?.type || interaction.type === 'Synchronous/HTTP') {
        return interaction;
    }
    return null;
};

export const pactParser = {
    parse: (pactJson: Pact, mockPathOrUrl: string): ParsedMock => {
        const metadata = pactJson.metadata || pactJson.metaData;
        const version = parseInt(
            metadata?.pactSpecification?.version ||
                metadata?.pactSpecificationVersion ||
                metadata?.['pact-specification']?.version ||
                '0'
        );
        const parseInteraction = parseInteractionFor(mockPathOrUrl, version);
        return {
            consumer: pactJson.consumer.name,
            interactions: pactJson.interactions.filter(filterUnsupportedTypes).map(parseInteraction),
            pathOrUrl: mockPathOrUrl,
            provider: pactJson.provider.name,
        };
    },
};
