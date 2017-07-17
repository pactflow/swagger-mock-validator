import * as q from 'q';
import * as SwaggerParser from 'swagger-parser';
import {Swagger} from './types';

export default (document: any): q.Promise<Swagger> => {
    return q(SwaggerParser.validate(document, {
        $refs: {
            circular: 'ignore'
        }
    }));
};
