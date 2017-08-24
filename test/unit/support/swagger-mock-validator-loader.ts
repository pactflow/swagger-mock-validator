import * as _ from 'lodash';
import {ValidationOutcome} from '../../../lib/api-types';
import swaggerMockValidator from '../../../lib/swagger-mock-validator';
import {
    FileSystem,
    HttpClient,
    Metadata,
    Pact,
    Swagger,
    SwaggerMockValidatorInternalOptions,
    UuidGenerator} from '../../../lib/swagger-mock-validator/types';

export interface MockFileSystemResponses {
    [filename: string]: Promise<string>;
}

export interface MockHttpClientResponses {
    [filename: string]: Promise<string>;
}

export interface MockMetadataResponses {
    hostname?: string;
    osVersion?: string;
    toolVersion?: string;
    uptime?: number;
}

export type MockUuidGeneratorResponses = string[];

const swaggerMockValidatorLoader = {
    createMockFileSystem: (mockResponses: MockFileSystemResponses): FileSystem => {
        const mockFileSystem = jasmine.createSpyObj('mockFileSystem', ['readFile']);

        mockFileSystem.readFile.and.callFake((actualFile: string) =>
            mockResponses[actualFile] ||
                Promise.reject(new Error(`mockFilesystem.readFile: no mock response specified for "${actualFile}"`)));

        return mockFileSystem;
    },
    createMockHttpClient: (mockResponses: MockHttpClientResponses): HttpClient => {
        const mockHttpClient = jasmine.createSpyObj('mockHttpClient', ['get', 'post']);

        mockHttpClient.get.and.callFake((actualUrl: string) =>
            mockResponses[actualUrl] ||
                Promise.reject(new Error(`mockHttpClient.get: no mock response specified for "${actualUrl}"`))
        );

        mockHttpClient.post.and.callFake((actualUrl: string) =>
            mockResponses[actualUrl] ||
                Promise.reject(new Error(`mockHttpClient.post: no mock response specified for "${actualUrl}`))
        );

        return mockHttpClient;
    },
    createMockMetadata: (mockResponses: MockMetadataResponses): Metadata => {
        const mockMetadata = jasmine.createSpyObj('mockMetadata', [
            'getHostname',
            'getOsVersion',
            'getToolVersion',
            'getUptime'
        ]);

        mockMetadata.getHostname.and.callFake(() => mockResponses.hostname || 'default-hostname');
        mockMetadata.getOsVersion.and.callFake(() => mockResponses.osVersion || 'default-os-version');
        mockMetadata.getToolVersion.and.callFake(() => mockResponses.toolVersion || 'default-tool-version');
        mockMetadata.getUptime.and.callFake(() => mockResponses.uptime || 0);

        return mockMetadata;
    },
    createMockUuidGenerator: (mockResponses: MockUuidGeneratorResponses): UuidGenerator => {
        const mockUuidGenerator = jasmine.createSpyObj('mockUuidGenerator', ['generate']);
        let callCount = -1;

        mockUuidGenerator.generate.and.callFake(() => {
            callCount += 1;

            return mockResponses[callCount] || _.uniqueId('default-id-');
        });

        return mockUuidGenerator;
    },
    invoke: (swaggerFile: Swagger, pactFile: Pact): Promise<ValidationOutcome> =>
        swaggerMockValidatorLoader.invokeWithMocks({
            fileSystem: swaggerMockValidatorLoader.createMockFileSystem({
                'pact.json': Promise.resolve(JSON.stringify(pactFile)),
                'swagger.json': Promise.resolve(JSON.stringify(swaggerFile))
            }),
            mockPathOrUrl: 'pact.json',
            specPathOrUrl: 'swagger.json'
        }),
    // tslint:disable:cyclomatic-complexity
    invokeWithMocks: (options: SwaggerMockValidatorInternalOptions): Promise<ValidationOutcome> =>
        swaggerMockValidator.validate({
            analyticsUrl: options.analyticsUrl,
            fileSystem: options.fileSystem || swaggerMockValidatorLoader.createMockFileSystem({}),
            httpClient: options.httpClient || swaggerMockValidatorLoader.createMockHttpClient({}),
            metadata: options.metadata || swaggerMockValidatorLoader.createMockMetadata({}),
            mockPathOrUrl: options.mockPathOrUrl,
            providerName: options.providerName,
            specPathOrUrl: options.specPathOrUrl,
            uuidGenerator: options.uuidGenerator || swaggerMockValidatorLoader.createMockUuidGenerator([])
        }) as any
};

export default swaggerMockValidatorLoader;
