#! /usr/bin/env node
"use strict";
const commander = require("commander");
const util = require("util");
const swagger_pact_validator_1 = require("./swagger-pact-validator");
// tslint:disable:no-var-requires
const packageJson = require('../package.json');
commander
    .version(packageJson.version)
    .arguments('<swagger> <pact>')
    .description('Confirms the swagger spec and pact are compatible with each other. ' +
    'The <swagger> and <pact> arguments should paths to the json files ' +
    'or urls to the json files.')
    .action((swagger, pact) => swagger_pact_validator_1.default.validate({
    pactPathOrUrl: pact,
    swaggerPathOrUrl: swagger
}).catch((error) => {
    console.log(`${error.message}\n`);
    if (error.details) {
        console.log(`${util.inspect(error.details, { depth: 4 })}\n`);
    }
    console.log(error.stack);
    process.exitCode = 1;
}))
    .parse(process.argv);
if (!commander.args.length) {
    commander.help();
}
