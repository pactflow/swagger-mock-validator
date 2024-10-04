#! /usr/bin/env node

import { program } from 'commander';
import _ from 'lodash';
import util from 'util';
import {ValidationOutcome, ValidationResult} from './api-types';
import {SwaggerMockValidatorFactory} from './swagger-mock-validator-factory';

import packageJson from "../package.json";

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

program
    .version(packageJson.version)
    .arguments('<swagger> <mock>')
    .option('-p, --provider [string]', 'The name of the provider in the pact broker')
    .option('-t, --tag [string]', 'The tag to filter pacts retrieved from the pact broker')
    .option('-a, --analyticsUrl [string]', 'The url to send analytics events to as a http post')
    .option('-o, --outputDepth [integer]', 'Specifies the number of times to recurse ' +
    'while formatting the output objects. ' +
    'This is useful in case of large complicated objects or schemas.', parseInt, 4)
    .option('-A, --additionalPropertiesInResponse [boolean]', 'allow additional properties in response bodies, default false')
    .option('-R, --requiredPropertiesInResponse [boolean]', 'allows required properties in response bodies, default false')
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

If the pact broker has auth enabled, you can access pact broker resources, by setting the following env vars

Basic Auth

PACT_BROKER_USERNAME
PACT_BROKER_PASSWORD

Bearer Token Auth

PACT_BROKER_TOKEN`
    )
    .action(async (swagger, mock, options) => {
        try {
            const swaggerMockValidator = SwaggerMockValidatorFactory.create();

            const result = await swaggerMockValidator.validate({
                analyticsUrl: options.analyticsUrl,
                mockPathOrUrl: mock,
                providerName: options.provider,
                specPathOrUrl: swagger,
                tag: options.tag,
                additionalPropertiesInResponse: options.additionalPropertiesInResponse,
                requiredPropertiesInResponse: options.requiredPropertiesInResponse
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

if (!program.args.length) {
    program.help();
}
