# Contributing

## Guidelines

- Write tests for any changes
- Follow existing code style and conventions
- Use [conventional changelog conventions](https://github.com/bcoe/conventional-changelog-standard/blob/master/convention.md) in your commit messages

## Development dependencies

- nvm 0.30.2

## Setting up a development machine

1. Install nodejs
```
nvm install
```

2. Login to Atlassian's private npm repository using your Staff ID credentials.
```
npm login --registry=https://npm-private.atlassian.io --scope=atlassian
```

3. Install project dependencies
```
npm install
```

4. Ensure your environment is working by running the pre-commit check
```
npm test
```

## During development

Commits to this codebase should follow the [conventional changelog conventions](https://github.com/bcoe/conventional-changelog-standard/blob/master/convention.md).

To get fast test feedback run `npm run watch` in one terminal window and `npm run watch-e2e` in another.

- `npm test` - A pre-commit check to be run before pushing any changes
- `npm run watch` - Automatically runs the unit tests whenever you edit a relevant file
- `npm run watch-e2e` - Automatically runs the e2e tests whenever you edit a relevant file

## Releasing a new version

This project is versioned using [Semantic Versioning](http://semver.org/).

- `npm run release-patch` - Publishes a patch version to npm, e.g. 1.0.0 -> 1.0.1
- `npm run release-minor` - Publishes a minor version to npm, e.g. 1.0.0 -> 1.1.0
- `npm run release-major` - Publishes a major version to npm, e.g. 1.0.0 -> 2.0.0
