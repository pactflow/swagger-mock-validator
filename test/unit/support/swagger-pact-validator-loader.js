'use strict';

const proxyquire = require('proxyquire').noCallThru();
const q = require('q');

const swaggerPactValidatorLoader = {
    createInstance: (mockFileSystem) => {
        const readFileAsJson = proxyquire(
            '../../../lib/swagger-pact-validator/read-file-as-json',
            {'./read-file-as-json/file-system': mockFileSystem}
        );

        return proxyquire(
            '../../../lib/swagger-pact-validator', {'./swagger-pact-validator/read-file-as-json': readFileAsJson}
        );
    },
    createMockFileSystem: (mockFiles) => {
        const mockFileSystem = jasmine.createSpyObj('mockFileSystem', ['readFile']);

        mockFileSystem.readFile.and.callFake((actualFile) =>
            mockFiles[actualFile] ||
                q.reject(new Error(`mockFilesystem.readFile: no mock resposne specified for "${actualFile}"`)));

        return mockFileSystem;
    },
    invoke: (swaggerFile, pactFile) => {
        const mockFileSystem = swaggerPactValidatorLoader.createMockFileSystem({
            'swagger.json': q(JSON.stringify(swaggerFile)),
            'pact.json': q(JSON.stringify(pactFile))
        });

        const swaggerPactValidator = swaggerPactValidatorLoader.createInstance(mockFileSystem);

        return swaggerPactValidator.validate('swagger.json', 'pact.json');
    }
};

module.exports = swaggerPactValidatorLoader;
