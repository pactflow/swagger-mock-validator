'use strict';

const exec = require('child_process').exec;
const expectToReject = require('jasmine-promise-tools').expectToReject;
const q = require('q');
const willResolve = require('jasmine-promise-tools').willResolve;
const VError = require('verror');

const invokeCommand = (options) => {
    const deferred = q.defer();

    const command = `swagger-pact-validator ${options.swagger} ${options.pact}`;

    exec(command, (error, stdout) => {
        if (error) {
            deferred.reject(new VError(error, `Failed to execute ${command}. stdout: ${stdout.toString()}`));
        } else {
            deferred.resolve(stdout.toString());
        }
    });

    return deferred.promise;
};

const invokeCommandAndExpectToReject = (options) => expectToReject(invokeCommand(options));

describe('swagger-pact-validator', () => {
    it('should succeed when a pact and a swagger spec are compatible', willResolve(() =>
        invokeCommand({
            pact: 'test/e2e/fixtures/working-consumer-pact.json',
            swagger: 'test/e2e/fixtures/provider-spec.json'
        })
    ));

    it('should fail when a pact file expects something that is not in the swagger spec', willResolve(() =>
        invokeCommandAndExpectToReject({
            pact: 'test/e2e/fixtures/broken-consumer-pact.json',
            swagger: 'test/e2e/fixtures/provider-spec.json'
        }).then((error) => {
            expect(error).toEqual(jasmine.stringMatching('Pact file "test/e2e/fixtures/broken-consumer-pact.json" ' +
                'is not compatible with swagger file "test/e2e/fixtures/provider-spec.json"'));
            expect(error).toEqual(jasmine.stringMatching(/\[pactRoot\].interactions\[0\]\.request\.path/));
            expect(error).toEqual(jasmine.stringMatching('Path not defined in swagger file: /one/users/2'));
        })
    ));

    it('should fail when the swagger spec is not valid', willResolve(() =>
        invokeCommandAndExpectToReject({
            pact: 'test/e2e/fixtures/working-consumer-pact.json',
            swagger: 'test/e2e/fixtures/invalid-provider-spec.json'
        }).then((error) => {
            expect(error).toEqual(jasmine.stringMatching('Missing required property: version'));
            expect(error).toEqual(jasmine.stringMatching('Additional properties not allowed: wrongVersion'));
        })
    ));
});
