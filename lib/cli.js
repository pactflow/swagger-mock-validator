#! /usr/bin/env node

'use strict';

const commander = require('commander');
const packageJson = require('../package.json');
const swaggerPactValidator = require('./swagger-pact-validator');

commander
  .version(packageJson.version)
  .arguments('<swagger> <pact>')
  .description(
      'Confirms the swagger spec and pact are compatible with each other. ' +
      'The <swagger> and <pact> arguments should paths to the json files.'
  )
  .action((swagger, pact) =>
    swaggerPactValidator.validate(swagger, pact).catch((error) => {
        console.log(`${error.message}\n`);
        if (error.details) {
            console.log(`${JSON.stringify(error.details, null, 4)}\n`);
        }
        console.log(error.stack);
        process.exitCode = 1;
    })
  )
  .parse(process.argv);

if (!commander.args.length) {
    commander.help();
}
