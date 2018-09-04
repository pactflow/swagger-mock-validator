import {cloneDeep} from 'lodash';
import {PactBroker} from '../../../lib/swagger-mock-validator/types';
import {removeValueOn, setValueOn} from './builder-utilities';

const createPactBrokerBuilder = (pactBroker: PactBroker) => ({
    build: () => cloneDeep(pactBroker),
    withLatestProviderPactsLink: (link: string) =>
        createPactBrokerBuilder(setValueOn(pactBroker, '_links.pb:latest-provider-pacts.href', link)),
    withLatestProviderPactsWithTagLink: (link: string) =>
        createPactBrokerBuilder(setValueOn(pactBroker, '_links.pb:latest-provider-pacts-with-tag.href', link)),
    withNoLatestProviderPactsLink: () =>
        createPactBrokerBuilder(removeValueOn(pactBroker, '_links.pb:latest-provider-pacts.href')),
    withNoLatestProviderPactsWithTagLink: () =>
        createPactBrokerBuilder(removeValueOn(pactBroker, '_links.pb:latest-provider-pacts-with-tag.href'))
});

export const pactBrokerBuilder = createPactBrokerBuilder({
    _links: {
        'pb:latest-provider-pacts': {
            href: 'http://default-pact-broker.com/{provider}/pacts'
        },
        'pb:latest-provider-pacts-with-tag': {
            href: 'http://default-pact-broker.com/{provider}/pacts/{tag}'
        }
    }
});

export {providerPactsBuilder} from './pact-broker-builder/provider-pacts-builder';
