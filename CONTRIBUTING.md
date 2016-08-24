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

2. Install gulp cli (optional)
```
npm install --global gulp-cli
```
If you do not want to install the gulp cli globally you can access it via `./node_modules/.bin/gulp`

3. Login to Atlassian's private npm repository using your Staff ID credentials.
```
npm login --registry=https://npm-private.atlassian.io --scope=atlassian
```

4. Install project dependencies
```
npm install
```

5. Ensure your environment is working by running the pre-commit check
```
gulp
```

## During development

Commits to this codebase should follow the [conventional changelog conventions](https://github.com/bcoe/conventional-changelog-standard/blob/master/convention.md).

To get fast test feedback run `gulp watch` in one terminal window and `gulp watch-e2e` in another.

- `gulp` - A pre-commit check to be run before pushing any changes
- `gulp watch` - Automatically runs the unit tests whenever you edit a relevant file
- `gulp watch-e2e` - Automatically runs the e2e tests whenever you edit a relevant file

## Releasing a new version

This project is versioned using [Semantic Versioning](http://semver.org/).

- `gulp release --type patch` - Publishes a patch version to npm, e.g. 1.0.0 -> 1.0.1
- `gulp release --type minor` - Publishes a minor version to npm, e.g. 1.0.0 -> 1.1.0
- `gulp release --type major` - Publishes a major version to npm, e.g. 1.0.0 -> 2.0.0
