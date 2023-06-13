import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {swaggerMockValidatorLoader} from './support/swagger-mock-validator-loader';
import {swagger2Builder} from './support/swagger2-builder';
import {operationBuilder} from './support/swagger2-builder/operation-builder';
import {pathBuilder} from './support/swagger2-builder/path-builder';
import {responseBuilder} from './support/swagger2-builder/response-builder';
import {securitySchemeBuilder} from './support/swagger2-builder/security-scheme-builder';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('security', () => {
    const expectedFailedValidationError = 'Mock file "pact.json" is not compatible with spec file "spec.json"';
    const defaultInteractionBuilder = interactionBuilder
        .withDescription('interaction description')
        .withRequestPath('/does/exist')
        .withResponseStatus(200);

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    it('should pass when the pact request has the required basic auth', async () => {
        const pactFile = pactBuilder
            .withInteraction(defaultInteractionBuilder
                .withRequestHeader('Authorization', 'Basic user:pass')
            )
            .build();

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withSecurityRequirementNamed('basic'))
            )
            .withSecurityDefinitionNamed('basic', securitySchemeBuilder.withTypeBasic())
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should return an error when the pact request is missing required basic auth', async () => {
        const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withSecurityRequirementNamed('basic'))
            )
            .withSecurityDefinitionNamed('basic', securitySchemeBuilder.withTypeBasic())
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.authorization.missing',
            message: 'Request Authorization header is missing but is required by the spec file',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0]',
                mockFile: 'pact.json',
                value: defaultInteractionBuilder.build()
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.security[0].basic',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: []
            },
            type: 'error'
        }]);
    });

    it('should pass when the pact request has the required apiKey auth header', async () => {
        const pactFile = pactBuilder
            .withInteraction(defaultInteractionBuilder
                .withRequestHeader('x-api-token', 'Bearer a-token')
            )
            .build();

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withSecurityRequirementNamed('apiKey'))
            )
            .withSecurityDefinitionNamed('apiKey', securitySchemeBuilder.withTypeApiKeyInHeader('x-api-token'))
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should pass when the pact request has the required apiKey auth header but in a different case', async () => {
        const pactFile = pactBuilder
            .withInteraction(defaultInteractionBuilder
                .withRequestHeader('x-API-token', 'Bearer a-token')
            )
            .build();

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withSecurityRequirementNamed('apiKey'))
            )
            .withSecurityDefinitionNamed('apiKey', securitySchemeBuilder.withTypeApiKeyInHeader('X-Api-Token'))
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should return an error when the pact request is missing required apiKey auth header', async () => {
        const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withSecurityRequirementNamed('apiKey'))
            )
            .withSecurityDefinitionNamed('apiKey', securitySchemeBuilder.withTypeApiKeyInHeader('x-api-token'))
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.authorization.missing',
            message: 'Request Authorization header is missing but is required by the spec file',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0]',
                mockFile: 'pact.json',
                value: defaultInteractionBuilder.build()
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.security[0].apiKey',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: []
            },
            type: 'error'
        }]);
    });

    it('should pass when the pact request has the required apiKey auth query', async () => {
        const pactFile = pactBuilder
            .withInteraction(defaultInteractionBuilder
                .withRequestQuery('apiToken=an-api-token')
            )
            .build();

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withSecurityRequirementNamed('apiKey'))
            )
            .withSecurityDefinitionNamed('apiKey', securitySchemeBuilder.withTypeApiKeyInQuery('apiToken'))
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should fail when the pact request has the required apiKey auth query but with a different case', async () => {
        const pactInteraction = defaultInteractionBuilder
            .withRequestQuery('APIToken=an-api-token');

        const pactFile = pactBuilder
            .withInteraction(pactInteraction)
            .build();

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withSecurityRequirementNamed('apiKey'))
            )
            .withSecurityDefinitionNamed('apiKey', securitySchemeBuilder.withTypeApiKeyInQuery('ApiToken'))
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result).toContainErrors([{
            code: 'request.authorization.missing',
            message: 'Request Authorization query is missing but is required by the spec file',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0]',
                mockFile: 'pact.json',
                value: pactInteraction.build()
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.security[0].apiKey',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: []
            },
            type: 'error'
        }]);
    });

    it('should return an error when the pact request is missing required apiKey auth query', async () => {
        const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withSecurityRequirementNamed('apiKey'))
            )
            .withSecurityDefinitionNamed('apiKey', securitySchemeBuilder.withTypeApiKeyInQuery('apiToken'))
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.authorization.missing',
            message: 'Request Authorization query is missing but is required by the spec file',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0]',
                mockFile: 'pact.json',
                value: defaultInteractionBuilder.build()
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.security[0].apiKey',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: []
            },
            type: 'error'
        }]);
    });

    it('should pass for failure case, ignoring security requirements', async () => {
        const pactFile = pactBuilder
            .withInteraction(
                interactionBuilder
                    .withDescription('does not have request credentials')
                    .withRequestPath('/does/exist')
                    .withResponseStatus(401)
            )
            .build();

        const swaggerFile = swagger2Builder
            .withPath(
                '/does/exist',
                pathBuilder.withGetOperation(
                    operationBuilder.withSecurityRequirementNamed('apiKey').withResponse(401, responseBuilder)
                )
            )
            .withSecurityDefinitionNamed('apiKey', securitySchemeBuilder.withTypeApiKeyInQuery('apiToken'))
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should pass when the pact request has one of the security requirements', async () => {
        const pactFile = pactBuilder
            .withInteraction(defaultInteractionBuilder.withRequestHeader('x-api-key-header', 'Bearer a-token'))
            .build();

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder
                    .withSecurityRequirementNamed('apiKeyQuery')
                    .withSecurityRequirementNamed('apiKeyHeader')
                    .withSecurityRequirementNamed('basic')
                )
            )
            .withSecurityDefinitionNamed('apiKeyHeader', securitySchemeBuilder
                .withTypeApiKeyInHeader('x-api-key-header'))
            .withSecurityDefinitionNamed('apiKeyQuery', securitySchemeBuilder.withTypeApiKeyInQuery('apiKey'))
            .withSecurityDefinitionNamed('basic', securitySchemeBuilder.withTypeBasic())
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should return an error when the pact request is missing required apiKey query and header', async () => {
        const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withSecurityRequirementsNamed(['apiKeyHeader', 'apiKeyQuery']))
            )
            .withSecurityDefinitionNamed('apiKeyHeader', securitySchemeBuilder
                .withTypeApiKeyInHeader('x-api-key-header')
            )
            .withSecurityDefinitionNamed('apiKeyQuery', securitySchemeBuilder.withTypeApiKeyInQuery('apiKey'))
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.authorization.missing',
            message: 'Request Authorization header is missing but is required by the spec file',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0]',
                mockFile: 'pact.json',
                value: defaultInteractionBuilder.build()
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.security[0].apiKeyHeader',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: []
            },
            type: 'error'
        }, {
            code: 'request.authorization.missing',
            message: 'Request Authorization query is missing but is required by the spec file',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0]',
                mockFile: 'pact.json',
                value: defaultInteractionBuilder.build()
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.security[0].apiKeyQuery',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: []
            },
            type: 'error'
        }]);
    });

    it('should ignore oauth2 security definitions', async () => {
        const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withSecurityRequirementNamed('oauth', ['write']))
            )
            .withSecurityDefinitionNamed('oauth', securitySchemeBuilder.withTypeOAuth2())
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should pass when pact does not match supported requirements but spec contains an unsupported one', async () => {
        const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder
                    .withSecurityRequirementNamed('oauth', ['write'])
                    .withSecurityRequirementNamed('basic')
                )
            )
            .withSecurityDefinitionNamed('basic', securitySchemeBuilder.withTypeBasic())
            .withSecurityDefinitionNamed('oauth', securitySchemeBuilder.withTypeOAuth2())
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);
        expect(result).toContainNoWarningsOrErrors();
    });

    it('should pass if pact does not have auth but the spec contains an empty security requirement', async () => {
        const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder
                    .withEmptySecurityRequirement()
                    .withSecurityRequirementNamed('basic')
                ))
            .withSecurityDefinitionNamed('basic', securitySchemeBuilder.withTypeBasic())
            .build();
        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);
        expect(result).toContainNoWarningsOrErrors();
    });

    it('should return an error when the pact request is missing a globally required apiKey', async () => {
        const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder.withGetOperation(operationBuilder))
            .withSecurityDefinitionNamed('apiKey', securitySchemeBuilder.withTypeApiKeyInQuery('apiToken'))
            .withSecurityRequirementNamed('apiKey')
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.authorization.missing',
            message: 'Request Authorization query is missing but is required by the spec file',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0]',
                mockFile: 'pact.json',
                value: defaultInteractionBuilder.build()
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].security[0].apiKey',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: []
            },
            type: 'error'
        }]);
    });

    it('should use operation security definitions over globally defined ones', async () => {
        const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder.withGetOperation(operationBuilder
                .withSecurityRequirementNamed('header')
            ))
            .withSecurityDefinitionNamed('header', securitySchemeBuilder.withTypeApiKeyInHeader('Authorization'))
            .withSecurityDefinitionNamed('query', securitySchemeBuilder.withTypeApiKeyInQuery('auth'))
            .withSecurityRequirementNamed('query')
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.authorization.missing',
            message: 'Request Authorization header is missing but is required by the spec file',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0]',
                mockFile: 'pact.json',
                value: defaultInteractionBuilder.build()
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.security[0].header',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: []
            },
            type: 'error'
        }]);
    });
});
