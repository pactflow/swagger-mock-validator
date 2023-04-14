import * as bodyParser from 'body-parser';
import {exec} from 'child_process';
import * as express from 'express';
import {Server} from 'http';
import VError = require('verror');
import {expectToFail} from '../support/expect-to-fail';

interface InvokeCommandOptions {
    analyticsUrl?: string;
    auth?: string;
    mock: string;
    providerName?: string;
    swagger: string;
    tag?: string;
    outputDepth?: string;
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

// tslint:disable-next-line:cyclomatic-complexity
const invokeCommand = (options: InvokeCommandOptions): Promise<string> => {
    let command = `./bin/swagger-mock-validator-local ${options.swagger} ${options.mock}`;

    if (options.providerName) {
        command += ` --provider ${options.providerName}`;
    }

    if (options.tag) {
        command += ` --tag ${options.tag}`;
    }

    if (options.analyticsUrl) {
        command += ` --analyticsUrl ${options.analyticsUrl}`;
    }

    if (options.auth) {
        command += ` --user ${options.auth}`;
    }

    if (options.outputDepth) {
        command += ` --outputDepth ${options.outputDepth}`;
    }

    return execute(command);
};

const serverPort = 8000;
const urlTo = (path: string) => `http://localhost:${serverPort}/${path}`;

describe('swagger-mock-validator/cli', () => {
    let mockServer: Server;
    let mockPactBroker: jasmine.SpyObj<{ get: (requestHeaders: object, requestUrl: string) => void }>;
    let mockAnalytics: jasmine.SpyObj<{ post: (body: object) => void }>;

    beforeAll((done) => {
        mockPactBroker = jasmine.createSpyObj('mockPactBroker', ['get']);
        mockAnalytics = jasmine.createSpyObj('mockAnalytics', ['post']);

        const expressApp = express();

        expressApp.get('/*', (request, _, next) => {
            mockPactBroker.get(request.headers, request.url);
            next();
        });
        expressApp.post('/analytics', bodyParser.json(), (request, response) => {
            mockAnalytics.post(request.body);
            response.status(201).end();
        });
        expressApp.use(express.static('.'));

        mockServer = expressApp.listen(serverPort, done);
    });

    beforeEach(() => {
        mockAnalytics.post.calls.reset();
        mockPactBroker.get.calls.reset();
    });

    afterAll((done) => mockServer.close(done));

    it('should succeed when a pact file and a swagger file are compatible', async () => {
        const result = await invokeCommand({
            mock: 'test/e2e/fixtures/pact-working-consumer.json',
            swagger: 'test/e2e/fixtures/swagger-provider.json'
        });

        expect(result).toEqual(jasmine.stringMatching('0 error'));
        expect(result).toEqual(jasmine.stringMatching('1 warning'));
        expect(result).toEqual(
            jasmine.stringMatching('Request header is not defined in the spec file: x-unknown-header')
        );
    }, 30000);

    it('should fail when a pact file and a swagger file are not compatible', async () => {
        const error = await expectToFail(invokeCommand({
            mock: 'test/e2e/fixtures/pact-broken-consumer.json',
            swagger: 'test/e2e/fixtures/swagger-provider.json'
        }));

        expect(error).toEqual(jasmine.stringMatching(
            'Mock file "test/e2e/fixtures/pact-broken-consumer.json" ' +
            'is not compatible with spec file "test/e2e/fixtures/swagger-provider.json"'
        ));

        expect(error).toEqual(jasmine.stringMatching('23 error'));
        expect(error).toEqual(jasmine.stringMatching('0 warning'));
        // request path missing
        expect(error).toEqual(jasmine.stringMatching(/\[root].interactions\[0]\.request\.path/));
        expect(error).toEqual(
            jasmine.stringMatching('Path or method not defined in spec file: GET /one/users/2')
        );

        // request method missing
        expect(error).toEqual(jasmine.stringMatching(/\[root].interactions\[1]\.request\.path/));
        expect(error).toEqual(
            jasmine.stringMatching('Path or method not defined in spec file: DELETE /one/users/2')
        );

        // request body invalid
        expect(error).toEqual(jasmine.stringMatching(/\[root].interactions\[2]\.request\.body/));
        expect(error).toEqual(jasmine.stringMatching(
            'Request body is incompatible with the request body schema in the spec file'
        ));

        // request status missing
        expect(error).toEqual(jasmine.stringMatching(/\[root].interactions\[3]\.response\.status/));
        expect(error).toEqual(jasmine.stringMatching('Response status code not defined in spec file: 202'));

        // response body invalid
        expect(error).toEqual(jasmine.stringMatching(/\[root].interactions\[4]\.response\.body/));
        expect(error).toEqual(jasmine.stringMatching(
            'Response body is incompatible with the response body schema in the spec file'
        ));

        // request header invalid
        expect(error).toEqual(jasmine.stringMatching(/\[root].interactions\[5]\.request\.headers\.x-version/));
        expect(error).toEqual(jasmine.stringMatching(
            'Value is incompatible with the parameter defined in the spec file: should be number'
        ));
        expect(error).toEqual(jasmine.stringMatching('name: \'x-version\', in: \'header\''));

        // format invalid
        expect(error).toEqual(jasmine.stringMatching(
            /\[root].interactions\[6]\.request\.headers\.x-client-id/)
        );
        expect(error).toEqual(jasmine.stringMatching(
            'Value is incompatible with the parameter defined in the spec file: ' +
            'should pass "formatInt64" keyword validation'
        ));

        // enum invalid
        expect(error).toEqual(jasmine.stringMatching(
            /\[root].interactions\[7]\.request\.headers\.x-enum-value/)
        );
        expect(error).toEqual(jasmine.stringMatching(
            'Value is incompatible with the parameter defined in the spec file: ' +
            'should be equal to one of the allowed values'
        ));

        // maximum invalid
        expect(error).toEqual(jasmine.stringMatching(
            /\[root].interactions\[8]\.request\.headers\.x-maximum-value/)
        );
        expect(error).toEqual(jasmine.stringMatching(
            'Value is incompatible with the parameter defined in the spec file: should be < 100'
        ));

        // minimum invalid
        expect(error).toEqual(jasmine.stringMatching(
            /\[root].interactions\[9]\.request\.headers\.x-minimum-value/)
        );
        expect(error).toEqual(jasmine.stringMatching(
            'Value is incompatible with the parameter defined in the spec file: should be > 0'
        ));

        // maxlength invalid
        expect(error).toEqual(jasmine.stringMatching(
            /\[root].interactions\[10]\.request\.headers\.x-maxlength-value/)
        );
        expect(error).toEqual(jasmine.stringMatching(
            'Value is incompatible with the parameter defined in the spec file: should NOT be longer than 3 characters'
        ));

        // minlength invalid
        expect(error).toEqual(jasmine.stringMatching(
            /\[root].interactions\[11]\.request\.headers\.x-minlength-value/)
        );
        expect(error).toEqual(jasmine.stringMatching(
            'Value is incompatible with the parameter defined in the spec file: should NOT be shorter than 3 characters'
        ));

        // pattern invalid
        expect(error).toEqual(jasmine.stringMatching(
            /\[root].interactions\[12]\.request\.headers\.x-pattern-value/)
        );
        expect(error).toEqual(jasmine.stringMatching(
            'Value is incompatible with the parameter defined in the spec file: should match pattern'
        ));

        // multipleof invalid
        expect(error).toEqual(jasmine.stringMatching(
            /\[root].interactions\[13]\.request\.headers\.x-multipleof-value/)
        );
        expect(error).toEqual(jasmine.stringMatching(
            'Value is incompatible with the parameter defined in the spec file: should be multiple of 2'
        ));

        // array invalid
        expect(error).toEqual(jasmine.stringMatching(
            /\[root].interactions\[14]\.request\.headers\.x-array-value/)
        );
        expect(error).toEqual(jasmine.stringMatching(
            'Value is incompatible with the parameter defined in the spec file: should be number'
        ));

        // maxitems invalid
        expect(error).toEqual(jasmine.stringMatching(
            /\[root].interactions\[15]\.request\.headers\.x-maxitems-value/
        ));
        expect(error).toEqual(jasmine.stringMatching(
            'Value is incompatible with the parameter defined in the spec file: should NOT have more than 2 items'
        ));

        // minitems invalid
        expect(error).toEqual(jasmine.stringMatching(
            /\[root].interactions\[16]\.request\.headers\.x-minitems-value/
        ));
        expect(error).toEqual(jasmine.stringMatching(
            'Value is incompatible with the parameter defined in the spec file: should NOT have fewer than 2 items'
        ));

        // uniqueitems invalid
        expect(error).toEqual(jasmine.stringMatching(
            /\[root].interactions\[17]\.request\.headers\.x-uniqueitems-value/
        ));
        expect(error).toEqual(jasmine.stringMatching(
            'Value is incompatible with the parameter defined in the spec file: should NOT have duplicate items'
        ));

        // query invalid
        expect(error).toEqual(jasmine.stringMatching(
            /\[root].interactions\[18]\.request\.query/
        ));
        expect(error).toEqual(jasmine.stringMatching(
            'Value is incompatible with the parameter defined in the spec file: should be number'
        ));

        // accept header invalid
        expect(error).toEqual(jasmine.stringMatching(
            /\[root].interactions\[19]\.request\.headers\.accept/
        ));
        expect(error).toEqual(jasmine.stringMatching(
            'Request Accept header is incompatible with the mime-types the spec defines to produce'
        ));

        // request content-type header invalid
        expect(error).toEqual(jasmine.stringMatching(
            /\[root].interactions\[20]\.request\.headers\.content-type/
        ));
        expect(error).toEqual(jasmine.stringMatching(
            'Request Content-Type header is incompatible with the mime-types the spec accepts to consume'
        ));

        // response content-type header invalid
        expect(error).toEqual(jasmine.stringMatching(
            /\[root].interactions\[21]\.response\.headers\.Content-Type/
        ));
        expect(error).toEqual(jasmine.stringMatching(
            'Request Content-Type header is incompatible with the mime-types the spec accepts to consume'
        ));

        // authorization invalid
        expect(error).toEqual(jasmine.stringMatching(
            /\[root].interactions\[22]/
        ));
        expect(error).toEqual(jasmine.stringMatching(
            'Request Authorization header is missing but is required by the spec file'
        ));
    }, 30000);

    it('should fail when the swagger file is not valid', async () => {
        const error = await expectToFail(invokeCommand({
            mock: 'test/e2e/fixtures/pact-working-consumer.json',
            swagger: 'test/e2e/fixtures/swagger-invalid-provider.json'
        }));

        expect(error).toEqual(jasmine.stringMatching('#/info must have required property \'version\''));
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

        expect(error).toEqual(jasmine.stringMatching('Request failed with status code 404'));
    }, 30000);

    it('should succeed when a pact broker url and a swagger url are compatible', async () => {
        await invokeCommand({
            mock: urlTo('test/e2e/fixtures/pact-broker.json'),
            providerName: 'provider-1',
            swagger: urlTo('test/e2e/fixtures/swagger-provider.json')
        });
    }, 30000);

    it('should succeed when a pact broker url with tag and a swagger url are compatible', async () => {
        await invokeCommand({
            mock: urlTo('test/e2e/fixtures/pact-broker.json'),
            providerName: 'provider-1',
            swagger: urlTo('test/e2e/fixtures/swagger-provider.json'),
            tag: 'production'
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
                    'request.header.unknown': 1
                }
            },
            source: 'swagger-mock-validator'
        });
    }, 30000);

    it('should succeed when a pact file and an openapi3 file are compatible', async () => {
        const result = await invokeCommand({
            mock: 'test/e2e/fixtures/pact-working-consumer.json',
            swagger: 'test/e2e/fixtures/openapi3-provider.yaml'
        });
        expect(result).toEqual(jasmine.stringMatching('0 error'));
        expect(result).toEqual(jasmine.stringMatching('2 warning'));
        expect(result).toEqual(
            jasmine.stringMatching('Request header is not defined in the spec file: x-unknown-header')
        );
    }, 30000);

    it('should make an authenticated request to the provided pact broker url when asked to do so', async () => {
        const auth = 'user:pass';

        await invokeCommand({
            auth,
            mock: urlTo('test/e2e/fixtures/pact-broker.json'),
            providerName: 'provider-1',
            swagger: urlTo('test/e2e/fixtures/swagger-provider.json')
        });

        expect(mockPactBroker.get).toHaveBeenCalledWith(
            jasmine.objectContaining({authorization: 'Basic dXNlcjpwYXNz'}),
            jasmine.stringMatching('test/e2e/fixtures/pact-broker.json')
        );
    }, 30000);

    it('should format output objects to depth 0', async () => {
        const result = await invokeCommand({
            mock: 'test/e2e/fixtures/pact-working-consumer.json',
            outputDepth: '0',
            swagger: 'test/e2e/fixtures/openapi3-provider.yaml'
        });
        expect(result).toEqual(jasmine.stringMatching('warnings: \\[Object|Array\\]'));
    });
});
