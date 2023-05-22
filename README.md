# Swagger Mock Validator
> A CLI tool to validate mocks against swagger/OpenApi specs.

## What is Swagger Mock Validator
- A command line tool that confirms mock request and responses conform to the schema specified in a Swagger 2 or OpenApi 3 specification.
- Supports mocks in Pact format (1.0, 1.1, 2.0, 3.0 and 4.0) and the [Pact Broker](https://github.com/bethesque/pact_broker) (1.8.0 or higher)
- Supports local files and urls
- Supports Swagger/OpenApi files in json or yaml format
- Can be invoked from the command line in any language

For a list of all the validation features see [FEATURES.md](docs/FEATURES.md).

## Requirements
- nodejs 14.x or higher (tested using 14.x, 16.x and 16.x)

Note: Beginning from v12+, this package is ESM-only, so you may need to upgrade your tooling to support this.

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

`swagger-mock-validator --help`

```bash
Usage: swagger-mock-validator [options] <swagger> <mock>

Confirms the swagger spec and mock are compatible with each other.

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
(i.e. THE_USERNAME:THE_PASSWORD) to access the pact broker resources.

Options:
  -V, --version                                   output the version number
  -p, --provider [string]                         The name of the provider in the pact broker
  -t, --tag [string]                              The tag to filter pacts retrieved from the pact broker
  -u, --user [USERNAME:PASSWORD]                  The basic auth username and password to access the pact broker
  -a, --analyticsUrl [string]                     The url to send analytics events to as a http post
  -o, --outputDepth [integer]                     Specifies the number of times to recurse while formatting the output objects. This is useful in case of large complicated objects or schemas. (default: 4)
  -A, --additionalPropertiesInResponse [boolean]  allow additional properties in response bodies, default false
  -R, --requiredPropertiesInResponse [boolean]    allows required properties in response bodies, default false
  -h, --help                                      display help for command
```


## Examples

We will demonstate with a sample Pact file and [Swagger PetStore Example](https://petstore.swagger.io/v2/swagger.json)

Included in this repository is a [sample Pact file](./docs/pact.json)

```json
{
  "consumer": {
    "name": "MyConsumer"
  },
  "provider": {
    "name": "pactWith"
  },
  "interactions": [
    {
      "description": "A get request to get a pet 1845563262948980200",
      "providerState": "A pet 1845563262948980200 exists",
      "request": {
        "method": "GET",
        "path": "/v2/pet/1845563262948980200",
        "headers": {
          "api_key": "[]"
        }
      },
      "response": {
        "status": 200,
        "headers": {
        },
        "body": {
          "someField": "some string"
        },
        "matchingRules": {
          "$.body.someField": {
            "match": "type"
          }
        }
      }
    }
  ],
  "metadata": {
    "pactSpecification": {
      "version": "2.0.0"
    }
  }
}
```

Default behaviour, as per the following flags 

- `--additionalPropertiesInResponse` false
- `--requiredPropertiesInResponse` false

`npx @pactflow/swagger-mock-validator https://petstore.swagger.io/v2/swagger.json ./docs/pact.json`

```bash
Mock file "./docs/pact.json" is not compatible with spec file "https://petstore.swagger.io/v2/swagger.json"
1 error(s)
        response.body.incompatible: 1
0 warning(s)
{
  warnings: [],
  errors: [
    {
      code: 'response.body.incompatible',
      message: 'Response body is incompatible with the response body schema in the spec file: should NOT have additional properties - someField',
      mockDetails: {
        interactionDescription: 'A get request to get a pet 1845563262948980200',
        interactionState: 'A pet 1845563262948980200 exists',
        location: '[root].interactions[0].response.body',
        mockFile: './docs/pact.json',
        value: { someField: 'some string' }
      },
      source: 'spec-mock-validation',
      specDetails: {
        location: '[root].paths./pet/{petId}.get.responses.200.schema.additionalProperties',
        pathMethod: 'get',
        pathName: '/pet/{petId}',
        specFile: 'https://petstore.swagger.io/v2/swagger.json',
        value: undefined
      },
      type: 'error'
    }
  ]
}

Error: Mock file "./docs/pact.json" is not compatible with spec file "https://petstore.swagger.io/v2/swagger.json"
```

With 

- `--additionalPropertiesInResponse` true
- `--requiredPropertiesInResponse` false

`npx @pactflow/swagger-mock-validator --additionalPropertiesInResponse true --requiredPropertiesInResponse false https://petstore.swagger.io/v2/swagger.json ./docs/pact.json`

```bash
0 error(s)
0 warning(s)
```

With 

- `--additionalPropertiesInResponse` false
- `--requiredPropertiesInResponse` true

`npx @pactflow/swagger-mock-validator --additionalPropertiesInResponse false --requiredPropertiesInResponse true https://petstore.swagger.io/v2/swagger.json ./docs/pact.json`

```bash

Mock file "./docs/pact.json" is not compatible with spec file "https://petstore.swagger.io/v2/swagger.json"
3 error(s)
        response.body.incompatible: 3
0 warning(s)
{
  warnings: [],
  errors: [
    {
      code: 'response.body.incompatible',
      message: 'Response body is incompatible with the response body schema in the spec file: should NOT have additional properties - someField',
      mockDetails: {
        interactionDescription: 'A get request to get a pet 1845563262948980200',
        interactionState: 'A pet 1845563262948980200 exists',
        location: '[root].interactions[0].response.body',
        mockFile: './docs/pact.json',
        value: { someField: 'some string' }
      },
      source: 'spec-mock-validation',
      specDetails: {
        location: '[root].paths./pet/{petId}.get.responses.200.schema.additionalProperties',
        pathMethod: 'get',
        pathName: '/pet/{petId}',
        specFile: 'https://petstore.swagger.io/v2/swagger.json',
        value: undefined
      },
      type: 'error'
    },
    {
      code: 'response.body.incompatible',
      message: "Response body is incompatible with the response body schema in the spec file: should have required property 'name'",
      mockDetails: {
        interactionDescription: 'A get request to get a pet 1845563262948980200',
        interactionState: 'A pet 1845563262948980200 exists',
        location: '[root].interactions[0].response.body',
        mockFile: './docs/pact.json',
        value: { someField: 'some string' }
      },
      source: 'spec-mock-validation',
      specDetails: {
        location: '[root].paths./pet/{petId}.get.responses.200.schema.required',
        pathMethod: 'get',
        pathName: '/pet/{petId}',
        specFile: 'https://petstore.swagger.io/v2/swagger.json',
        value: [ 'name', 'photoUrls' ]
      },
      type: 'error'
    },
    {
      code: 'response.body.incompatible',
      message: "Response body is incompatible with the response body schema in the spec file: should have required property 'photoUrls'",
      mockDetails: {
        interactionDescription: 'A get request to get a pet 1845563262948980200',
        interactionState: 'A pet 1845563262948980200 exists',
        location: '[root].interactions[0].response.body',
        mockFile: './docs/pact.json',
        value: { someField: 'some string' }
      },
      source: 'spec-mock-validation',
      specDetails: {
        location: '[root].paths./pet/{petId}.get.responses.200.schema.required',
        pathMethod: 'get',
        pathName: '/pet/{petId}',
        specFile: 'https://petstore.swagger.io/v2/swagger.json',
        value: [ 'name', 'photoUrls' ]
      },
      type: 'error'
    }
  ]
}

Error: Mock file "./docs/pact.json" is not compatible with spec file "https://petstore.swagger.io/v2/swagger.json"
```

With 

- `--additionalPropertiesInResponse` true
- `--requiredPropertiesInResponse` true

`npx @pactflow/swagger-mock-validator --additionalPropertiesInResponse true --requiredPropertiesInResponse true https://petstore.swagger.io/v2/swagger.json ./docs/pact.json`

```bash
Mock file "./docs/pact.json" is not compatible with spec file "https://petstore.swagger.io/v2/swagger.json"
2 error(s)
        response.body.incompatible: 2
0 warning(s)
{
  warnings: [],
  errors: [
    {
      code: 'response.body.incompatible',
      message: "Response body is incompatible with the response body schema in the spec file: should have required property 'name'",
      mockDetails: {
        interactionDescription: 'A get request to get a pet 1845563262948980200',
        interactionState: 'A pet 1845563262948980200 exists',
        location: '[root].interactions[0].response.body',
        mockFile: './docs/pact.json',
        value: { someField: 'some string' }
      },
      source: 'spec-mock-validation',
      specDetails: {
        location: '[root].paths./pet/{petId}.get.responses.200.schema.required',
        pathMethod: 'get',
        pathName: '/pet/{petId}',
        specFile: 'https://petstore.swagger.io/v2/swagger.json',
        value: [ 'name', 'photoUrls' ]
      },
      type: 'error'
    },
    {
      code: 'response.body.incompatible',
      message: "Response body is incompatible with the response body schema in the spec file: should have required property 'photoUrls'",
      mockDetails: {
        interactionDescription: 'A get request to get a pet 1845563262948980200',
        interactionState: 'A pet 1845563262948980200 exists',
        location: '[root].interactions[0].response.body',
        mockFile: './docs/pact.json',
        value: { someField: 'some string' }
      },
      source: 'spec-mock-validation',
      specDetails: {
        location: '[root].paths./pet/{petId}.get.responses.200.schema.required',
        pathMethod: 'get',
        pathName: '/pet/{petId}',
        specFile: 'https://petstore.swagger.io/v2/swagger.json',
        value: [ 'name', 'photoUrls' ]
      },
      type: 'error'
    }
  ]
}

Error: Mock file "./docs/pact.json" is not compatible with spec file "https://petstore.swagger.io/v2/swagger.json"
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

