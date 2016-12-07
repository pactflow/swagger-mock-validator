import * as _ from 'lodash';
import * as q from 'q';
import jsonLoader from './swagger-pact-validator/json-loader';
import defaultFileSystem from './swagger-pact-validator/json-loader/file-system';
import defaultHttpClient from './swagger-pact-validator/json-loader/http-client';
import mockParser from './swagger-pact-validator/mock-parser';
import resolveSwagger from './swagger-pact-validator/resolve-swagger';
import specParser from './swagger-pact-validator/spec-parser';
import {FileSystem, HttpClient, SwaggerPactValidator} from './swagger-pact-validator/types';
import validateSwagger from './swagger-pact-validator/validate-swagger';
import validateSwaggerAndPact from './swagger-pact-validator/validate-swagger-and-pact';

const createLoadJsonFunction = (fileSystem: FileSystem, httpClient: HttpClient) =>
    (pathOrUrl: string) => jsonLoader.load(pathOrUrl, fileSystem || defaultFileSystem, httpClient || defaultHttpClient);

const swaggerPactValidator: SwaggerPactValidator = {
    validate: (options) => {
        const loadJson = createLoadJsonFunction(options.fileSystem, options.httpClient);

        const whenSwaggerJson = loadJson(options.swaggerPathOrUrl);

        const whenSwaggerValidationResults = whenSwaggerJson
            .then((swaggerJson) => validateSwagger(swaggerJson, options.swaggerPathOrUrl));

        const whenParsedPact = loadJson(options.pactPathOrUrl)
            .then((pactJson) => mockParser.parsePact(pactJson, options.pactPathOrUrl));

        const whenParsedSwagger = whenSwaggerValidationResults
            .thenResolve(whenSwaggerJson)
            .then(resolveSwagger)
            .then((swaggerJson) => specParser.parseSwagger(swaggerJson, options.swaggerPathOrUrl));

        const whenSwaggerPactValidationResults =
            q.all([whenParsedPact, whenParsedSwagger]).spread(validateSwaggerAndPact);

        return q.all([whenSwaggerValidationResults, whenSwaggerPactValidationResults])
            .spread((swaggerValidationResults, swaggerPactValidationResults) => (
                {warnings: _.concat([], swaggerValidationResults.warnings, swaggerPactValidationResults.warnings)}
            )
        );
    }
};

export default swaggerPactValidator;
