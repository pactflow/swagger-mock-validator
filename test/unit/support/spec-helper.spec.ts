import {SwaggerMockValidatorErrorImpl} from '../../../lib/swagger-mock-validator/swagger-mock-validator-error-impl';

describe('spec-helper', () => {
    describe('SwaggerMockValidatorError', () => {
        it('should find equal two SwaggerMockValidatorError objects with same code and message', () => {
            const actual = new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR', 'A file system error'
            );
            const expected = new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR', 'A file system error'
            );

            expect(actual).toEqual(expected);
        });

        it('should not use the custom equality tester when the expected is not a SwaggerMockValidatorError', () => {
            const actual = new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR', 'A file system error'
            );
            const expected = new Error('A file system error');

            expect(actual).toEqual(expected as any);
        });

        it('should not consider objects that are not instances of SwaggerMockValidatorErrors equal', () => {
            const actual = new Error('A file system error');
            const expected = new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR', 'A file system error'
            );

            expect(actual).not.toEqual(expected);
        });

        it('should not consider objects that quack like instances of SwaggerMockValidatorErrors equal', () => {
            const actual = {
                code: 'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                message: 'A file system error'
            };
            const expected = new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR', 'A file system error'
            );

            expect(actual).not.toEqual(expected);
        });

        it('should find not equal two SwaggerMockValidatorError objects with different code', () => {
            const actual = new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR', 'the error message'
            );
            const expected = new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_PARSE_ERROR', 'the error message'
            );

            expect(actual).not.toEqual(expected);
        });

        it('should find not equal two SwaggerMockValidatorError objects with different message', () => {
            const actual = new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR', 'an error message'
            );
            const expected = new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR', 'a different error message'
            );

            expect(actual).not.toEqual(expected);
        });

        it('should print SwaggerMockValidatorError instances in a human readable format', () => {
            const error = new SwaggerMockValidatorErrorImpl('SWAGGER_MOCK_VALIDATOR_READ_ERROR', 'An error occurred');

            expect(error.toString()).toBe(
                'SwaggerMockValidatorError: { code: SWAGGER_MOCK_VALIDATOR_READ_ERROR, message: An error occurred }'
            );
        });

        it('should not break if the message contains sprintf escape sequences', () => {
            const error = new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR', 'A message with %some %percents'
            );

            expect(error.message).toBe('A message with %some %percents');
        });
    });
});
