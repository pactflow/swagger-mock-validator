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
    // tslint:disable:no-string-literal
    summary['count'] = results.length;
    return summary;
};
exports.default = {
    postEvent: (options) => options.httpClient.post(options.analyticsUrl, {
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
