import * as _ from 'lodash';
import * as querystring from 'querystring';
import {
    MultiCollectionFormatSeparator,
    Pact,
    PactInteraction,
    PactInteractionHeaders,
    ParsedMock,
    ParsedMockInteraction,
    ParsedMockValueCollection
} from '../types';

const parseRequestPathSegments = (requestPath: string, parentInteraction: ParsedMockInteraction) =>
    _(requestPath.split('/'))
        .filter((requestPathSegment) => requestPathSegment.length > 0)
        .map((requestPathSegment) => ({
            location: `${parentInteraction.location}.request.path`,
            parentInteraction,
            value: requestPathSegment
        }))
        .value();

const parseValues = (
    values: {[name: string]: string} | undefined,
    location: string,
    parentInteraction: ParsedMockInteraction
): ParsedMockValueCollection => {
    return _.reduce(
        values as PactInteractionHeaders,
        (result: ParsedMockValueCollection, value: string, name: string) => {
            result[name.toLowerCase()] = {
                location: `${location}.${name}`,
                parentInteraction,
                value
            };
            return result;
        },
        {}
    );
};

const parseInteraction = (
    interaction: PactInteraction, interactionIndex: number, mockPathOrUrl: string
) => {
    // tslint:disable:no-object-literal-type-assertion
    const parsedInteraction = {
        description: interaction.description,
        location: `[pactRoot].interactions[${interactionIndex}]`,
        mockFile: mockPathOrUrl,
        state: interaction.providerState || interaction.provider_state || '[none]',
        value: interaction
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
            value
        };
    };

    parsedInteraction.getRequestBodyPath = (path) =>
        getBodyPath(interaction.request.body, `${parsedInteraction.location}.request.body`, path);
    parsedInteraction.getResponseBodyPath = (path) =>
        getBodyPath(interaction.response.body, `${parsedInteraction.location}.response.body`, path);
    parsedInteraction.parentInteraction = parsedInteraction;
    parsedInteraction.requestBody = {
        location: `${parsedInteraction.location}.request.body`,
        parentInteraction: parsedInteraction,
        value: interaction.request.body
    };
    parsedInteraction.requestHeaders = parseValues(
        interaction.request.headers, `${parsedInteraction.location}.request.headers`, parsedInteraction
    );
    parsedInteraction.requestMethod = {
        location: `${parsedInteraction.location}.request.method`,
        parentInteraction: parsedInteraction,
        value: interaction.request.method.toLowerCase()
    };
    parsedInteraction.requestPath = {
        location: `${parsedInteraction.location}.request.path`,
        parentInteraction: parsedInteraction,
        value: interaction.request.path
    };
    parsedInteraction.requestPathSegments = parseRequestPathSegments(interaction.request.path, parsedInteraction);
    const query = querystring.parse(interaction.request.query || '');
    const separator: MultiCollectionFormatSeparator = '[multi-array-separator]';
    _.each(query, (v: any, k: string) => {
        if (_.isArray(v)) {
            query[k] = v.join(separator);
        }
    });
    parsedInteraction.requestQuery = parseValues(
        query, `${parsedInteraction.location}.request.query`, parsedInteraction
    );
    parsedInteraction.responseBody = {
        location: `${parsedInteraction.location}.response.body`,
        parentInteraction: parsedInteraction,
        value: interaction.response.body
    };
    parsedInteraction.responseHeaders = parseValues(
        interaction.response.headers, `${parsedInteraction.location}.response.headers`, parsedInteraction
    );
    parsedInteraction.responseStatus = {
        location: `${parsedInteraction.location}.response.status`,
        parentInteraction: parsedInteraction,
        value: interaction.response.status
    };

    return parsedInteraction;
};

export default {
    parse: (pactJson: Pact, mockPathOrUrl: string): ParsedMock => ({
        consumer: pactJson.consumer.name,
        interactions: _.map(pactJson.interactions, (interaction: PactInteraction, interactionIndex: number) =>
            parseInteraction(interaction, interactionIndex, mockPathOrUrl)
        ),
        pathOrUrl: mockPathOrUrl,
        provider: pactJson.provider.name
    })
};
