import fs from 'fs';
import SwaggerMockValidator from '../../lib/api';
import { SwaggerMockValidatorErrorImpl } from '../../lib/swagger-mock-validator/swagger-mock-validator-error-impl';
import { expectToFail } from '../helpers/expect-to-fail';

describe('swagger-mock-validator/api', () => {
    const loadContent = (filePath: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(data.toString());
                }
            });
        });
    };

    it('should succeed when a pact file and a swagger file are compatible', async () => {
        const specPath = 'test/e2e/fixtures/swagger-provider.json';
        const mockPath = 'test/e2e/fixtures/pact-working-consumer.json';

        const specContent = await loadContent(specPath);
        const mockContent = await loadContent(mockPath);

        const result = await SwaggerMockValidator.validate({
            mock: {
                content: mockContent,
                format: 'pact',
                pathOrUrl: mockPath
            },
            spec: {
                content: specContent,
                format: 'swagger2',
                pathOrUrl: specPath
            },
            additionalPropertiesInResponse: true,
            requiredPropertiesInResponse: false
        });

        expect(result).toEqual({
            errors: [],
            failureReason: undefined,
            success: true,
            warnings: [{
                code: 'request.header.unknown',
                message: 'Request header is not defined in the spec file: x-unknown-header',
                mockDetails: {
                    interactionDescription: 'unknown header as a warning test',
                    interactionState: '[none]',
                    location: '[root].interactions[16].request.headers.x-unknown-header',
                    mockFile: 'test/e2e/fixtures/pact-working-consumer.json',
                    value: '1,2'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths./test.get',
                    pathMethod: 'get',
                    pathName: '/test',
                    specFile: specPath,
                    value: jasmine.any(Object)
                },
                type: 'warning'
            }]
        });
    }, 30000);

    it('should pass when the pact file is v3 format', async () => {
        const specPath = 'test/e2e/fixtures/pactv3-compatible-swagger.yaml';
        const mockPath = 'test/e2e/fixtures/v3-pact-file.json';

        const specContent = await loadContent(specPath);
        const mockContent = await loadContent(mockPath);

        const result = await SwaggerMockValidator.validate({
            mock: {
                content: mockContent,
                format: 'pact',
                pathOrUrl: mockPath
            },
            spec: {
                content: specContent,
                format: 'openapi3',
                pathOrUrl: specPath
            },
            additionalPropertiesInResponse: true,
            requiredPropertiesInResponse: false
        });
        expect(result.errors.length).toEqual(0)
        expect(result.warnings.length).toEqual(0)
    });

    it('should pass when the pact file is v4 format', async () => {
        const specPath = 'test/e2e/fixtures/pactv4-compatible-swagger.yaml';
        const mockPath = 'test/e2e/fixtures/v4-pact-file.json';

        const specContent = await loadContent(specPath);
        const mockContent = await loadContent(mockPath);

        const result = await SwaggerMockValidator.validate({
            mock: {
                content: mockContent,
                format: 'pact',
                pathOrUrl: mockPath
            },
            spec: {
                content: specContent,
                format: 'openapi3',
                pathOrUrl: specPath
            },
            additionalPropertiesInResponse: true,
            requiredPropertiesInResponse: false
        });

        expect(result.errors.length).toEqual(0)
        expect(result.warnings.length).toEqual(0)
    });

    it('should succeed with validation errors when a pact file and a swagger file are not compatible', async () => {
        const specPath = 'test/e2e/fixtures/swagger-provider.json';
        const mockPath = 'test/e2e/fixtures/pact-broken-consumer.json';

        const specContent = await loadContent(specPath);
        const mockContent = await loadContent(mockPath);

        const result = await SwaggerMockValidator.validate({
            mock: {
                content: mockContent,
                format: 'pact',
                pathOrUrl: mockPath
            },
            spec: {
                content: specContent,
                format: 'swagger2',
                pathOrUrl: specPath
            },
            additionalPropertiesInResponse: true,
            requiredPropertiesInResponse: false
        });

        expect(result.errors.length).toBe(22, 'result.errors.length');
        expect(result.errors[0]).toEqual({
            code: 'request.path-or-method.unknown',
            message: 'Path or method not defined in spec file: GET /one/users/2',
            mockDetails: {
                interactionDescription: 'request path missing test',
                interactionState: '[none]',
                location: '[root].interactions[0].request.path',
                mockFile: 'test/e2e/fixtures/pact-broken-consumer.json',
                value: '/one/users/2'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths',
                pathMethod: null,
                pathName: null,
                specFile: 'test/e2e/fixtures/swagger-provider.json',
                value: jasmine.anything()
            },
            type: 'error'
        });
        expect(result.failureReason).toBe(
            'Mock file "test/e2e/fixtures/pact-broken-consumer.json" is not compatible with spec file ' +
            '"test/e2e/fixtures/swagger-provider.json"',
            'result.failureReason'
        );
        expect(result.success).toBe(false, 'result.success');
        expect(result.warnings.length).toBe(0, 'result.warnings.length');
    }, 30000);

    it('should fail when the swagger file is invalid', async () => {
        const mockPath = 'test/e2e/fixtures/pact-working-consumer.json';

        const specContent = '{not a swagger file';
        const mockContent = await loadContent(mockPath);

        const error = await expectToFail(SwaggerMockValidator.validate({
            mock: {
                content: mockContent,
                format: 'pact',
                pathOrUrl: mockPath
            },
            spec: {
                content: specContent,
                format: 'swagger2',
                pathOrUrl: 'not-a-swagger-file.json'
            },
            additionalPropertiesInResponse: true,
            requiredPropertiesInResponse: false
        }));

        expect(error.message).toEqual(jasmine.stringMatching(
            'Unable to parse "not-a-swagger-file.json"'
        ));
    }, 30000);

    it('should fail when the format is swagger2 but the content is not', async () => {
        const specContent = JSON.stringify({ not: 'swagger2' });
        const mockContent = JSON.stringify({ interactions: [] });

        const error = await expectToFail(SwaggerMockValidator.validate({
            mock: {
                content: mockContent,
                format: 'pact',
                pathOrUrl: 'pact.json'
            },
            spec: {
                content: specContent,
                format: 'swagger2',
                pathOrUrl: 'spec.json'
            },
            additionalPropertiesInResponse: true,
            requiredPropertiesInResponse: false
        }));

        expect(error).toEqual(new SwaggerMockValidatorErrorImpl(
            'SWAGGER_MOCK_VALIDATOR_PARSE_ERROR', '"spec.json" is not a "swagger2" spec'
        ));
    });

    it('should fail when the format is openapi3 but the content is not', async () => {
        const specContent = JSON.stringify({ openapi: '4.0' });
        const mockContent = JSON.stringify({ interactions: [] });

        const error = await expectToFail(SwaggerMockValidator.validate({
            mock: {
                content: mockContent,
                format: 'pact',
                pathOrUrl: 'pact.json'
            },
            spec: {
                content: specContent,
                format: 'openapi3',
                pathOrUrl: 'spec.json'
            },
            additionalPropertiesInResponse: true,
            requiredPropertiesInResponse: false
        }));

        expect(error).toEqual(new SwaggerMockValidatorErrorImpl(
            'SWAGGER_MOCK_VALIDATOR_PARSE_ERROR', '"spec.json" is not a "openapi3" spec'
        ));
    });

    it('should fail when the given format is unknown', async () => {
        const specContent = JSON.stringify({ unknown: 'spec format' });
        const mockContent = JSON.stringify({ interactions: [] });

        const error = await expectToFail(SwaggerMockValidator.validate({
            mock: {
                content: mockContent,
                format: 'pact',
                pathOrUrl: 'pact.json'
            },
            spec: {
                content: specContent,
                format: 'unknown-format' as any,
                pathOrUrl: 'spec.json'
            },
            additionalPropertiesInResponse: true,
            requiredPropertiesInResponse: false
        }));

        expect(error).toEqual(new SwaggerMockValidatorErrorImpl(
            'SWAGGER_MOCK_VALIDATOR_PARSE_ERROR',
            '"spec.json" format "unknown-format" is not supported'
        ));
    });
});
