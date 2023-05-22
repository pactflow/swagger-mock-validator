#!/bin/bash
node --version
yarn install --frozen-lockfile
yarn lint
yarn test
yarn build
yarn test:e2e
