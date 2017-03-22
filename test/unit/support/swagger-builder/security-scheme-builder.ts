import {cloneDeep} from 'lodash';
import {SwaggerSecurityScheme} from '../../../../lib/swagger-mock-validator/types';

export interface SecuritySchemeBuilder {
    build: () => SwaggerSecurityScheme;
}

const createSecuritySchemeBuilder = (securityScheme: SwaggerSecurityScheme) => ({
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

export default createSecuritySchemeBuilder({type: 'basic'});
