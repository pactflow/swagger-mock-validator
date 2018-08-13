import {Swagger2Parameter} from '../../../../lib/swagger-mock-validator/spec-parser/swagger2/swagger2';

export interface ParameterBuilder {
    build: () => Swagger2Parameter;
}
