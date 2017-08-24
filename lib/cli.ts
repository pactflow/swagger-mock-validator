#! /usr/bin/env node

import * as commander from 'commander';
import * as _ from 'lodash';
import * as util from 'util';
import {ValidationOutcome, ValidationResult} from './api-types';
import swaggerMockValidator from './swagger-mock-validator';

// tslint:disable:no-var-requires
const packageJson = require('../package.json');

const displaySummaryForValidationResults = (name: string, resultsOrNone?: ValidationResult[]) => {
    const results = resultsOrNone || [];

    const summary = results.reduce((partialSummary: {[key: string]: number}, result: ValidationResult) => {
        if (!partialSummary[result.code]) {
            partialSummary[result.code] = 0;
        }

        partialSummary[result.code] += 1;

        return partialSummary;
    }, {});

    console.log(`${results.length} ${name}(s)`);
    _.each(summary, (count, resultCode) => console.log(`\t${resultCode}: ${count}`));
};

const displaySummary = (result: ValidationOutcome) => {
    if (result.failureReason) {
        console.log(result.failureReason);
    }
    displaySummaryForValidationResults('error', result.errors);
    displaySummaryForValidationResults('warning', result.warnings);

    if (result.warnings.length > 0 || result.errors.length > 0) {
        console.log(`${util.inspect({warnings: result.warnings, errors: result.errors}, {depth: 4})}\n`);
    }
};

const logErrorAndExitProcess = (error: Error) => {
    console.log(error.stack);
    process.exitCode = 1;
};

commander
    .version(packageJson.version)
    .arguments('<swagger> <mock>')
    .option('-p, --provider [string]', 'The name of the provider in the pact broker')
    .option('-a, --analyticsUrl [string]', 'The url to send analytics events to as a http post')
    .description(
`Confirms the swagger spec and mock are compatible with each other.

Basic Usage:
The <swagger> and <mock> arguments should paths to the json files or urls to the json files.

Supported Mock Formats:
Pact

Pact Broker:
For providers using the pact broker the <mock> argument should be the url to the root of the
pact broker and the provider name should be passed using the --provider option. This will
automatically find the latest versions of the consumer pact file(s) uploaded to the broker for
the specified provider name. The <swagger> argument should be the path or url to the swagger
json file.`
    )
    .action(async (swagger, mock, options) => {
        try {
            const result = await swaggerMockValidator.validate({
                analyticsUrl: options.analyticsUrl,
                mockPathOrUrl: mock,
                providerName: options.provider,
                specPathOrUrl: swagger
            });

            displaySummary(result);

            if (!result.success) {
                logErrorAndExitProcess(new Error(result.failureReason));
            }
        } catch (error) {
            logErrorAndExitProcess(error);
        }
    })
    .parse(process.argv);

if (!commander.args.length) {
    commander.help();
}
