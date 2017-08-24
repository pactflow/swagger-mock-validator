import * as SwaggerMockValidator from './api-types';
import {validateSpecAndMockContent} from './swagger-mock-validator';

const swaggerMockValidator: typeof SwaggerMockValidator = {
    validate: async (options) => {
        const result = await validateSpecAndMockContent(options);
        return result.validationOutcome;
    }
};

export = swaggerMockValidator;
