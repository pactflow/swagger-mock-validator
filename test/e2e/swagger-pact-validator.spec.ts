import {exec} from 'child_process';
import * as express from 'express';
import {expectToReject, willResolve} from 'jasmine-promise-tools';
import * as q from 'q';
import VError = require('verror');
import {Server} from 'http';

interface InvokeCommandOptions {
    pact: string;
    swagger: string;
}

const invokeCommand = (options: InvokeCommandOptions): Promise<string> => {
    const deferred = q.defer();

    const command = `./bin/swagger-pact-validator-local ${options.swagger} ${options.pact}`;

    exec(command, (error, stdout) => {
        if (error) {
            deferred.reject(new VError(error, `Failed to execute ${command}. stdout: ${stdout.toString()}`));
        } else {
            deferred.resolve(stdout.toString());
        }
    });

    return deferred.promise as any;
};

const invokeCommandAndExpectToReject = (options: InvokeCommandOptions) => expectToReject(invokeCommand(options));
const serverPort = 8000;
const urlTo = (path: string) => `http://localhost:${serverPort}/${path}`;

describe('swagger-pact-validator', () => {
    let mockServer: Server;

    beforeAll((done) => {
        const expressApp = express();

        expressApp.use(express.static('.'));
        mockServer = expressApp.listen(serverPort, done);
    });

    afterAll((done) => mockServer.close(done));

    it('should succeed when a pact file and a swagger file are compatible', willResolve(() =>
        invokeCommand({
            pact: 'test/e2e/fixtures/working-consumer-pact.json',
            swagger: 'test/e2e/fixtures/provider-spec.json'
        }).then((result) => {
            expect(result).toEqual(jasmine.stringMatching('0 error'));
            expect(result).toEqual(jasmine.stringMatching('1 warning'));
            expect(result).toEqual(
                jasmine.stringMatching('Definition is defined but is not used: #/definitions/unused')
            );
        })
    ));

    it('should fail when a pact file and a swagger file are not compatible', willResolve(() =>
        invokeCommandAndExpectToReject({
            pact: 'test/e2e/fixtures/broken-consumer-pact.json',
            swagger: 'test/e2e/fixtures/provider-spec.json'
        }).then((error) => {
            expect(error).toEqual(jasmine.stringMatching('Pact file "test/e2e/fixtures/broken-consumer-pact.json" ' +
                'is not compatible with swagger file "test/e2e/fixtures/provider-spec.json"'));

            expect(error).toEqual(jasmine.stringMatching('6 error'));
            expect(error).toEqual(jasmine.stringMatching('0 warning'));

            expect(error).toEqual(jasmine.stringMatching(/\[pactRoot].interactions\[0]\.request\.path/));
            expect(error).toEqual(
                jasmine.stringMatching('Path or method not defined in swagger file: GET /one/users/2')
            );

            expect(error).toEqual(jasmine.stringMatching(/\[pactRoot].interactions\[1]\.request\.path/));
            expect(error).toEqual(
                jasmine.stringMatching('Path or method not defined in swagger file: DELETE /one/users/2')
            );

            expect(error).toEqual(jasmine.stringMatching(/\[pactRoot].interactions\[2]\.request\.body/));
            expect(error).toEqual(jasmine.stringMatching(
                'Request body is incompatible with the request body schema in the swagger file'
            ));

            expect(error).toEqual(jasmine.stringMatching(/\[pactRoot].interactions\[3]\.response\.status/));
            expect(error).toEqual(jasmine.stringMatching(
                'Response status code not defined in swagger file: 202'
            ));

            expect(error).toEqual(jasmine.stringMatching(/\[pactRoot].interactions\[4]\.response\.body/));
            expect(error).toEqual(jasmine.stringMatching(
                'Response body is incompatible with the response body schema in the swagger file'
            ));

            expect(error).toEqual(jasmine.stringMatching(/\[pactRoot].interactions\[5]\.request\.headers\.x-version/));
            expect(error).toEqual(jasmine.stringMatching(
                'Value is incompatible with the parameter defined in the swagger file: should be number'
            ));
            expect(error).toEqual(jasmine.stringMatching('name: \'x-version\', in: \'header\''));
        })
    ));

    it('should fail when the swagger file is not valid', willResolve(() =>
        invokeCommandAndExpectToReject({
            pact: 'test/e2e/fixtures/working-consumer-pact.json',
            swagger: 'test/e2e/fixtures/invalid-provider-spec.json'
        }).then((error) => {
            expect(error).toEqual(jasmine.stringMatching('Missing required property: version'));
            expect(error).toEqual(jasmine.stringMatching('Additional properties not allowed: wrongVersion'));
        })
    ));

    it('should succeed when a pact url and a swagger url are compatible', willResolve(() =>
        invokeCommand({
            pact: urlTo('test/e2e/fixtures/working-consumer-pact.json'),
            swagger: urlTo('test/e2e/fixtures/provider-spec.json')
        })
    ));

    it('should fail when the pact url cannot be retrieved', willResolve(() =>
        invokeCommandAndExpectToReject({
            pact: urlTo('test/e2e/fixtures/missing-pact.json'),
            swagger: urlTo('test/e2e/fixtures/provider-spec.json')
        }).then((error) => {
            expect(error).toEqual(jasmine.stringMatching('Expected 200 but received 404'));
        })
    ));
});
