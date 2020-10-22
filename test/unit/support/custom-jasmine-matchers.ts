import * as _ from 'lodash';
import * as util from 'util';
import CustomMatcherFactories = jasmine.CustomMatcherFactories;
import CustomEqualityTester = jasmine.CustomEqualityTester;
import MatchersUtil = jasmine.MatchersUtil;
import {ValidationResult} from '../../../lib/api-types';

interface CompareResultCollectionOptions<T> {
    actualResults: T[];
    customEqualityTesters: ReadonlyArray<CustomEqualityTester>;
    expectedResults: T[];
    type: string;
    utilities: MatchersUtil;
}

interface CompareResultOptions<T> {
    actualResult: T;
    customEqualityTesters: ReadonlyArray<CustomEqualityTester>;
    expectedResult: T;
    index: number;
    type: string;
    utilities: MatchersUtil;
}

interface ComparePropertyOptions<T> {
    actualResult: T;
    customEqualityTesters: ReadonlyArray<CustomEqualityTester>;
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
    'specDetails.specFile',
    'specDetails.value',
    'type'
];

const compareProperties = <T>(options: ComparePropertyOptions<T>) => {
    const actualProperty = _.get(options.actualResult, options.property);
    const actualPropertyAsString = valueToString(actualProperty);
    const expectedProperty = _.get(options.expectedResult, options.property);
    const expectedPropertyAsString = valueToString(expectedProperty);

    const pass = options.utilities.equals(
        actualProperty,
        expectedProperty,
        options.customEqualityTesters as CustomEqualityTester[]
    );

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

type ObjectWithPossibleErrors =  {errors?: ValidationResult[]} | undefined;
type ObjectWithPossibleWarnings =  {warnings?: ValidationResult[]} | undefined;
type ObjectWithPossibleErrorsAndWarnings = {errors?: ValidationResult[]; warnings?: ValidationResult[]} | undefined;

const getErrors = (objectWithPossibleErrors: ObjectWithPossibleErrors): ValidationResult[] =>
    (objectWithPossibleErrors || {}).errors || [];

const getWarnings = (objectWithPossibleWarnings: ObjectWithPossibleWarnings): ValidationResult[] =>
    (objectWithPossibleWarnings || {}).warnings || [];

export const customMatchers: CustomMatcherFactories = {
    toContainErrors: (utilities, customEqualityTesters) => ({
        compare: (actual: ObjectWithPossibleErrors, expected: ValidationResult[]) => compareResults({
            actualResults: getErrors(actual),
            customEqualityTesters,
            expectedResults: expected,
            type: 'errors',
            utilities
        })
    }),
    toContainNoErrors: (utilities, customEqualityTesters) => ({
        compare: (actual: ObjectWithPossibleErrors) => {
            const expected: ValidationResult[] = [];
            const actualResults = getErrors(actual);
            return {pass: utilities.equals(actualResults, expected, customEqualityTesters)};
        }
    }),
    toContainNoWarningsOrErrors: (utilities, customEqualityTesters) => ({
        compare: (actual: ObjectWithPossibleErrorsAndWarnings) => {
            const expected: ObjectWithPossibleErrorsAndWarnings = {warnings: [], errors: []};
            const actualResults = {
                errors: getErrors(actual),
                warnings: getWarnings(actual)
            };
            return {pass: utilities.equals(actualResults, expected, customEqualityTesters)};
        }
    }),
    toContainWarnings: (utilities, customEqualityTesters) => ({
        compare: (actual: ObjectWithPossibleWarnings, expected: ValidationResult[]) => compareResults({
            actualResults: getWarnings(actual),
            customEqualityTesters,
            expectedResults: expected,
            type: 'warnings',
            utilities
        })
    })
};

export interface CustomMatchers<T> extends jasmine.Matchers<T> {
    toContainErrors(expected: ValidationResult[]): boolean;
    toContainNoErrors(): boolean;
    toContainNoWarningsOrErrors(): boolean;
    toContainWarnings(expected: ValidationResult[]): boolean;
}
