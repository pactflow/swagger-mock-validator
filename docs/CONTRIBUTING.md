# Contributing

## Contributor License Agreement

Atlassian requires contributors to sign a Contributor License Agreement, known as a CLA. This serves as a record stating
that the contributor is entitled to contribute the code/documentation/translation to the project and is willing to have
it used in distributions and derivative works (or is willing to transfer ownership).

Prior to accepting your contributions we ask that you please follow the appropriate link below to digitally sign the
CLA. The Corporate CLA is for those who are contributing as a member of an organisation and the individual CLA is for
those contributing as an individual.

* [CLA for corporate contributors](https://na2.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=e1c17c66-ca4d-4aab-a953-2c231af4a20b)
* [CLA for individuals](https://na2.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=3f94fbdc-2fbe-46ac-b14c-5d152700ae5d)

## Guidelines for pull requests

- Write tests for any changes
- Follow existing code style and conventions
- Separate unrelated changes into multiple pull requests
- For bigger changes, make sure you start a discussion first by creating an issue and explaining the intended change
- Use [conventional changelog conventions](https://github.com/bcoe/conventional-changelog-standard/blob/master/convention.md)
in your commit messages

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

Commits to this codebase should follow the
[conventional changelog conventions](https://github.com/bcoe/conventional-changelog-standard/blob/master/convention.md).

To get fast test feedback run `npm run watch` in one terminal window and `npm run watch-e2e` in another.

- `npm test` - A pre-commit check to be run before pushing any changes.
- `npm run watch` - Automatically compiles the code and runs the unit tests whenever you edit a relevant file.
- `npm run watch-e2e` - Automatically runs the e2e tests whenever you edit a relevant file. This command does not
compile the code and must be run in combination with the watch command.

### Run progam locally

To run the compiled development code locally change to the bin directory and run the swagger-mock-validator-local app via node. This compiled version preserves any console logs for development purposes.

```
cd bin
node swagger-mock-validator-local <example_swagger_json> <example_pactfile_json> --outputDepth 5
```

## Releasing a new version

See [Releasing](RELEASING.md)

## Bumping project dependencies

 1. In `.nvmrc` update the version number to the latest node LTS version.
 2. In `bitbucket-pipelines.yml` update the node versions to install the latest version of all currently supported major
 releases of node, e.g. the latest 10.x, 12.x, etc. See https://nodejs.org/en/about/releases/ for version details.
 3. Run `nvm install`.
 4. Delete your local `package-lock.json` file and `node_modules/` directory.
 5. Run `npm install`.
 6. Run: `npx npm-check -u` and follow the instructions.
 7. Change the version of `@types/node` to match the version of node in the `.nvmrc` folder. For example, if `.nvmrc`
 contains `10.16.2` then `@types/node` should be `^10`.
 8. Test your changes: `npm test`
 9. Note that `typescript` does not follow semver, so go into the package.json and remove the ^ symbol from in front of
 its dependency version number to prevent it from automatically being bumped during builds. This ensures build stability.
