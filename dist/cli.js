#! /usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander = require("commander");
const _ = require("lodash");
const util = require("util");
const swagger_mock_validator_1 = require("./swagger-mock-validator");
// tslint:disable:no-var-requires
const packageJson = require('../package.json');
const displaySummaryForValidationResults = (name, resultsOrNone) => {
    const results = resultsOrNone || [];
    const summary = results.reduce((partialSummary, result) => {
        if (!partialSummary[result.code]) {
            partialSummary[result.code] = 0;
        }
        partialSummary[result.code] += 1;
        return partialSummary;
    }, {});
    console.log(`${results.length} ${name}(s)`);
    _.each(summary, (count, resultCode) => console.log(`\t${resultCode}: ${count}`));
};
const displaySummary = (result) => {
    if (result.failureReason) {
        console.log(result.failureReason);
    }
    displaySummaryForValidationResults('error', result.errors);
    displaySummaryForValidationResults('warning', result.warnings);
    if (result.warnings.length > 0 || result.errors.length > 0) {
        console.log(`${util.inspect({ warnings: result.warnings, errors: result.errors }, { depth: 4 })}\n`);
    }
};
const logErrorAndExitProcess = (error) => {
    console.log(error.stack);
    process.exitCode = 1;
};
commander
    .version(packageJson.version)
    .arguments('<swagger> <mock>')
    .option('-p, --provider [string]', 'The name of the provider in the pact broker')
    .option('-a, --analyticsUrl [string]', 'The url to send analytics events to as a http post')
    .description(`Confirms the swagger spec and mock are compatible with each other.

Basic Usage:
The <swagger> and <mock> arguments should paths to the json files or urls to the json files.

Supported Mock Formats:
Pact

Pact Broker:
For providers using the pact broker the <mock> argument should be the url to the root of the
pact broker and the provider name should be passed using the --provider option. This will
automatically find the latest versions of the consumer pact file(s) uploaded to the broker for
the specified provider name. The <swagger> argument should be the path or url to the swagger
json file.`)
    .action((swagger, mock, options) => __awaiter(this, void 0, void 0, function* () {
    try {
        const result = yield swagger_mock_validator_1.swaggerMockValidator.validate({
            analyticsUrl: options.analyticsUrl,
            mockPathOrUrl: mock,
            providerName: options.provider,
            specPathOrUrl: swagger
        });
        displaySummary(result);
        if (!result.success) {
            logErrorAndExitProcess(new Error(result.failureReason));
        }
    }
    catch (error) {
        logErrorAndExitProcess(error);
    }
}))
    .parse(process.argv);
if (!commander.args.length) {
    commander.help();
}
