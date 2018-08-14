import {cloneDeep} from 'lodash';
import {
    ApiKeySecurityScheme,
    NonBearerHttpSecurityScheme, OAuth2SecurityScheme
} from '../../../../lib/swagger-mock-validator/spec-parser/openapi3/openapi3';

type OpenApi3SecurityScheme = NonBearerHttpSecurityScheme | ApiKeySecurityScheme | OAuth2SecurityScheme;

export interface Openapi3SecuritySchemeBuilder {
    build(): OpenApi3SecurityScheme;
}

const createOpenApi3SecuritySchemeBuilder = (securityScheme: OpenApi3SecurityScheme) => ({
    build: () => cloneDeep(securityScheme),
    withTypeApiKeyInCookie: (name: string) => createOpenApi3SecuritySchemeBuilder({in: 'cookie', name, type: 'apiKey'}),
    withTypeApiKeyInHeader: (name: string) => createOpenApi3SecuritySchemeBuilder({in: 'header', name, type: 'apiKey'}),
    withTypeApiKeyInQuery: (name: string) => createOpenApi3SecuritySchemeBuilder({in: 'query', name, type: 'apiKey'}),
    withTypeBasic: () => createOpenApi3SecuritySchemeBuilder({type: 'http', scheme: 'Basic'}),
    withTypeOAuth2: () => createOpenApi3SecuritySchemeBuilder({
        flows: {},
        type: 'oauth2'
    })
});

export const openApi3SecuritySchemeBuilder = createOpenApi3SecuritySchemeBuilder({
    scheme: 'Basic',
    type: 'http'
});
