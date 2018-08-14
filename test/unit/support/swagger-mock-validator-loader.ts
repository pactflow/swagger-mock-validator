import * as _ from 'lodash';
import {ValidationOutcome} from '../../../lib/api-types';
import {SwaggerMockValidator} from '../../../lib/swagger-mock-validator';
import {Analytics} from '../../../lib/swagger-mock-validator/analytics';
import {Metadata} from '../../../lib/swagger-mock-validator/analytics/metadata';
import {FileSystem} from '../../../lib/swagger-mock-validator/clients/file-system';
import {HttpClient} from '../../../lib/swagger-mock-validator/clients/http-client';
import {FileStore} from '../../../lib/swagger-mock-validator/file-store';
import {Pact} from '../../../lib/swagger-mock-validator/mock-parser/pact/pact';
import {ResourceLoader} from '../../../lib/swagger-mock-validator/resource-loader';
import {Openapi3Schema} from '../../../lib/swagger-mock-validator/spec-parser/openapi3/openapi3';
import {Swagger2} from '../../../lib/swagger-mock-validator/spec-parser/swagger2/swagger2';
import {UuidGenerator} from '../../../lib/swagger-mock-validator/uuid-generator';

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

export interface SwaggerMockValidatorLoaderInvokeWithMocksOptions {
    analyticsUrl?: string;
    fileSystem?: FileSystem;
    httpClient?: HttpClient;
    metadata?: Metadata;
    mockPathOrUrl: string;
    providerName?: string;
    specPathOrUrl: string;
    uuidGenerator?: UuidGenerator;
}

export const swaggerMockValidatorLoader = {
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
    invoke: (swaggerFile: Swagger2 | Openapi3Schema, pactFile: Pact): Promise<ValidationOutcome> =>
        swaggerMockValidatorLoader.invokeWithMocks({
            fileSystem: swaggerMockValidatorLoader.createMockFileSystem({
                'pact.json': Promise.resolve(JSON.stringify(pactFile)),
                'spec.json': Promise.resolve(JSON.stringify(swaggerFile))
            }),
            mockPathOrUrl: 'pact.json',
            specPathOrUrl: 'spec.json'
        }),
    // tslint:disable:cyclomatic-complexity
    invokeWithMocks: (options: SwaggerMockValidatorLoaderInvokeWithMocksOptions): Promise<ValidationOutcome> => {
        const mockFileSystem = options.fileSystem || swaggerMockValidatorLoader.createMockFileSystem({});
        const mockHttpClient = options.httpClient || swaggerMockValidatorLoader.createMockHttpClient({});
        const mockUuidGenerator = options.uuidGenerator || swaggerMockValidatorLoader.createMockUuidGenerator([]);
        const mockMetadata = options.metadata || swaggerMockValidatorLoader.createMockMetadata({});

        const fileStore = new FileStore(mockFileSystem, mockHttpClient);
        const resourceLoader = new ResourceLoader(fileStore);
        const analytics = new Analytics(mockHttpClient, mockUuidGenerator, mockMetadata);
        const swaggerMockValidator = new SwaggerMockValidator(fileStore, resourceLoader, analytics);

        return swaggerMockValidator.validate({
            analyticsUrl: options.analyticsUrl,
            mockPathOrUrl: options.mockPathOrUrl,
            providerName: options.providerName,
            specPathOrUrl: options.specPathOrUrl
        });
    }
};
