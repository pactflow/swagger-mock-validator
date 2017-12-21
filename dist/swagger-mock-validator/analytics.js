"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.default = {
    postEvent: (options) => options.httpClient.post(options.analyticsUrl, {
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
