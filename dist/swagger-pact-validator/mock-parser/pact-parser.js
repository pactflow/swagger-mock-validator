"use strict";
const _ = require("lodash");
const parseRequestPathSegments = (requestPath, parentInteraction) => _(requestPath.split('/'))
    .filter((requestPathSegment) => requestPathSegment.length > 0)
    .map((requestPathSegment) => ({
    location: `${parentInteraction.location}.request.path`,
    parentInteraction,
    value: requestPathSegment
}))
    .value();
const parseHeaders = (headers, headerLocation, parentInteraction) => {
    return _.reduce(headers, (result, headerValue, headerName) => {
        result[headerName.toLowerCase()] = {
            location: `${parentInteraction.location}.${headerLocation}.headers.${headerName}`,
            parentInteraction,
            value: headerValue
        };
        return result;
    }, {});
};
const parseInteraction = (interaction, interactionIndex, pactPathOrUrl) => {
    const parsedInteraction = {
        description: interaction.description,
        location: `[pactRoot].interactions[${interactionIndex}]`,
        pactFile: pactPathOrUrl,
        state: interaction.state || '[none]',
        value: interaction
    };
    const getBodyPath = (bodyValue, bodyLocation, path) => {
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
    parsedInteraction.getRequestBodyPath = (path) => getBodyPath(interaction.request.body, `${parsedInteraction.location}.request.body`, path);
    parsedInteraction.getResponseBodyPath = (path) => getBodyPath(interaction.response.body, `${parsedInteraction.location}.response.body`, path);
    parsedInteraction.parentInteraction = parsedInteraction;
    parsedInteraction.requestBody = {
        location: `${parsedInteraction.location}.request.body`,
        parentInteraction: parsedInteraction,
        value: interaction.request.body
    };
    parsedInteraction.requestHeaders = parseHeaders(interaction.request.headers, 'request', parsedInteraction);
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
    parsedInteraction.responseHeaders =
        parseHeaders(interaction.response.headers, 'response', parsedInteraction);
    parsedInteraction.responseStatus = {
        location: `${parsedInteraction.location}.response.status`,
        parentInteraction: parsedInteraction,
        value: interaction.response.status
    };
    return parsedInteraction;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    parse: (pactJson, pactPathOrUrl) => ({
        interactions: _.map(pactJson.interactions, (interaction, interactionIndex) => parseInteraction(interaction, interactionIndex, pactPathOrUrl)),
        pathOrUrl: pactPathOrUrl
    })
};
