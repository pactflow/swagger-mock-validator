'use strict';

const cloneDeep = require('lodash').cloneDeep;
const setValueOn = require('../builder-utilities').setValueOn;

const createInteractionBuilder = (interaction) => ({
    build: () => cloneDeep(interaction),
    withDescription: (description) => createInteractionBuilder(setValueOn(interaction, 'description', description)),
    withRequestBody: (body) => createInteractionBuilder(setValueOn(interaction, 'request.body', body)),
    withRequestMethodGet: () => createInteractionBuilder(setValueOn(interaction, 'request.method', 'GET')),
    withRequestMethodPost: () => createInteractionBuilder(setValueOn(interaction, 'request.method', 'POST')),
    withRequestPath: (path) => createInteractionBuilder(setValueOn(interaction, 'request.path', path)),
    withResponseBody: (body) => createInteractionBuilder(setValueOn(interaction, 'response.body', body))
});

module.exports = createInteractionBuilder({
    description: 'default-description',
    request: {
        method: 'GET',
        path: '/default/path'
    },
    response: {status: 200}
});
