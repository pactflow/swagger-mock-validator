# Swagger Mock Validator
> A CLI tool to validate mocks against swagger specs.

## What is Swagger Mock Validator
- A command line tool that confirms mock request and responses conform to the schema specified in a swagger specification.
- Supports mocks in Pact format and the [Pact Broker](https://github.com/bethesque/pact_broker)
- Supports local files and urls
- Supports swagger files in json or yaml format
- Can be invoked from the command line in any language

For a list of all the validation rules see [RULES.md](RULES.md).

## Requirements
- nodejs 4.x or higher (tested using 4.8.0, 6.10.0 and 7.7.1)
- npm 2.x or higher (tested using 2.15.11 and 3.10.10)

## Installation

Install the tool using npm
```
npm install --global swagger-mock-validator
```

## Usage
Invoke the tool with a path or url to a swagger file and a path or url to a mock file. These files should be in json format.
```
swagger-mock-validator /path/to/swagger.json /path/to/pact.json

swagger-mock-validator https://api.com/swagger.json https://pact-broker.com/pact.json

swagger-mock-validator /path/to/swagger.json https://pact-broker.com/pact.json
```

Invoking this command will confirm the swagger spec and mock are compatible with each other. [RULES.md](RULES.md) contains the details of what is verified.

If the two files are compatible with each other an exit status of 0 is returned.

If the two files are not compatible with each other an exit status of 1 is returned, along with a message containing the reason why the two files are not compatible.

For more options on how to use the command run the command with the help flag.
```
swagger-mock-validator --help
```

### Providers using the Pact Broker

Provider services can easily verify all the consumer pact files uploaded to a Pact Broker using this tool. Invoke the tool with a url to the Pact Broker along with the name of the provider service and the tool will automatically discover and validate the latest versions of the consumer pact files for the provider service.
```
swagger-mock-validator /path/to/swagger.json https://pact-broker.com --providerName my-provider-name
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
See [CONTRIBUTING.md](CONTRIBUTING.md)

## License
See [LICENSE.txt](LICENSE.txt)
