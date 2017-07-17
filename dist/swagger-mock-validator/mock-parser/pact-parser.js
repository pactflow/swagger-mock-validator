"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const querystring = require("querystring");
const parseRequestPathSegments = (requestPath, parentInteraction) => _(requestPath.split('/'))
    .filter((requestPathSegment) => requestPathSegment.length > 0)
    .map((requestPathSegment) => ({
    location: `${parentInteraction.location}.request.path`,
    parentInteraction,
    value: requestPathSegment
}))
    .value();
const parseValues = (values, location, parentInteraction) => {
    return _.reduce(values, (result, value, name) => {
        result[name.toLowerCase()] = {
            location: `${location}.${name}`,
            parentInteraction,
            value
        };
        return result;
    }, {});
};
const parseInteraction = (interaction, interactionIndex, mockPathOrUrl) => {
    // tslint:disable:no-object-literal-type-assertion
    const parsedInteraction = {
        description: interaction.description,
        location: `[pactRoot].interactions[${interactionIndex}]`,
        mockFile: mockPathOrUrl,
        state: interaction.providerState || interaction.provider_state || '[none]',
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
    parsedInteraction.requestHeaders = parseValues(interaction.request.headers, `${parsedInteraction.location}.request.headers`, parsedInteraction);
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
    const separator = '[multi-array-separator]';
    _.each(query, (v, k) => {
        if (_.isArray(v)) {
            query[k] = v.join(separator);
        }
    });
    parsedInteraction.requestQuery = parseValues(query, `${parsedInteraction.location}.request.query`, parsedInteraction);
    parsedInteraction.responseBody = {
        location: `${parsedInteraction.location}.response.body`,
        parentInteraction: parsedInteraction,
        value: interaction.response.body
    };
    parsedInteraction.responseHeaders = parseValues(interaction.response.headers, `${parsedInteraction.location}.response.headers`, parsedInteraction);
    parsedInteraction.responseStatus = {
        location: `${parsedInteraction.location}.response.status`,
        parentInteraction: parsedInteraction,
        value: interaction.response.status
    };
    return parsedInteraction;
};
exports.default = {
    parse: (pactJson, mockPathOrUrl) => ({
        consumer: pactJson.consumer.name,
        interactions: _.map(pactJson.interactions, (interaction, interactionIndex) => parseInteraction(interaction, interactionIndex, mockPathOrUrl)),
        pathOrUrl: mockPathOrUrl,
        provider: pactJson.provider.name
    })
};
