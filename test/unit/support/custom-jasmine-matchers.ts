import * as _ from 'lodash';
import * as util from 'util';
import CustomMatcherFactories = jasmine.CustomMatcherFactories;
import CustomEqualityTester = jasmine.CustomEqualityTester;
import MatchersUtil = jasmine.MatchersUtil;
import {
    ValidationFailureErrorDetails,
    ValidationResult
} from '../../../lib/swagger-mock-validator/types';

interface CompareResultCollectionOptions<T> {
    actualResults: T[];
    customEqualityTesters: CustomEqualityTester[];
    expectedResults: T[];
    type: string;
    utilities: MatchersUtil;
}

interface CompareResultOptions<T> {
    actualResult: T;
    customEqualityTesters: CustomEqualityTester[];
    expectedResult: T;
    index: number;
    type: string;
    utilities: MatchersUtil;
}

interface ComparePropertyOptions<T> {
    actualResult: T;
    customEqualityTesters: CustomEqualityTester[];
    expectedResult: T;
    index: number;
    property: string;
    type: string;
    utilities: MatchersUtil;
}

const valueToString = (value: any) => util.inspect(value, {breakLength: Infinity});

const propertiesToCompare = [
    'code',
    'message',
    'mockDetails.interactionDescription',
    'mockDetails.interactionState',
    'mockDetails.location',
    'mockDetails.pactFile',
    'mockDetails.value',
    'source',
    'specDetails.pathName',
    'specDetails.pathMethod',
    'specDetails.location',
    'specDetails.swaggerFile',
    'specDetails.value',
    'type'
];

const compareProperties = <T>(options: ComparePropertyOptions<T>) => {
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

const compareResult = <T>(options: CompareResultOptions<T>) =>
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

const compareResults = <T>(options: CompareResultCollectionOptions<T>) => {
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

export const customMatchers: CustomMatcherFactories = {
    toContainErrors: (utilities, customEqualityTesters) => ({
        compare: (actual: ValidationFailureErrorDetails, expected: ValidationResult[]) => compareResults({
            actualResults: _.get(actual, 'errors', []),
            customEqualityTesters,
            expectedResults: expected,
            type: 'errors',
            utilities
        })
    }),
    toContainNoWarnings: (utilities, customEqualityTesters) => ({
        compare: <T>(actual: T) => {
            const expected: {warnings: T[]} = {warnings: []};
            return {pass: utilities.equals(actual, expected, customEqualityTesters)};
        }
    }),
    toContainWarnings: (utilities, customEqualityTesters) => ({
        compare: <T>(actual: {warnings?: T[]}, expected: T[]) => compareResults({
            actualResults: _.get(actual, 'warnings', []),
            customEqualityTesters,
            expectedResults: expected,
            type: 'warnings',
            utilities
        })
    })
};

export interface CustomMatchers<T> extends jasmine.Matchers<T> {
    toContainErrors(expected: ValidationResult[]): boolean;
    toContainNoWarnings(): boolean;
    toContainWarnings(expected: ValidationResult[]): boolean;
}
