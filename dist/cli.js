#! /usr/bin/env node
"use strict";
const commander = require("commander");
const _ = require("lodash");
const util = require("util");
const swagger_pact_validator_1 = require("./swagger-pact-validator");
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
const displaySummary = (warningsOrUndefined, errorsOrUndefined) => {
    displaySummaryForValidationResults('error', errorsOrUndefined);
    displaySummaryForValidationResults('warning', warningsOrUndefined);
};
commander
    .version(packageJson.version)
    .arguments('<swagger> <pact>')
    .option('-p, --provider [string]', 'The name of the provider in the pact broker')
    .description(`Confirms the swagger spec and pact are compatible with each other.
            
Basic Usage:
The <swagger> and <pact> arguments should paths to the json files or urls to the json files.

Pact Broker:
For providers using the pact broker the <pact> argument should be the url to the root of the 
pact broker and the provider name should be passed using the --provider option. This will 
automatically find the latest versions of the consumer pact file(s) uploaded to the broker for 
the specified provider name. The <swagger> argument should be the path or url to the swagger 
json file.`)
    .action((swagger, pact, options) => swagger_pact_validator_1.default.validate({
    pactPathOrUrl: pact,
    providerName: options.provider,
    swaggerPathOrUrl: swagger
})
    .then((results) => {
    displaySummary(results.warnings);
    if (results.warnings.length > 0) {
        console.log(`${util.inspect(results, { depth: 4 })}\n`);
    }
})
    .catch((error) => {
    console.log(`${error.message}\n`);
    if (error.details) {
        displaySummary(error.details.warnings, error.details.errors);
        console.log(`${util.inspect(error.details, { depth: 4 })}\n`);
    }
    console.log(error.stack);
    process.exitCode = 1;
}))
    .parse(process.argv);
if (!commander.args.length) {
    commander.help();
}
