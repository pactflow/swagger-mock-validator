'use strict';

const proxyquire = require('proxyquire').noCallThru();
const q = require('q');

const swaggerPactValidatorLoader = {
    createInstance: (mockFileSystem, mockHttpClient) => {
        const jsonLoader = proxyquire('../../../lib/swagger-pact-validator/json-loader', {
            './json-loader/file-system': mockFileSystem,
            './json-loader/http-client': mockHttpClient
        });

        return proxyquire(
            '../../../lib/swagger-pact-validator', {'./swagger-pact-validator/json-loader': jsonLoader}
        );
    },
    createMockFileSystem: (mockFiles) => {
        const mockFileSystem = jasmine.createSpyObj('mockFileSystem', ['readFile']);

        mockFileSystem.readFile.and.callFake((actualFile) =>
            mockFiles[actualFile] ||
                q.reject(new Error(`mockFilesystem.readFile: no mock resposne specified for "${actualFile}"`)));

        return mockFileSystem;
    },
    createMockHttpClient: (mockResponses) => {
        const mockHttpClient = jasmine.createSpyObj('mockHttpClient', ['get']);

        mockHttpClient.get.and.callFake((actualUrl) =>
            mockResponses[actualUrl] ||
                q.reject(new Error(`mockHttpClient.get: no mock response specified for "${actualUrl}"`)));

        return mockHttpClient;
    },
    invoke: (swaggerFile, pactFile) => {
        const mockFileSystem = swaggerPactValidatorLoader.createMockFileSystem({
            'swagger.json': q(JSON.stringify(swaggerFile)),
            'pact.json': q(JSON.stringify(pactFile))
        });
        const mockHttpClient = swaggerPactValidatorLoader.createMockHttpClient({});
        const swaggerPactValidator = swaggerPactValidatorLoader.createInstance(mockFileSystem, mockHttpClient);

        return swaggerPactValidator.validate('swagger.json', 'pact.json');
    }
};

module.exports = swaggerPactValidatorLoader;
