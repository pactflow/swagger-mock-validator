'use strict';

const cloneDeep = require('lodash').cloneDeep;
const setValueOn = require('../builder-utilities').setValueOn;

const createInteractionBuilder = (interaction) => ({
    build: () => cloneDeep(interaction),
    withDescription: (description) => createInteractionBuilder(setValueOn(interaction, 'description', description)),
    withRequestMethodPost: () => createInteractionBuilder(setValueOn(interaction, 'request.method', 'POST')),
    withRequestPath: (path) => createInteractionBuilder(setValueOn(interaction, 'request.path', path))
});

module.exports = createInteractionBuilder({
    description: 'default-description',
    request: {
        method: 'GET',
        path: '/default/path'
    },
    response: {status: 200}
});
