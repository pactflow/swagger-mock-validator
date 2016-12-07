import * as q from 'q';
import * as swaggerTools from 'swagger-tools';
import {Swagger} from './types';

export default (document: any): q.Promise<Swagger> => {
    const deferred = q.defer<Swagger>();

    swaggerTools.specs.v2.resolve(document, (error, parsedDocument) => {
        if (error) {
            deferred.reject(error);
        } else {
            deferred.resolve(parsedDocument);
        }
    });

    return deferred.promise;
};
