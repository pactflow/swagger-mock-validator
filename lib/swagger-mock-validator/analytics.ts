import {ValidationOutcome, ValidationResult} from '../api-types';
import {HttpClient, Metadata, UuidGenerator} from './types';

interface PostEventOptions {
    analyticsUrl: string;
    consumer: string;
    httpClient: HttpClient;
    mockSource: 'pactBroker' | 'path' | 'url';
    mockPathOrUrl: string;
    metadata: Metadata;
    parentId: string;
    provider: string;
    specSource: 'path' | 'url';
    specPathOrUrl: string;
    uuidGenerator: UuidGenerator;
    validationOutcome: ValidationOutcome;
}

const generateResultSummary = (results: ValidationResult[]) => {
    const summary = results.reduce((partialSummary: {[key: string]: number}, result: ValidationResult) => {
        if (!partialSummary[result.code]) {
            partialSummary[result.code] = 0;
        }

        partialSummary[result.code] += 1;

        return partialSummary;
    }, {});

    (summary as any).count = results.length;

    return summary;
};

export const analytics = {
    postEvent: (options: PostEventOptions) => options.httpClient.post(options.analyticsUrl, {
        execution: {
            consumer: options.consumer,
            mockFormat: 'pact',
            mockPathOrUrl: options.mockPathOrUrl,
            mockSource: options.mockSource,
            provider: options.provider,
            specFormat: 'swagger',
            specPathOrUrl: options.specPathOrUrl,
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
            errors: generateResultSummary(options.validationOutcome.errors),
            success: options.validationOutcome.success,
            warnings: generateResultSummary(options.validationOutcome.warnings)
        },
        source: 'swagger-mock-validator'
    })
};
