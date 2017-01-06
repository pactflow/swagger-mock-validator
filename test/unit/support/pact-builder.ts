import {cloneDeep} from 'lodash';
import {Pact} from '../../../lib/swagger-pact-validator/types';
import {addToArrayOn, removeValueOn} from './builder-utilities';
import {InteractionBuilder} from './pact-builder/interaction-builder';

const createPactBuilder = (pact: Pact) => ({
    build: () => cloneDeep(pact),
    withInteraction: (interactionBuilder: InteractionBuilder) =>
        createPactBuilder(addToArrayOn(pact, 'interactions', interactionBuilder.build())),
    withMissingInteractions: () => createPactBuilder(removeValueOn(pact, 'interactions'))
});

export const pactBuilder = createPactBuilder({
    consumer: {name: 'default-consumer-name'},
    interactions: [],
    metadata: {pactSpecificationVersion: '1.0.0'},
    provider: {name: 'default-provider-name'}
});

export {interactionBuilder} from './pact-builder/interaction-builder';
