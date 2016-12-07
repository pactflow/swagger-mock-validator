import * as q from 'q';
import swaggerPactValidator from '../../../lib/swagger-pact-validator';
import {Pact, Swagger, ValidationSuccess} from '../../../lib/swagger-pact-validator/types';

const swaggerPactValidatorLoader = {
    createInstance: () => swaggerPactValidator,
    createMockFileSystem: (mockFiles: {[fileName: string]: q.Promise<string>}) => {
        const mockFileSystem = jasmine.createSpyObj('mockFileSystem', ['readFile']);

        mockFileSystem.readFile.and.callFake((actualFile: string) =>
            mockFiles[actualFile] ||
                q.reject(new Error(`mockFilesystem.readFile: no mock response specified for "${actualFile}"`)));

        return mockFileSystem;
    },
    createMockHttpClient: (mockResponses: {[fileName: string]: q.Promise<string>}) => {
        const mockHttpClient = jasmine.createSpyObj('mockHttpClient', ['get']);

        mockHttpClient.get.and.callFake((actualUrl: string) =>
            mockResponses[actualUrl] ||
                q.reject(new Error(`mockHttpClient.get: no mock response specified for "${actualUrl}"`)));

        return mockHttpClient;
    },
    invoke: (swaggerFile: Swagger, pactFile: Pact): Promise<ValidationSuccess> => {
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
        }) as any;
    }
};

export default swaggerPactValidatorLoader;
