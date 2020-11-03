"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analytics = void 0;
const generateResultSummary = (results) => {
    const summary = results.reduce((partialSummary, result) => {
        if (!partialSummary[result.code]) {
            partialSummary[result.code] = 0;
        }
        partialSummary[result.code] += 1;
        return partialSummary;
    }, {});
    summary.count = results.length;
    return summary;
};
class Analytics {
    constructor(httpClient, uuidGenerator, metadata) {
        this.httpClient = httpClient;
        this.uuidGenerator = uuidGenerator;
        this.metadata = metadata;
        this.parentId = this.uuidGenerator.generate();
    }
    postEvent(options) {
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
exports.Analytics = Analytics;
