'use strict';

const swaggerPactValidator = require('../../../lib/swagger-pact-validator');
const q = require('q');

const swaggerPactValidatorLoader = {
    createInstance: () => swaggerPactValidator,
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
            'pact.json': q(JSON.stringify(pactFile)),
            'swagger.json': q(JSON.stringify(swaggerFile))
        });
        const mockHttpClient = swaggerPactValidatorLoader.createMockHttpClient({});

        return swaggerPactValidator.validate({
            fileSystem: mockFileSystem,
            httpClient: mockHttpClient,
            pactPathOrUrl: 'pact.json',
            swaggerPathOrUrl: 'swagger.json'
        });
    }
};

module.exports = swaggerPactValidatorLoader;
