'use strict';

const addToArrayOn = require('./builder-utilities').addToArrayOn;
const cloneDeep = require('lodash').cloneDeep;

const createPactBuilder = (pact) => ({
    build: () => cloneDeep(pact),
    withInteraction: (interactionBuilder) =>
        createPactBuilder(addToArrayOn(pact, 'interactions', interactionBuilder.build()))
});

const pactBuilder = createPactBuilder({
    provider: {name: 'default-provider-name'},
    consumer: {name: 'deault-consumer-name'},
    interactions: [],
    metadata: {pactSpecificationVersion: '1.0.0'}
});

pactBuilder.interaction = require('./pact-builder/interaction-builder');

module.exports = pactBuilder;
