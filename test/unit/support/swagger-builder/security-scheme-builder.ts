import {cloneDeep} from 'lodash';
import {Swagger2SecurityScheme} from '../../../../lib/swagger-mock-validator/spec-parser/swagger2/swagger2';

export interface SecuritySchemeBuilder {
    build: () => Swagger2SecurityScheme;
}

const createSecuritySchemeBuilder = (securityScheme: Swagger2SecurityScheme) => ({
    build: () => cloneDeep(securityScheme),
    withTypeApiKeyInHeader: (name: string) => createSecuritySchemeBuilder({in: 'header', name, type: 'apiKey'}),
    withTypeApiKeyInQuery: (name: string) => createSecuritySchemeBuilder({in: 'query', name, type: 'apiKey'}),
    withTypeBasic: () => createSecuritySchemeBuilder({type: 'basic'}),
    withTypeOAuth2: () => createSecuritySchemeBuilder({
        flow: 'application',
        scopes: {
            write: 'write permissions'
        },
        tokenUrl: 'http://token-url.com',
        type: 'oauth2'
    })
});

export const securitySchemeBuilder = createSecuritySchemeBuilder({type: 'basic'});
