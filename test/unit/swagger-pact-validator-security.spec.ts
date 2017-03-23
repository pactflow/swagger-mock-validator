import {expectToReject, willResolve} from 'jasmine-promise-tools';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {
    operationBuilder,
    pathBuilder,
    securitySchemeBuilder,
    swaggerBuilder
} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-pact-validator-loader';

declare function expect(actual: any): CustomMatchers;

describe('swagger-pact-validator security', () => {
    const expectedFailedValidationError =
        new Error('Pact file "pact.json" is not compatible with swagger file "swagger.json"');
    const defaultInteractionBuilder = interactionBuilder
        .withDescription('interaction description')
        .withRequestPath('/does/exist')
        .withResponseStatus(200);

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    it('should pass when the pact request is has the required basic auth', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(defaultInteractionBuilder
                .withRequestHeader('Authorization', 'Basic user:pass')
            )
            .build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withSecurityRequirementNamed('basic'))
            )
            .withSecurityDefinitionNamed('basic', securitySchemeBuilder.withTypeBasic())
            .build();

        return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should return an error when the pact request is missing required basic auth', willResolve(() => {
        const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withSecurityRequirementNamed('basic'))
            )
            .withSecurityDefinitionNamed('basic', securitySchemeBuilder.withTypeBasic())
            .build();

        const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                code: 'spv.request.authorization.missing',
                message: 'Request Authorization header is missing but is required by the swagger file',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0]',
                    pactFile: 'pact.json',
                    value: defaultInteractionBuilder.build()
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.security[0].basic',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: []
                },
                type: 'error'
            }]);
        });
    }));

    it('should pass when the pact request is has the required apiKey auth header', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(defaultInteractionBuilder
                .withRequestHeader('x-api-token', 'Bearer a-token')
            )
            .build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withSecurityRequirementNamed('apiKey'))
            )
            .withSecurityDefinitionNamed('apiKey', securitySchemeBuilder.withTypeApiKeyInHeader('x-api-token'))
            .build();

        return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should return an error when the pact request is missing required apiKey auth header', willResolve(() => {
        const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withSecurityRequirementNamed('apiKey'))
            )
            .withSecurityDefinitionNamed('apiKey', securitySchemeBuilder.withTypeApiKeyInHeader('x-api-token'))
            .build();

        const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                code: 'spv.request.authorization.missing',
                message: 'Request Authorization header is missing but is required by the swagger file',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0]',
                    pactFile: 'pact.json',
                    value: defaultInteractionBuilder.build()
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.security[0].apiKey',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: []
                },
                type: 'error'
            }]);
        });
    }));

    it('should pass when the pact request is has the required apiKey auth query', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(defaultInteractionBuilder
                .withRequestQuery('apiToken=an-api-token')
            )
            .build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withSecurityRequirementNamed('apiKey'))
            )
            .withSecurityDefinitionNamed('apiKey', securitySchemeBuilder.withTypeApiKeyInQuery('apiToken'))
            .build();

        return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should return an error when the pact request is missing required apiKey auth query', willResolve(() => {
        const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withSecurityRequirementNamed('apiKey'))
            )
            .withSecurityDefinitionNamed('apiKey', securitySchemeBuilder.withTypeApiKeyInQuery('apiToken'))
            .build();

        const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                code: 'spv.request.authorization.missing',
                message: 'Request Authorization query is missing but is required by the swagger file',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0]',
                    pactFile: 'pact.json',
                    value: defaultInteractionBuilder.build()
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.security[0].apiKey',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: []
                },
                type: 'error'
            }]);
        });
    }));

    it('should pass when the pact request is has one of the required apiKey query or header', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(defaultInteractionBuilder.withRequestHeader('x-api-key-header', 'Bearer a-token'))
            .build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder
                    .withSecurityRequirementNamed('apiKeyQuery')
                    .withSecurityRequirementNamed('apiKeyHeader')
                )
            )
            .withSecurityDefinitionNamed('apiKeyHeader', securitySchemeBuilder
                .withTypeApiKeyInHeader('x-api-key-header')
            )
            .withSecurityDefinitionNamed('apiKeyQuery', securitySchemeBuilder.withTypeApiKeyInQuery('apiKey'))
            .build();

        return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should return an error when the pact request is missing required apiKey query and header', willResolve(() => {
        const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withSecurityRequirementsNamed(['apiKeyHeader', 'apiKeyQuery']))
            )
            .withSecurityDefinitionNamed('apiKeyHeader', securitySchemeBuilder
                .withTypeApiKeyInHeader('x-api-key-header')
            )
            .withSecurityDefinitionNamed('apiKeyQuery', securitySchemeBuilder.withTypeApiKeyInQuery('apiKey'))
            .build();

        const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                code: 'spv.request.authorization.missing',
                message: 'Request Authorization header is missing but is required by the swagger file',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0]',
                    pactFile: 'pact.json',
                    value: defaultInteractionBuilder.build()
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.security[0].apiKeyHeader',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: []
                },
                type: 'error'
            }, {
                code: 'spv.request.authorization.missing',
                message: 'Request Authorization query is missing but is required by the swagger file',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0]',
                    pactFile: 'pact.json',
                    value: defaultInteractionBuilder.build()
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.security[0].apiKeyQuery',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: []
                },
                type: 'error'
            }]);
        });
    }));

    it('should ignore oauth2 security definitions', willResolve(() => {
        const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withSecurityRequirementNamed('oauth', ['write']))
            )
            .withSecurityDefinitionNamed('oauth', securitySchemeBuilder.withTypeOAuth2())
            .build();

        return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should return an error when the pact request is missing a globally required apiKey', willResolve(() => {
        const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder.withGetOperation(operationBuilder))
            .withSecurityDefinitionNamed('apiKey', securitySchemeBuilder.withTypeApiKeyInQuery('apiToken'))
            .withSecurityRequirementNamed('apiKey')
            .build();

        const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                code: 'spv.request.authorization.missing',
                message: 'Request Authorization query is missing but is required by the swagger file',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0]',
                    pactFile: 'pact.json',
                    value: defaultInteractionBuilder.build()
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].security[0].apiKey',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: []
                },
                type: 'error'
            }]);
        });
    }));

    it('should use operation security definitions over globally defined ones', willResolve(() => {
        const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder.withGetOperation(operationBuilder
                .withSecurityRequirementNamed('header')
            ))
            .withSecurityDefinitionNamed('header', securitySchemeBuilder.withTypeApiKeyInHeader('Authorization'))
            .withSecurityDefinitionNamed('query', securitySchemeBuilder.withTypeApiKeyInQuery('auth'))
            .withSecurityRequirementNamed('query')
            .build();

        const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                code: 'spv.request.authorization.missing',
                message: 'Request Authorization header is missing but is required by the swagger file',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0]',
                    pactFile: 'pact.json',
                    value: defaultInteractionBuilder.build()
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.security[0].header',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: []
                },
                type: 'error'
            }]);
        });
    }));
});
