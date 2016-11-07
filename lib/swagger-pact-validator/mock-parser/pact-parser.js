'use strict';

module.exports = {
    parse: (pactJson, pactPathOrUrl) => {
        const parsedInteractionsValue = pactJson.interactions.map((interaction, index) => {
            const parsedInteraction = {rawValue: interaction};

            parsedInteraction.description = {
                interaction: parsedInteraction,
                value: interaction.description
            };
            parsedInteraction.requestMethod = {value: interaction.request.method};
            parsedInteraction.requestPath = {
                interaction: parsedInteraction,
                location: `[pactRoot].interactions[${index}].request.path`,
                value: interaction.request.path
            };
            parsedInteraction.state = {
                interaction: parsedInteraction,
                value: interaction.state || '[none]'
            };

            const parsedRequestPathSegmentsValue = interaction.request.path.split('/').map((pathSegment) =>
                ({
                    interaction: parsedInteraction,
                    value: pathSegment
                }));

            parsedInteraction.requestPathSegments = {value: parsedRequestPathSegmentsValue};

            return parsedInteraction;
        });

        return {
            interactions: {value: parsedInteractionsValue},
            pathOrUrl: {value: pactPathOrUrl}
        };
    }
};
