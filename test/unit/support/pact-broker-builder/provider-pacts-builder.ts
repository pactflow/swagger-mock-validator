import {cloneDeep} from 'lodash';
import {PactBrokerProviderPacts} from '../../../../lib/swagger-mock-validator/types';
import {addToArrayOn} from '../builder-utilities';

const createProviderPactsBuilder = (providerPacts: PactBrokerProviderPacts) => ({
    build: () => cloneDeep(providerPacts),
    withPact: (pactUrl: string) =>
        createProviderPactsBuilder(addToArrayOn(providerPacts, '_links.pacts', {href: pactUrl}))
});

export const providerPactsBuilder = createProviderPactsBuilder({
    _links: {
        pacts: []
    }
});
