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
    .option('-u, --user [USERNAME:PASSWORD]', 'The basic auth username and password to access the pact broker (env - PACT_BROKER_USERNAME:PACT_BROKER_PASSWORD)')
    .option('-b, --token [string]', 'The bearer token to access the pact broker (env - PACT_BROKER_TOKEN)')
    .option('-a, --analyticsUrl [string]', 'The url to send analytics events to as a http post')
    .option('-o, --outputDepth [integer]', 'Specifies the number of times to recurse ' +
    'while formatting the output objects. ' +
    'This is useful in case of large complicated objects or schemas.', parseInt, 4)
    .option('-A, --additionalPropertiesInResponse [boolean]', 'allow additional properties in response bodies, default false')
    .option('-R, --requiredPropertiesInResponse [boolean]', 'allows required properties in response bodies, default false')
    .option('--publish', 'Allows publication of verification result to pact broker, default false')
    .option('--providerApplicationVersion [string]', 'Version of provider, used when publishing result to broker')
    .option('--buildUrl [string]', 'Url to build/pipeline, used when publishing result to broker')
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
pacts from the broker by Pact Broker version tags. Pass the --publish flag together with
--providerApplicationVersion to publish the result to the pact broker.

If the pact broker has basic auth enabled, pass a --user option with username and password joined by a colon
(i.e. THE_USERNAME:THE_PASSWORD) to access the pact broker resources.

If the pact broker has bearer token auth enabled, pass a --token option along with the token to access the pact broker resources.

You can also set the following environment variables

- Basic Auth
  - PACT_BROKER_USERNAME
  - PACT_BROKER_PASSWORD
- Bearer Auth
  - PACT_BROKER_TOKEN

Note: command line options will take precedence over environment variables.
`
    )
    .action(async (swagger, mock, options) => {
        try {
            if (
                options.user == undefined &&
                process.env.PACT_BROKER_USERNAME != undefined &&
                process.env.PACT_BROKER_PASSWORD != undefined
            ) {
                options.user = process.env.PACT_BROKER_USERNAME + ':' + process.env.PACT_BROKER_PASSWORD;
            } else if (options.token == undefined && process.env.PACT_BROKER_TOKEN != undefined) {
                options.token = process.env.PACT_BROKER_TOKEN;
            }
            const swaggerMockValidator = SwaggerMockValidatorFactory.create(options.user ?? options.token);

            const result = await swaggerMockValidator.validate({
                analyticsUrl: options.analyticsUrl,
                mockPathOrUrl: mock,
                providerName: options.provider,
                specPathOrUrl: swagger,
                tag: options.tag,
                additionalPropertiesInResponse: options.additionalPropertiesInResponse,
                requiredPropertiesInResponse: options.requiredPropertiesInResponse,
                providerApplicationVersion: options.providerApplicationVersion,
                buildUrl: options.buildUrl,
                publish: options.publish
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
