"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pactParser = void 0;
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
        result[name] = {
            location: `${location}.${name}`,
            parentInteraction,
            value
        };
        return result;
    }, {});
};
const parseHeaders = (headers, location, parentInteraction) => {
    for (const key in headers) {
        if (typeof headers[key] !== 'string') {
            headers[key] = headers[key].toString();
        }
    }
    return parseValues(headers, location, parentInteraction);
};
const isPactV1RequestQuery = (query) => typeof query === 'string';
const parseAsPactV1RequestQuery = (requestQuery) => {
    const parsedQueryAsStringsOrArrayOfStrings = querystring.parse(requestQuery);
    const separator = '[multi-array-separator]';
    return Object.keys(parsedQueryAsStringsOrArrayOfStrings)
        .reduce((accumulator, queryName) => {
        const queryValue = parsedQueryAsStringsOrArrayOfStrings[queryName] || '';
        accumulator[queryName] = (queryValue instanceof Array) ? queryValue.join(separator) : queryValue;
        return accumulator;
    }, {});
};
const parseAsPactV3RequestQuery = (requestQuery) => {
    const separator = '[multi-array-separator]';
    return Object.keys(requestQuery)
        .reduce((accumulator, queryName) => {
        accumulator[queryName] = requestQuery[queryName].join(separator);
        return accumulator;
    }, {});
};
const parseRequestQuery = (requestQuery) => {
    requestQuery = requestQuery || '';
    return isPactV1RequestQuery(requestQuery)
        ? parseAsPactV1RequestQuery(requestQuery)
        : parseAsPactV3RequestQuery(requestQuery);
};
const parseInteraction = (interaction, interactionIndex, mockPathOrUrl) => {
    // tslint:disable:no-object-literal-type-assertion
    const parsedInteraction = {
        description: interaction.description,
        location: `[root].interactions[${interactionIndex}]`,
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
    parsedInteraction.getRequestBodyPath = (path) => { var _a; return getBodyPath((_a = interaction === null || interaction === void 0 ? void 0 : interaction.request) === null || _a === void 0 ? void 0 : _a.body, `${parsedInteraction.location}.request.body`, path); };
    parsedInteraction.getResponseBodyPath = (path) => { var _a; return getBodyPath((_a = interaction === null || interaction === void 0 ? void 0 : interaction.response) === null || _a === void 0 ? void 0 : _a.body, `${parsedInteraction.location}.response.body`, path); };
    parsedInteraction.parentInteraction = parsedInteraction;
    parsedInteraction.requestBody = {
        location: `${parsedInteraction.location}.request.body`,
        parentInteraction: parsedInteraction,
        value: interaction.request.body
    };
    parsedInteraction.requestHeaders = parseHeaders(interaction.request.headers, `${parsedInteraction.location}.request.headers`, parsedInteraction);
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
    parsedInteraction.requestQuery = parseValues(parseRequestQuery(interaction.request.query), `${parsedInteraction.location}.request.query`, parsedInteraction);
    parsedInteraction.responseBody = {
        location: `${parsedInteraction.location}.response.body`,
        parentInteraction: parsedInteraction,
        value: interaction.response.body
    };
    parsedInteraction.responseHeaders = parseHeaders(interaction.response.headers, `${parsedInteraction.location}.response.headers`, parsedInteraction);
    parsedInteraction.responseStatus = {
        location: `${parsedInteraction.location}.response.status`,
        parentInteraction: parsedInteraction,
        value: interaction.response.status
    };
    return parsedInteraction;
};
const filterUnsupportedTypes = (interaction) => {
    if (!(interaction === null || interaction === void 0 ? void 0 : interaction.type) || interaction.type === 'Synchronous/HTTP') {
        return interaction;
    }
    return null;
};
exports.pactParser = {
    parse: (pactJson, mockPathOrUrl) => ({
        consumer: pactJson.consumer.name,
        interactions: pactJson.interactions.filter(interaction => filterUnsupportedTypes(interaction)).map((interaction, interactionIndex) => parseInteraction(interaction, interactionIndex, mockPathOrUrl)),
        pathOrUrl: mockPathOrUrl,
        provider: pactJson.provider.name
    })
};
