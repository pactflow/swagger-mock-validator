'use strict';

const _ = require('lodash');

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
    const expectedProperty = _.get(options.expectedResult, options.property);

    const pass = options.util.equals(actualProperty, expectedProperty, options.customEqualityTesters);

    const message = pass
        ? `Expected '${actualProperty}' not to be '${expectedProperty}' ` +
        `in warning[${options.index}].${options.property}`
        : `Expected '${actualProperty}' to be '${expectedProperty}' ` +
        `in ${options.type}[${options.index}].${options.property}`;

    return {
        pass,
        message
    };
};

const compareResult = (options) =>
    _.map(propertiesToCompare, (property) =>
        compareProperties({
            actualResult: options.actualResult,
            expectedResult: options.expectedResult,
            index: options.index,
            customEqualityTesters: options.customEqualityTesters,
            util: options.util,
            type: options.type,
            property
        })
    );

const compareResults = (options) => {
    const comparisonResults = _(options.expectedResults)
        .zip(options.actualResults || [])
        .map((actualAndExpectedResult, index) =>
            compareResult({
                actualResult: actualAndExpectedResult[1],
                expectedResult: actualAndExpectedResult[0],
                index,
                util: options.util,
                customEqualityTesters: options.customEqualityTesters,
                type: options.type
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
            pass: true,
            message: successComparisonMessages.join('\n')
        };
    }

    return {
        pass: false,
        message: failComparisonMessages.join('\n')
    };
};

module.exports = {
    toContainErrors: (util, customEqualityTesters) => ({
        compare: (actual, expected) => compareResults({
            actualResults: actual.errors,
            expectedResults: expected,
            util,
            customEqualityTesters,
            type: 'errors'
        })
    }),
    toContainWarnings: (util, customEqualityTesters) => ({
        compare: (actual, expected) => compareResults({
            actualResults: actual.warnings,
            expectedResults: expected,
            util,
            customEqualityTesters,
            type: 'warnings'
        })
    }),
    toContainNoWarnings: (util, customEqualityTesters) => ({
        compare: (actual) => {
            const expected = {warnings: []};
            const result = {pass: util.equals(actual, expected, customEqualityTesters)};

            return result;
        }
    })
};
