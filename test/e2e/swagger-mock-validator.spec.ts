import * as bodyParser from 'body-parser';
import {exec} from 'child_process';
import * as express from 'express';
import * as fs from 'fs';
import {Server} from 'http';
import VError = require('verror');
import * as SwaggerMockValidator from '../../lib/api';
import {expectToFail} from '../support/expect-to-fail';

interface InvokeCommandOptions {
    analyticsUrl?: string;
    mock: string;
    providerName?: string;
    swagger: string;
}

const execute = (command: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout) => {
            if (error) {
                reject(new VError(error, `Failed to execute ${command}. stdout: ${stdout.toString()}`));
            } else {
                resolve(stdout.toString());
            }
        });
    });
};

const invokeCommand = (options: InvokeCommandOptions): Promise<string> => {
    let command = `./bin/swagger-mock-validator-local ${options.swagger} ${options.mock}`;

    if (options.providerName) {
        command += ` --provider ${options.providerName}`;
    }

    if (options.analyticsUrl) {
        command += ` --analyticsUrl ${options.analyticsUrl}`;
    }

    return execute(command);
};

const serverPort = 8000;
const urlTo = (path: string) => `http://localhost:${serverPort}/${path}`;

describe('swagger-mock-validator', () => {
    let mockServer: Server;
    let mockAnalytics: jasmine.SpyObj<{ post: (body: string) => void }>;

    beforeAll((done) => {
        mockAnalytics = jasmine.createSpyObj('mockAnalytics', ['post']);

        const expressApp = express();

        expressApp.post('/analytics', bodyParser.json(), (request, response) => {
            mockAnalytics.post(request.body);
            response.status(201).end();
        });
        expressApp.use(express.static('.'));
        mockServer = expressApp.listen(serverPort, done);
    });

    beforeEach(() => {
        mockAnalytics.post.calls.reset();
    });

    afterAll((done) => mockServer.close(done));

    describe('cli', () => {
        it('should succeed when a pact file and a swagger file are compatible', async () => {
            const result = await invokeCommand({
                mock: 'test/e2e/fixtures/pact-working-consumer.json',
                swagger: 'test/e2e/fixtures/swagger-provider.json'
            });

            expect(result).toEqual(jasmine.stringMatching('0 error'));
            expect(result).toEqual(jasmine.stringMatching('1 warning'));
            expect(result).toEqual(
                jasmine.stringMatching('Definition is defined but is not used: #/definitions/unused')
            );
        }, 30000);

        it('should fail when a pact file and a swagger file are not compatible', async () => {
            const error = await expectToFail(invokeCommand({
                mock: 'test/e2e/fixtures/pact-broken-consumer.json',
                swagger: 'test/e2e/fixtures/swagger-provider.json'
            }));

            expect(error).toEqual(jasmine.stringMatching(
                'Mock file "test/e2e/fixtures/pact-broken-consumer.json" ' +
                'is not compatible with swagger file "test/e2e/fixtures/swagger-provider.json"'
            ));

            expect(error).toEqual(jasmine.stringMatching('23 error'));
            expect(error).toEqual(jasmine.stringMatching('1 warning'));

            // swagger warning
            expect(error).toEqual(jasmine.stringMatching(/\[swaggerRoot]\.definitions\.unused/));
            expect(error).toEqual(
                jasmine.stringMatching('Definition is defined but is not used: #/definitions/unused')
            );

            // request path missing
            expect(error).toEqual(jasmine.stringMatching(/\[pactRoot].interactions\[0]\.request\.path/));
            expect(error).toEqual(
                jasmine.stringMatching('Path or method not defined in swagger file: GET /one/users/2')
            );

            // request method missing
            expect(error).toEqual(jasmine.stringMatching(/\[pactRoot].interactions\[1]\.request\.path/));
            expect(error).toEqual(
                jasmine.stringMatching('Path or method not defined in swagger file: DELETE /one/users/2')
            );

            // request body invalid
            expect(error).toEqual(jasmine.stringMatching(/\[pactRoot].interactions\[2]\.request\.body/));
            expect(error).toEqual(jasmine.stringMatching(
                'Request body is incompatible with the request body schema in the swagger file'
            ));

            // request status missing
            expect(error).toEqual(jasmine.stringMatching(/\[pactRoot].interactions\[3]\.response\.status/));
            expect(error).toEqual(jasmine.stringMatching('Response status code not defined in swagger file: 202'));

            // response body invalid
            expect(error).toEqual(jasmine.stringMatching(/\[pactRoot].interactions\[4]\.response\.body/));
            expect(error).toEqual(jasmine.stringMatching(
                'Response body is incompatible with the response body schema in the swagger file'
            ));

            // request header invalid
            expect(error).toEqual(jasmine.stringMatching(/\[pactRoot].interactions\[5]\.request\.headers\.x-version/));
            expect(error).toEqual(jasmine.stringMatching(
                'Value is incompatible with the parameter defined in the swagger file: should be number'
            ));
            expect(error).toEqual(jasmine.stringMatching('name: \'x-version\', in: \'header\''));

            // format invalid
            expect(error).toEqual(jasmine.stringMatching(
                /\[pactRoot].interactions\[6]\.request\.headers\.x-client-id/)
            );
            expect(error).toEqual(jasmine.stringMatching(
                'Value is incompatible with the parameter defined in the swagger file: ' +
                'should pass "formatInt64" keyword validation'
            ));

            // enum invalid
            expect(error).toEqual(jasmine.stringMatching(
                /\[pactRoot].interactions\[7]\.request\.headers\.x-enum-value/)
            );
            expect(error).toEqual(jasmine.stringMatching(
                'Value is incompatible with the parameter defined in the swagger file: ' +
                'should be equal to one of the allowed values'
            ));

            // maximum invalid
            expect(error).toEqual(jasmine.stringMatching(
                /\[pactRoot].interactions\[8]\.request\.headers\.x-maximum-value/)
            );
            expect(error).toEqual(jasmine.stringMatching(
                'Value is incompatible with the parameter defined in the swagger file: should be < 100'
            ));

            // minimum invalid
            expect(error).toEqual(jasmine.stringMatching(
                /\[pactRoot].interactions\[9]\.request\.headers\.x-minimum-value/)
            );
            expect(error).toEqual(jasmine.stringMatching(
                'Value is incompatible with the parameter defined in the swagger file: should be > 0'
            ));

            // maxlength invalid
            expect(error).toEqual(jasmine.stringMatching(
                /\[pactRoot].interactions\[10]\.request\.headers\.x-maxlength-value/)
            );
            expect(error).toEqual(jasmine.stringMatching(
                'Value is incompatible with the parameter defined in the swagger file: ' +
                'should NOT be longer than 3 characters'
            ));

            // minlength invalid
            expect(error).toEqual(jasmine.stringMatching(
                /\[pactRoot].interactions\[11]\.request\.headers\.x-minlength-value/)
            );
            expect(error).toEqual(jasmine.stringMatching(
                'Value is incompatible with the parameter defined in the swagger file: ' +
                'should NOT be shorter than 3 characters'
            ));

            // pattern invalid
            expect(error).toEqual(jasmine.stringMatching(
                /\[pactRoot].interactions\[12]\.request\.headers\.x-pattern-value/)
            );
            expect(error).toEqual(jasmine.stringMatching(
                'Value is incompatible with the parameter defined in the swagger file: ' +
                'should match pattern'
            ));

            // multipleof invalid
            expect(error).toEqual(jasmine.stringMatching(
                /\[pactRoot].interactions\[13]\.request\.headers\.x-multipleof-value/)
            );
            expect(error).toEqual(jasmine.stringMatching(
                'Value is incompatible with the parameter defined in the swagger file: ' +
                'should be multiple of 2'
            ));

            // array invalid
            expect(error).toEqual(jasmine.stringMatching(
                /\[pactRoot].interactions\[14]\.request\.headers\.x-array-value/)
            );
            expect(error).toEqual(jasmine.stringMatching(
                'Value is incompatible with the parameter defined in the swagger file: ' +
                'should be number'
            ));

            // maxitems invalid
            expect(error).toEqual(jasmine.stringMatching(
                /\[pactRoot].interactions\[15]\.request\.headers\.x-maxitems-value/
            ));
            expect(error).toEqual(jasmine.stringMatching(
                'Value is incompatible with the parameter defined in the swagger file: ' +
                'should NOT have more than 2 items'
            ));

            // minitems invalid
            expect(error).toEqual(jasmine.stringMatching(
                /\[pactRoot].interactions\[16]\.request\.headers\.x-minitems-value/
            ));
            expect(error).toEqual(jasmine.stringMatching(
                'Value is incompatible with the parameter defined in the swagger file: ' +
                'should NOT have less than 2 items'
            ));

            // uniqueitems invalid
            expect(error).toEqual(jasmine.stringMatching(
                /\[pactRoot].interactions\[17]\.request\.headers\.x-uniqueitems-value/
            ));
            expect(error).toEqual(jasmine.stringMatching(
                'Value is incompatible with the parameter defined in the swagger file: ' +
                'should NOT have duplicate items'
            ));

            // query invalid
            expect(error).toEqual(jasmine.stringMatching(
                /\[pactRoot].interactions\[18]\.request\.query/
            ));
            expect(error).toEqual(jasmine.stringMatching(
                'Value is incompatible with the parameter defined in the swagger file: should be number'
            ));

            // accept header invalid
            expect(error).toEqual(jasmine.stringMatching(
                /\[pactRoot].interactions\[19]\.request\.headers\.accept/
            ));
            expect(error).toEqual(jasmine.stringMatching(
                'Accept header is incompatible with the produces mime type defined in the swagger file'
            ));

            // request content-type header invalid
            expect(error).toEqual(jasmine.stringMatching(
                /\[pactRoot].interactions\[20]\.request\.headers\.content-type/
            ));
            expect(error).toEqual(jasmine.stringMatching(
                'Request Content-Type header is incompatible with ' +
                'the consumes mime type defined in the swagger file'
            ));

            // response content-type header invalid
            expect(error).toEqual(jasmine.stringMatching(
                /\[pactRoot].interactions\[21]\.response\.headers\.Content-Type/
            ));
            expect(error).toEqual(jasmine.stringMatching(
                'Response Content-Type header is incompatible with the ' +
                'produces mime type defined in the swagger file'
            ));

            // authorization invalid
            expect(error).toEqual(jasmine.stringMatching(
                /\[pactRoot].interactions\[22]/
            ));
            expect(error).toEqual(jasmine.stringMatching(
                'Request Authorization header is missing but is required by the swagger file'
            ));
        }, 30000);

        it('should fail when the swagger file is not valid', async () => {
            const error = await expectToFail(invokeCommand({
                mock: 'test/e2e/fixtures/pact-working-consumer.json',
                swagger: 'test/e2e/fixtures/swagger-invalid-provider.json'
            }));

            expect(error).toEqual(jasmine.stringMatching('Missing required property: version'));
            expect(error).toEqual(jasmine.stringMatching('Additional properties not allowed: wrongVersion'));
        }, 30000);

        it('should succeed when a pact url and a swagger url are compatible', async () => {
            await invokeCommand({
                mock: urlTo('test/e2e/fixtures/pact-working-consumer.json'),
                swagger: urlTo('test/e2e/fixtures/swagger-provider.json')
            });
        }, 30000);

        it('should fail when the pact url cannot be retrieved', async () => {
            const error = await expectToFail(invokeCommand({
                mock: urlTo('test/e2e/fixtures/pact-missing.json'),
                swagger: urlTo('test/e2e/fixtures/swagger-provider.json')
            }));

            expect(error).toEqual(jasmine.stringMatching('Expected 200 but received 404'));
        }, 30000);

        it('should succeed when a pact broker url and a swagger url are compatible', async () => {
            await invokeCommand({
                mock: urlTo('test/e2e/fixtures/pact-broker.json'),
                providerName: 'provider-1',
                swagger: urlTo('test/e2e/fixtures/swagger-provider.json')
            });
        }, 30000);

        it('should log analytic events to the analytics url', async () => {
            await invokeCommand({
                analyticsUrl: urlTo('analytics'),
                mock: 'test/e2e/fixtures/pact-working-consumer.json',
                swagger: 'test/e2e/fixtures/swagger-provider.json'
            });

            expect(mockAnalytics.post).toHaveBeenCalledWith({
                execution: {
                    consumer: 'Billing Service',
                    mockFormat: 'pact',
                    mockPathOrUrl: 'test/e2e/fixtures/pact-working-consumer.json',
                    mockSource: 'path',
                    provider: 'User Service',
                    specFormat: 'swagger',
                    specPathOrUrl: 'test/e2e/fixtures/swagger-provider.json',
                    specSource: 'path'
                },
                id: jasmine.any(String),
                metadata: {
                    hostname: jasmine.any(String),
                    osVersion: jasmine.any(String),
                    toolVersion: jasmine.any(String)
                },
                parentId: jasmine.any(String),
                result: {
                    duration: jasmine.any(Number),
                    errors: {
                        count: 0
                    },
                    success: true,
                    warnings: {
                        'count': 1,
                        'sv.warning': 1
                    }
                },
                source: 'swagger-mock-validator'
            });
        }, 30000);
    });

    describe('api', () => {
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
                }
            });

            expect(result).toEqual({
                errors: [],
                failureReason: undefined,
                success: true,
                warnings: [{
                    code: 'sv.warning',
                    message: 'Definition is defined but is not used: #/definitions/unused',
                    source: 'swagger-validation',
                    specDetails: {
                        location: '[swaggerRoot].definitions.unused',
                        pathMethod: null,
                        pathName: null,
                        specFile: specPath,
                        value: null
                    },
                    type: 'warning'
                }]
            });
        }, 30000);

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
                }
            });

            expect(result.errors.length).toBe(23, 'result.errors.length');
            expect(result.errors[0]).toEqual({
                code: 'spv.request.path-or-method.unknown',
                message: 'Path or method not defined in swagger file: GET /one/users/2',
                mockDetails: {
                    interactionDescription: 'request path missing test',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.path',
                    mockFile: 'test/e2e/fixtures/pact-broken-consumer.json',
                    value: '/one/users/2'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'test/e2e/fixtures/swagger-provider.json',
                    value: jasmine.anything()
                },
                type: 'error'
            });
            expect(result.failureReason).toBe(
                'Mock file "test/e2e/fixtures/pact-broken-consumer.json" is not compatible with swagger file ' +
                '"test/e2e/fixtures/swagger-provider.json"',
                'result.failureReason'
            );
            expect(result.success).toBe(false, 'result.success');
            expect(result.warnings.length).toBe(1, 'result.warnings.length');
        }, 30000);

        it('should fail when the swagger file is invalid', async () => {
            const mockPath = 'test/e2e/fixtures/pact-working-consumer.json';

            const specContent = 'not a swagger file';
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
                }
            }));

            expect(error).toEqual(new Error('swaggerObject must be an object'));
        }, 30000);
    });
});
