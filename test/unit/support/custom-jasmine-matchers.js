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
            util: options.util
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
                util: options.util
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
    toContainErrors: (util, customEqualityTesters) => ({
        compare: (actual, expected) => compareResults({
            actualResults: _.get(actual, 'errors', []),
            customEqualityTesters,
            expectedResults: expected,
            type: 'errors',
            util
        })
    }),
    toContainNoWarnings: (util, customEqualityTesters) => ({
        compare: (actual) => {
            const expected = {warnings: []};
            const result = {pass: util.equals(actual, expected, customEqualityTesters)};

            return result;
        }
    }),
    toContainWarnings: (util, customEqualityTesters) => ({
        compare: (actual, expected) => compareResults({
            actualResults: _.get(actual, 'warnings', []),
            customEqualityTesters,
            expectedResults: expected,
            type: 'warnings',
            util
        })
    })
};
