#! /usr/bin/env node

import * as commander from 'commander';
import * as _ from 'lodash';
import * as util from 'util';
import {ValidationOutcome, ValidationResult} from './api-types';
import {SwaggerMockValidatorFactory} from './swagger-mock-validator-factory';

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

const displaySummary = (result: ValidationOutcome, depth: number) => {
    if (result.failureReason) {
        console.log(result.failureReason);
    }
    displaySummaryForValidationResults('error', result.errors);
    displaySummaryForValidationResults('warning', result.warnings);

    if (result.warnings.length > 0 || result.errors.length > 0) {
        console.log(`${util.inspect({warnings: result.warnings, errors: result.errors}, {depth})}\n`);
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
    .option('-t, --tag [string]', 'The tag to filter pacts retrieved from the pact broker')
    .option('-u, --user [USERNAME:PASSWORD]', 'The basic auth username and password to access the pact broker')
    .option('-a, --analyticsUrl [string]', 'The url to send analytics events to as a http post')
    .option('-o, --outputDepth [integer]', 'Specifies the number of times to recurse ' +
        'while formatting the output objects. ' +
        'This is useful in case of large complicated objects or schemas.', parseInt, 4)
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
json file. Optionally, pass a --tag option alongside a --provider option to filter the retrieved
pacts from the broker by Pact Broker version tags.

If the pact broker has basic auth enabled, pass a --user option with username and password joined by a colon
(i.e. THE_USERNAME:THE_PASSWORD) to access the pact broker resources.`
    )
    .action(async (swagger, mock, options) => {
        try {
            const swaggerMockValidator = SwaggerMockValidatorFactory.create(options.user);

            const result = await swaggerMockValidator.validate({
                analyticsUrl: options.analyticsUrl,
                mockPathOrUrl: mock,
                providerName: options.provider,
                specPathOrUrl: swagger,
                tag: options.tag
            });

            displaySummary(result, options.outputDepth);

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
