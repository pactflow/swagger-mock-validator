import {cloneDeep} from 'lodash';
import {PactInteraction} from '../../../../lib/swagger-pact-validator/types';
import {setValueOn} from '../builder-utilities';

export interface InteractionBuilder {
    build: () => PactInteraction;
}

const createInteractionBuilder = (interaction: PactInteraction) => ({
    build: () => cloneDeep(interaction),
    withDescription: (description: string) =>
        createInteractionBuilder(setValueOn(interaction, 'description', description)),
    withRequestBody: (body: any) => createInteractionBuilder(setValueOn(interaction, 'request.body', body)),
    withRequestMethodGet: () => createInteractionBuilder(setValueOn(interaction, 'request.method', 'GET')),
    withRequestMethodPost: () => createInteractionBuilder(setValueOn(interaction, 'request.method', 'POST')),
    withRequestPath: (path: string) => createInteractionBuilder(setValueOn(interaction, 'request.path', path)),
    withResponseBody: (body: any) => createInteractionBuilder(setValueOn(interaction, 'response.body', body)),
    withResponseStatus: (status: number) => createInteractionBuilder(setValueOn(interaction, 'response.status', status))
});

export const interactionBuilder = createInteractionBuilder({
    description: 'default-description',
    request: {
        method: 'GET',
        path: '/default/path'
    },
    response: {status: 200}
});
