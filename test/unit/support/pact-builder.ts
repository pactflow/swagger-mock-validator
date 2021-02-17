import {cloneDeep} from 'lodash';
import {Pact} from '../../../lib/swagger-mock-validator/mock-parser/pact/pact';
import {addToArrayOn, removeValueOn, setValueOn} from './builder-utilities';
import {InteractionBuilder} from './pact-builder/interaction-builder';

const createPactBuilder = (pact: Pact) => ({
    build: () => cloneDeep(pact),
    withConsumer: (consumerName: string) => createPactBuilder(setValueOn(pact, 'consumer.name', consumerName)),
    withInteraction: (interactionBuilder: InteractionBuilder) =>
        createPactBuilder(addToArrayOn(pact, 'interactions', interactionBuilder.build())),
    withMissingInteractions: () => createPactBuilder(removeValueOn(pact, 'interactions')),
    withProvider: (providerName: string) => createPactBuilder(setValueOn(pact, 'provider.name', providerName))
});

export const pactBuilder = createPactBuilder({
    consumer: {name: 'default-consumer-name'},
    interactions: [],
    metadata: {pactSpecification: {version: '1.0.0'}},
    provider: {name: 'default-provider-name'}
});

export {interactionBuilder} from './pact-builder/interaction-builder';
