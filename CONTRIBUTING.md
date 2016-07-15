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

3. Install project dependencies
```
npm install
```

4. Ensure your environment is working by running the pre-commit check
```
gulp
```

## During development

Commits to this codebase should follow the [conventional changelog conventions](https://github.com/bcoe/conventional-changelog-standard/blob/master/convention.md).

- `gulp` - A pre-commit check to be run before pushing any changes
- `gulp watch` - Automatically runs the tests whenever you edit a file

## Publishing a new version

This project is versioned using [Semantic Versioning](http://semver.org/).

- `gulp publish bugfix` - Publishes a minor version to npm
- `gulp publish minor` - Publishes a major version to npm
- `gulp publish major` - Publishes a major version to npm
