# Swagger Mock Validator
> A CLI tool to validate mocks against swagger/OpenApi specs.

## What is Swagger Mock Validator
- A command line tool that confirms mock request and responses conform to the schema specified in a Swagger 2 or OpenApi 3 specification.
- Supports mocks in Pact format (1.0, 1.1, 2.0 or 3.0) and the [Pact Broker](https://github.com/bethesque/pact_broker) (1.8.0 or higher)
- Supports local files and urls
- Supports Swagger/OpenApi files in json or yaml format
- Can be invoked from the command line in any language

For a list of all the validation features see [FEATURES.md](docs/FEATURES.md).

## Requirements
- nodejs 10.x or higher (tested using 10.x, 12.x and 14.x)
- npm 6.x or higher (tested using 3.x, 5x and 6.x)

## Installation

Install the tool globally using npm
```
npm install --global @pactflow/swagger-mock-validator
```

Install the tool a single project
```
npm install --save-dev @pactflow/swagger-mock-validator
```

Download and run the tool directly, without a global install, see [Usage](#usage)
```
npx @pactflow/swagger-mock-validator /path/to/swagger.json /path/to/pact.json
```

## Usage
Invoke the tool with a path or url to a Swagger or OpenApi file and a path or url to a mock file. These files should be in json format.
```
swagger-mock-validator /path/to/swagger.json /path/to/pact.json

swagger-mock-validator https://api.com/swagger.json https://pact-broker.com/pact.json

swagger-mock-validator /path/to/swagger.json https://pact-broker.com/pact.json
```

Invoking this command will confirm the Swagger/OpenApi spec and mock are compatible with each other. [FEATURES.md](docs/FEATURES.md) contains the details of what is verified.

If the two files are compatible with each other an exit status of 0 is returned.

If the two files are not compatible with each other an exit status of 1 is returned, along with a message containing the reason why the two files are not compatible.

The depth of the objects in the output can be modified by using `--outputDepth` flag, default depth is 4.
```
swagger-mock-validator spec.json mock.json --outputDepth 5
```

For more options on how to use the command run the command with the help flag.
```
swagger-mock-validator --help
```

### Providers using the Pact Broker

Provider services can easily verify all the consumer pact files uploaded to a Pact Broker using this tool. Invoke the tool with a url to the Pact Broker along with the name of the provider service and the tool will automatically discover and validate the latest versions of the consumer pact files for the provider service.
```
swagger-mock-validator /path/to/swagger.json https://pact-broker.com --provider my-provider-name
```

Additionally, provide a Pact Broker version tag alongside the name of the provider service to filter the retrieved consumer pacts for the provider by the given tag.
```
swagger-mock-validator /path/to/swagger.json https://pact-broker.com --provider my-provider-name --tag production
```

If the Pact Broker is behind basic auth, you can pass credentials with the `--user` option while invoking the tool.
```
swagger-mock-validator /path/to/swagger.json https://pact-broker.com --provider my-provider-name --user BASIC_AUTH_USER:BASIC_AUTH_PASSWORD
```

### Analytics (Opt-In)

The tool can be configured to send analytics events to a server of your choosing. Use the `--analyticsUrl` flag to pass a url that the tool should post the event to. The tool will send this event via a http post request and will timeout after 5 seconds. See [analytics.ts](lib/swagger-mock-validator/analytics.ts) for the post body schema.

```
swagger-mock-validator /path/to/swagger.json /path/to/pact.json --analyticsUrl https://analytics-server.com/event
```

Any errors sending the analytic events are ignored and do not impact the validation results, a successful validation that had an error while trying to send the analytic event is still a successful validation.

By default analytics are disabled. To protect your privacy this is an opt-in feature.

## Frequently Asked Questions
See [FAQ.md](FAQ.md)

## Changelog
See [CHANGELOG.md](CHANGELOG.md)

## Contributing
See [CONTRIBUTING.md](docs/CONTRIBUTING.md)

## License
See [LICENSE.txt](LICENSE.txt)

## Acknowledgements 

This repository is a fork of Atlassians swagger-mock-validator which resides on BitBucket https://bitbucket.org/atlassian/swagger-mock-validator/src/master/

