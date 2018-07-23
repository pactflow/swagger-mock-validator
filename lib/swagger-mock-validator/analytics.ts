import {ValidationOutcome, ValidationResult} from '../api-types';
import {Metadata} from './analytics/metadata';
import {HttpClient} from './clients/http-client';
import {UuidGenerator} from './uuid-generator';

interface PostEventOptions {
    analyticsUrl: string;
    consumer: string;
    mockSource: 'pactBroker' | 'path' | 'url';
    mockPathOrUrl: string;
    provider: string;
    specSource: 'path' | 'url';
    specPathOrUrl: string;
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

export class Analytics {
    private readonly parentId: string;

    public constructor(
        private readonly httpClient: HttpClient,
        private readonly uuidGenerator: UuidGenerator,
        private readonly metadata: Metadata) {
        this.parentId = this.uuidGenerator.generate();
    }

    public postEvent(options: PostEventOptions): Promise<void> {
        return this.httpClient.post(options.analyticsUrl, {
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
            id: this.uuidGenerator.generate(),
            metadata: {
                hostname: this.metadata.getHostname(),
                osVersion: this.metadata.getOsVersion(),
                toolVersion: this.metadata.getToolVersion()
            },
            parentId: this.parentId,
            result: {
                duration: this.metadata.getUptime(),
                errors: generateResultSummary(options.validationOutcome.errors),
                success: options.validationOutcome.success,
                warnings: generateResultSummary(options.validationOutcome.warnings)
            },
            source: 'swagger-mock-validator'
        });
    }
}
