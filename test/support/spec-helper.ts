import {SwaggerMockValidatorErrorImpl} from '../../lib/swagger-mock-validator/swagger-mock-validator-error-impl';

const swaggerMockValidatorErrorCustomEqualityTester = (actual: any, expected: any): boolean | void => {
    if (expected instanceof SwaggerMockValidatorErrorImpl) {
        return actual instanceof SwaggerMockValidatorErrorImpl
            && actual.code === expected.code
            && actual.message === expected.message;
    }
};

beforeAll(() => {
    jasmine.addCustomEqualityTester(swaggerMockValidatorErrorCustomEqualityTester);
});
