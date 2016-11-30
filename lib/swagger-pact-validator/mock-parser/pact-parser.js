'use strict';

const _ = require('lodash');

module.exports = {
    parse: (pactJson, pactPathOrUrl) => {
        const parsedInteractionsValue = pactJson.interactions.map((interaction, index) => {
            const parsedInteraction = {};

            const parsedRequestPathSegmentsValue = interaction.request.path.split('/').map((pathSegment) =>
                ({
                    location: `[pactRoot].interactions[${index}].request.path`,
                    parentInteraction: parsedInteraction,
                    rawValue: pathSegment
                }));

            parsedInteraction.parsedValue = {
                description: {rawValue: interaction.description},
                getRequestBodyPath: (path) => {
                    let location = `[pactRoot].interactions[${index}].request.body`;
                    let rawValue = interaction.request.body;

                    if (path) {
                        location += `.${path}`;
                        rawValue = _.get(rawValue, path);
                    }

                    return {
                        location,
                        parentInteraction: parsedInteraction,
                        rawValue
                    };
                },
                requestBody: {
                    location: `[pactRoot].interactions[${index}].request.body`,
                    parentInteraction: parsedInteraction,
                    rawValue: interaction.request.body
                },
                requestMethod: {
                    location: `[pactRoot].interactions[${index}].request.method`,
                    parentInteraction: parsedInteraction,
                    rawValue: interaction.request.method.toLowerCase()
                },
                requestPath: {
                    location: `[pactRoot].interactions[${index}].request.path`,
                    parentInteraction: parsedInteraction,
                    rawValue: interaction.request.path
                },
                requestPathSegments: {parsedValue: parsedRequestPathSegmentsValue},
                responseStatus: {
                    location: `[pactRoot].interactions[${index}].response.status`,
                    parentInteraction: parsedInteraction,
                    rawValue: interaction.response.status
                },
                state: {
                    parentInteraction: parsedInteraction,
                    rawValue: interaction.state || '[none]'
                }
            };

            parsedInteraction.rawValue = interaction;

            return parsedInteraction;
        });

        return {
            parsedValue: {
                interactions: {parsedValue: parsedInteractionsValue},
                pathOrUrl: {rawValue: pactPathOrUrl}
            }
        };
    }
};
