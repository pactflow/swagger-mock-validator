import {cloneDeep} from 'lodash';
import {PactBrokerRootResponse} from '../../../lib/swagger-mock-validator/types';
import {removeValueOn, setValueOn} from './builder-utilities';

const createPactBrokerResponseBuilder = (pactBroker: PactBrokerRootResponse) => ({
    build: () => cloneDeep(pactBroker),
    withLatestProviderPactsLink: (link: string) =>
        createPactBrokerResponseBuilder(setValueOn(pactBroker, '_links.pb:latest-provider-pacts.href', link)),
    withLatestProviderPactsWithTagLink: (link: string) =>
        createPactBrokerResponseBuilder(setValueOn(pactBroker, '_links.pb:latest-provider-pacts-with-tag.href', link)),
    withNoLatestProviderPactsLink: () =>
        createPactBrokerResponseBuilder(removeValueOn(pactBroker, '_links.pb:latest-provider-pacts.href')),
    withNoLatestProviderPactsWithTagLink: () =>
        createPactBrokerResponseBuilder(removeValueOn(pactBroker, '_links.pb:latest-provider-pacts-with-tag.href'))
});

export const pactBrokerResponseBuilder = createPactBrokerResponseBuilder({
    _links: {
        'pb:latest-provider-pacts': {
            href: 'http://default-pact-broker.com/{provider}/pacts'
        },
        'pb:latest-provider-pacts-with-tag': {
            href: 'http://default-pact-broker.com/{provider}/pacts/{tag}'
        }
    }
});

export {providerPactsBuilder} from './pact-broker-response-builder/provider-pacts-builder';
