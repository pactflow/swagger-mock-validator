import * as _ from 'lodash';
import * as q from 'q';
import swaggerPactValidator from '../../../lib/swagger-pact-validator';
import {
    FileSystem,
    HttpClient,
    Metadata,
    Pact,
    Swagger,
    SwaggerPactValidatorOptions,
    UuidGenerator,
    ValidationSuccess
} from '../../../lib/swagger-pact-validator/types';

export interface MockFileSystemResponses {
    [filename: string]: q.Promise<string>;
}

export interface MockHttpClientResponses {
    [filename: string]: q.Promise<string>;
}

export interface MockMetadataResponses {
    hostname?: string;
    osVersion?: string;
    toolVersion?: string;
    uptime?: number;
}

export type MockUuidGeneratorResponses = string[];

const swaggerPactValidatorLoader = {
    createMockFileSystem: (mockResponses: MockFileSystemResponses): FileSystem => {
        const mockFileSystem = jasmine.createSpyObj('mockFileSystem', ['readFile']);

        mockFileSystem.readFile.and.callFake((actualFile: string) =>
            mockResponses[actualFile] ||
                q.reject(new Error(`mockFilesystem.readFile: no mock response specified for "${actualFile}"`)));

        return mockFileSystem;
    },
    createMockHttpClient: (mockResponses: MockHttpClientResponses): HttpClient => {
        const mockHttpClient = jasmine.createSpyObj('mockHttpClient', ['get', 'post']);

        mockHttpClient.get.and.callFake((actualUrl: string) =>
            mockResponses[actualUrl] ||
                q.reject(new Error(`mockHttpClient.get: no mock response specified for "${actualUrl}"`))
        );

        mockHttpClient.post.and.callFake((actualUrl: string) =>
            mockResponses[actualUrl] ||
                q.reject(new Error(`mockHttpClient.post: no mock response specified for "${actualUrl}`))
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
    invoke: (swaggerFile: Swagger, pactFile: Pact): Promise<ValidationSuccess> =>
        swaggerPactValidatorLoader.invokeWithMocks({
            fileSystem: swaggerPactValidatorLoader.createMockFileSystem({
                'pact.json': q(JSON.stringify(pactFile)),
                'swagger.json': q(JSON.stringify(swaggerFile))
            }),
            pactPathOrUrl: 'pact.json',
            swaggerPathOrUrl: 'swagger.json'
        }),
    // tslint:disable:cyclomatic-complexity
    invokeWithMocks: (options: SwaggerPactValidatorOptions): Promise<ValidationSuccess> =>
        swaggerPactValidator.validate({
            analyticsUrl: options.analyticsUrl,
            fileSystem: options.fileSystem || swaggerPactValidatorLoader.createMockFileSystem({}),
            httpClient: options.httpClient || swaggerPactValidatorLoader.createMockHttpClient({}),
            metadata: options.metadata || swaggerPactValidatorLoader.createMockMetadata({}),
            pactPathOrUrl: options.pactPathOrUrl,
            providerName: options.providerName,
            swaggerPathOrUrl: options.swaggerPathOrUrl,
            uuidGenerator: options.uuidGenerator || swaggerPactValidatorLoader.createMockUuidGenerator([])
        }) as any
};

export default swaggerPactValidatorLoader;
