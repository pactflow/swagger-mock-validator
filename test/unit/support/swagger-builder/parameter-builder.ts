import {SwaggerParameter} from '../../../../lib/swagger-pact-validator/types';

export interface ParameterBuilder {
    build: () => SwaggerParameter;
}
