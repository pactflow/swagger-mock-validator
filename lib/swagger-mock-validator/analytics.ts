import {HttpClient, Metadata, ParsedMock, ParsedSpec, UuidGenerator, ValidationResult} from './types';

interface PostEventOptions {
    analyticsUrl: string;
    errors: ValidationResult[];
    httpClient: HttpClient;
    mockSource: 'pactBroker' | 'path' | 'url';
    metadata: Metadata;
    parentId: string;
    parsedMock: ParsedMock;
    parsedSpec: ParsedSpec;
    specSource: 'path' | 'url';
    success: boolean;
    uuidGenerator: UuidGenerator;
    warnings: ValidationResult[];
}

const generateResultSummary = (results: ValidationResult[]) => {
    const summary = results.reduce((partialSummary: {[key: string]: number}, result: ValidationResult) => {
        if (!partialSummary[result.code]) {
            partialSummary[result.code] = 0;
        }

        partialSummary[result.code] += 1;

        return partialSummary;
    }, {});

    // tslint:disable:no-string-literal
    summary['count'] = results.length;

    return summary;
};

export default {
    postEvent: (options: PostEventOptions) => options.httpClient.post(options.analyticsUrl, {
        execution: {
            consumer: options.parsedMock.consumer,
            mockFormat: 'pact',
            mockPathOrUrl: options.parsedMock.pathOrUrl,
            mockSource: options.mockSource,
            provider: options.parsedMock.provider,
            specFormat: 'swagger',
            specPathOrUrl: options.parsedSpec.pathOrUrl,
            specSource: options.specSource
        },
        id: options.uuidGenerator.generate(),
        metadata: {
            hostname: options.metadata.getHostname(),
            osVersion: options.metadata.getOsVersion(),
            toolVersion: options.metadata.getToolVersion()
        },
        parentId: options.parentId,
        result: {
            duration: options.metadata.getUptime(),
            errors: generateResultSummary(options.errors),
            success: options.success,
            warnings: generateResultSummary(options.warnings)
        },
        source: 'swagger-mock-validator'
    })
};
