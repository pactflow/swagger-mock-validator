'use strict';

module.exports = {
    parse: (pactJson, pactPathOrUrl) => {
        const parsedInteractionsValue = pactJson.interactions.map((interaction, index) => {
            const parsedInteraction = {};

            const parsedRequestPathSegmentsValue = interaction.request.path.split('/').map((pathSegment) =>
                ({
                    parentInteraction: parsedInteraction,
                    rawValue: pathSegment
                }));

            parsedInteraction.parsedValue = {
                description: {rawValue: interaction.description},
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
