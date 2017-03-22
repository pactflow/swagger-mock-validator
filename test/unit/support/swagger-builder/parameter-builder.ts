import {SwaggerParameter} from '../../../../lib/swagger-mock-validator/types';

export interface ParameterBuilder {
    build: () => SwaggerParameter;
}
