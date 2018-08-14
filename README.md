# Swagger Mock Validator
> A CLI tool to validate mocks against swagger/OpenApi specs.

## What is Swagger Mock Validator
- A command line tool that confirms mock request and responses conform to the schema specified in a Swagger 2 or OpenApi 3 specification.
- Supports mocks in Pact format (1.0, 1.1 or 2.0) and the [Pact Broker](https://github.com/bethesque/pact_broker) (1.8.0 or higher)
- Supports local files and urls
- Supports Swagger/OpenApi files in json or yaml format
- Can be invoked from the command line in any language

For a list of all the validation features see [FEATURES.md](docs/FEATURES.md).

## Requirements
- nodejs 6.x or higher (tested using 6.x, 8.x and 10.x)
- npm 3.x or higher (tested using 3.x, 5x and 6.x)

## Installation

Install the tool using npm
```
npm install --global swagger-mock-validator
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

For more options on how to use the command run the command with the help flag.
```
swagger-mock-validator --help
```

### Providers using the Pact Broker

Provider services can easily verify all the consumer pact files uploaded to a Pact Broker using this tool. Invoke the tool with a url to the Pact Broker along with the name of the provider service and the tool will automatically discover and validate the latest versions of the consumer pact files for the provider service.
```
swagger-mock-validator /path/to/swagger.json https://pact-broker.com --provider my-provider-name
```

### Analytics (Opt-In)

The tool can be configured to send analytics events to a server of your choosing. Use the `--analyticsUrl` flag to pass a url that the tool should post the event to. The tool will send this event via a http post request and will timeout after 5 seconds. See [analytics.ts](lib/swagger-mock-validator/analytics.ts) for the post body schema.

```
swagger-mock-validator /path/to/swagger.json /path/to/pact.json --analyticsUrl https://analytics-server.com/event
```

Any errors sending the analytic events are ignored and do not impact the validation results, a successful validation that had an error while trying to send the analytic event is still a successful validation.

By default analytics are disabled. To protect your privacy this is an opt-in feature.

## Changelog
See [CHANGELOG.md](CHANGELOG.md)

## Contributing
See [CONTRIBUTING.md](docs/CONTRIBUTING.md)

## License
See [LICENSE.txt](LICENSE.txt)
