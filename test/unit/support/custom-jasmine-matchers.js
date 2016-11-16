'use strict';

const util = require('util');
const _ = require('lodash');

const valueToString = (value) => util.inspect(value, {breakLength: Infinity});

const propertiesToCompare = [
    'message',
    'pactDetails.interactionDescription',
    'pactDetails.interactionState',
    'pactDetails.location',
    'pactDetails.value',
    'source',
    'swaggerDetails.pathName',
    'swaggerDetails.pathMethod',
    'swaggerDetails.location',
    'swaggerDetails.value',
    'type'
];

const compareProperties = (options) => {
    const actualProperty = _.get(options.actualResult, options.property);
    const actualPropertyAsString = valueToString(actualProperty);
    const expectedProperty = _.get(options.expectedResult, options.property);
    const expectedPropertyAsString = valueToString(expectedProperty);

    const pass = options.utilities.equals(actualProperty, expectedProperty, options.customEqualityTesters);

    const message = pass
        ? `Expected '${actualPropertyAsString}' not to be '${expectedPropertyAsString}' ` +
        `in warning[${options.index}].${options.property}`
        : `Expected '${actualPropertyAsString}' to be '${expectedPropertyAsString}' ` +
        `in ${options.type}[${options.index}].${options.property}`;

    return {
        message,
        pass
    };
};

const compareResult = (options) =>
    _.map(propertiesToCompare, (property) =>
        compareProperties({
            actualResult: options.actualResult,
            customEqualityTesters: options.customEqualityTesters,
            expectedResult: options.expectedResult,
            index: options.index,
            property,
            type: options.type,
            utilities: options.utilities
        })
    );

const compareResults = (options) => {
    const comparisonResults = _(options.expectedResults)
        .zip(options.actualResults || [])
        .map((actualAndExpectedResult, index) =>
            compareResult({
                actualResult: actualAndExpectedResult[1],
                customEqualityTesters: options.customEqualityTesters,
                expectedResult: actualAndExpectedResult[0],
                index,
                type: options.type,
                utilities: options.utilities
            })
        )
        .flatten()
        .value();

    const failComparisonMessages = _(comparisonResults)
        .filter({pass: false})
        .map('message')
        .value();

    const successComparisonMessages = _(comparisonResults)
        .filter({pass: true})
        .map('message')
        .value();

    if (failComparisonMessages.length === 0) {
        return {
            message: successComparisonMessages.join('\n'),
            pass: true
        };
    }

    return {
        message: failComparisonMessages.join('\n'),
        pass: false
    };
};

module.exports = {
    toContainErrors: (utilities, customEqualityTesters) => ({
        compare: (actual, expected) => compareResults({
            actualResults: _.get(actual, 'errors', []),
            customEqualityTesters,
            expectedResults: expected,
            type: 'errors',
            utilities
        })
    }),
    toContainNoWarnings: (utilities, customEqualityTesters) => ({
        compare: (actual) => {
            const expected = {warnings: []};
            const result = {pass: utilities.equals(actual, expected, customEqualityTesters)};

            return result;
        }
    }),
    toContainWarnings: (utilities, customEqualityTesters) => ({
        compare: (actual, expected) => compareResults({
            actualResults: _.get(actual, 'warnings', []),
            customEqualityTesters,
            expectedResults: expected,
            type: 'warnings',
            utilities
        })
    })
};
