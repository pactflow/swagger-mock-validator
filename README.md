# Swagger Pact Validator
> A CLI tool to validate pact files against swagger specs.

## What is Swagger Pact Validator
- A command line tool that confirms the request and responses captured in a pact file conform to the schema specified in a swagger specification.
- Supports local files
- Supports swagger files in json format
- Can be invoked from the command line in any language

For a list of all the validation rules see [RULES.md](RULES.md).

## Requirements
- nodejs 4.x or higher (tested using 4.7.1, 6.9.3 and 7.3.0)
- npm 2.x or higher (tested using 2.15.11 and 3.10.10)

## Installation

1. Login to Atlassian's private npm repository using your Staff ID credentials.
```
npm login --registry=https://npm-private.atlassian.io --scope=atlassian
```

2. Install the tool using npm
```
npm install --global @atlassian/swagger-pact-validator
```

## Usage
Invoke the tool with a path or url to a swagger file and a path or url to a pact file. These files should be in json format.
```
swagger-pact-validator /path/to/swagger.json /path/to/pact.json

swagger-pact-validator http://api.com/swagger.json https://pact-broker.com/pact.json

swagger-pact-validator /path/to/swagger.json https://pact-broker.com/pact.json
```

Invoking this command will confirm the swagger spec and pact are compatible with each other.

If the two files are compatible with each other an exit status of 0 is returned.

If the two files are not compatible with each other an exit status of 1 is returned, along with a message containing the reason why the two files are not compatible.

For more options on how to use the command run the command with the help flag.
```
swagger-pact-validator --help
```

## Changelog
See [CHANGELOG.md](CHANGELOG.md)

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md)

## License
See [LICENSE.txt](LICENSE.txt)
