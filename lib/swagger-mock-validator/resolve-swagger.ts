import * as SwaggerParser from 'swagger-parser';
import {Swagger} from './types';

export const resolveSwagger = (document: any): Promise<Swagger> => {
    return SwaggerParser.validate(document, {
        $refs: {
            circular: 'ignore'
        }
    });
};
