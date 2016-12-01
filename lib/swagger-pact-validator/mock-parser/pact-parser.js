'use strict';

const _ = require('lodash');

const parseRequestPathSegments = (requestPath, parentInteraction) => _(requestPath.split('/'))
    .filter((requestPathSegment) => requestPathSegment.length > 0)
    .map((requestPathSegment) => ({
        location: `${parentInteraction.location}.request.path`,
        parentInteraction,
        value: requestPathSegment
    }))
    .value();

const parseInteraction = (interaction, interactionIndex) => {
    const parsedInteraction = {
        description: interaction.description,
        location: `[pactRoot].interactions[${interactionIndex}]`,
        state: interaction.state || '[none]'
    };

    parsedInteraction.getRequestBodyPath = (path) => {
        let location = `${parsedInteraction.location}.request.body`;
        let value = interaction.request.body;

        if (path) {
            location += `.${path}`;
            value = _.get(value, path);
        }

        return {
            location,
            parentInteraction: parsedInteraction,
            value
        };
    };
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
    parsedInteraction.responseStatus = {
        location: `${parsedInteraction.location}.response.status`,
        parentInteraction: parsedInteraction,
        value: interaction.response.status
    };

    return parsedInteraction;
};

module.exports = {
    parse: (pactJson, pactPathOrUrl) => ({
        interactions: _.map(pactJson.interactions, parseInteraction),
        pathOrUrl: pactPathOrUrl
    })
};
