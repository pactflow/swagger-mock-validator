# Contributing

## Contributor License Agreement

Atlassian requires contributors to sign a Contributor License Agreement, known as a CLA. This serves as a record stating that the contributor is entitled to contribute the code/documentation/translation to the project and is willing to have it used in distributions and derivative works (or is willing to transfer ownership).

Prior to accepting your contributions we ask that you please follow the appropriate link below to digitally sign the CLA. The Corporate CLA is for those who are contributing as a member of an organisation and the individual CLA is for those contributing as an individual.

* [CLA for corporate contributors](https://na2.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=e1c17c66-ca4d-4aab-a953-2c231af4a20b)
* [CLA for individuals](https://na2.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=3f94fbdc-2fbe-46ac-b14c-5d152700ae5d)

## Guidelines for pull requests


- Write tests for any changes
- Follow existing code style and conventions
- Separate unrelated changes into multiple pull requests
- For bigger changes, make sure you start a discussion first by creating an issue and explaining the intended change
- Use [conventional changelog conventions](https://github.com/bcoe/conventional-changelog-standard/blob/master/convention.md) in your commit messages

## Development dependencies

- nvm 0.30.2

## Setting up a development machine

Install nodejs
```
nvm install
```

Install project dependencies
```
npm install
```

Ensure your environment is working by running the pre-commit check
```
npm test
```

## During development

Commits to this codebase should follow the [conventional changelog conventions](https://github.com/bcoe/conventional-changelog-standard/blob/master/convention.md).

To get fast test feedback run `npm run watch` in one terminal window and `npm run watch-e2e` in another.

- `npm test` - A pre-commit check to be run before pushing any changes.
- `npm run watch` - Automatically compiles the code and runs the unit tests whenever you edit a relevant file.
- `npm run watch-e2e` - Automatically runs the e2e tests whenever you edit a relevant file. This command does not compile the code and must be run in combination with the watch command.

## Releasing a new version

This project is versioned using [Semantic Versioning](http://semver.org/).

- `npm run release-patch` - Publishes a patch version to npm, e.g. 1.0.0 -> 1.0.1
- `npm run release-minor` - Publishes a minor version to npm, e.g. 1.0.0 -> 1.1.0
- `npm run release-major` - Publishes a major version to npm, e.g. 1.0.0 -> 2.0.0
