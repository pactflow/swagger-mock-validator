import * as _ from 'lodash';
import {Pact, PactInteraction, ParsedMockInteraction} from '../types';

const parseRequestPathSegments = (requestPath: string, parentInteraction: ParsedMockInteraction) =>
    _(requestPath.split('/'))
        .filter((requestPathSegment) => requestPathSegment.length > 0)
        .map((requestPathSegment) => ({
            location: `${parentInteraction.location}.request.path`,
            parentInteraction,
            value: requestPathSegment
        }))
        .value();

const parseInteraction = (interaction: PactInteraction, interactionIndex: number) => {
    const parsedInteraction = {
        description: interaction.description,
        location: `[pactRoot].interactions[${interactionIndex}]`,
        state: interaction.state || '[none]'
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
    parsedInteraction.requestBody = {
        location: `${parsedInteraction.location}.request.body`,
        parentInteraction: parsedInteraction,
        value: interaction.request.body
    };
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
    parsedInteraction.responseBody = {
        location: `${parsedInteraction.location}.response.body`,
        parentInteraction: parsedInteraction,
        value: interaction.response.body
    };
    parsedInteraction.responseStatus = {
        location: `${parsedInteraction.location}.response.status`,
        parentInteraction: parsedInteraction,
        value: interaction.response.status
    };

    return parsedInteraction;
};

export default {
    parse: (pactJson: Pact, pactPathOrUrl: string) => ({
        interactions: _.map(pactJson.interactions, parseInteraction),
        pathOrUrl: pactPathOrUrl
    })
};
