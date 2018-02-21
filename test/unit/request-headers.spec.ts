import * as _ from 'lodash';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {swaggerBuilder} from './support/swagger-builder';
import {operationBuilder} from './support/swagger-builder/operation-builder';
import {ParameterBuilder} from './support/swagger-builder/parameter-builder';
import {
    requestHeaderParameterBuilder
} from './support/swagger-builder/parameter-builder/request-header-parameter-builder';
import {pathBuilder} from './support/swagger-builder/path-builder';
import {swaggerMockValidatorLoader} from './support/swagger-mock-validator-loader';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('request headers', () => {
    const expectedFailedValidationError = 'Mock file "pact.json" is not compatible with swagger file "swagger.json"';
    const defaultInteractionBuilder = interactionBuilder
        .withDescription('interaction description')
        .withRequestPath('/does/exist')
        .withResponseStatus(200);

    const defaultOperationBuilder = operationBuilder
        .withProduces(['text/plain'])
        .withConsumes(['application/x-www-form-urlencoded']);

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    const validateRequestHeaders = (swaggerHeaderParameter?: ParameterBuilder,
                                    pactRequestHeaders?: { [name: string]: string }) => {
        let interaction = defaultInteractionBuilder;

        _.each(pactRequestHeaders as { [name: string]: string }, (headerValue, headerName) => {
            if (!headerName) {
                return;
            }
            interaction = interaction.withRequestHeader(headerName, headerValue);
        });

        const pactFile = pactBuilder.withInteraction(interaction).build();

        const operation = swaggerHeaderParameter
            ? defaultOperationBuilder.withParameter(swaggerHeaderParameter)
            : defaultOperationBuilder;

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder.withGetOperation(operation))
            .build();

        return swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);
    };

    it('should pass when the pact request header matches the spec', async () => {
        const requestHeaders = {'x-custom-header': '1'};
        const headerParameter = requestHeaderParameterBuilder.withRequiredNumberNamed('x-custom-header');

        const result = await validateRequestHeaders(headerParameter, requestHeaders);

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should return the error when the pact request header does not match the spec', async () => {
        const requestHeaders = {'x-custom-header': 'not-a-number'};
        const headerParameter = requestHeaderParameterBuilder.withRequiredNumberNamed('x-custom-header');

        const result = await validateRequestHeaders(headerParameter, requestHeaders);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'spv.request.header.incompatible',
            message: 'Value is incompatible with the parameter defined in the swagger file: should be number',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[pactRoot].interactions[0].request.headers.x-custom-header',
                mockFile: 'pact.json',
                value: 'not-a-number'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[swaggerRoot].paths./does/exist.get.parameters[0]',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'swagger.json',
                value: headerParameter.build()
            },
            type: 'error'
        }]);
    });

    it('should return the error when a pact request header does not match an array type', async () => {
        const requestHeaders = {'x-custom-header': '1,2,a'};
        const headerParameter = requestHeaderParameterBuilder.withRequiredArrayOfNumbersNamed('x-custom-header');

        const result = await validateRequestHeaders(headerParameter, requestHeaders);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'spv.request.header.incompatible',
            message: 'Value is incompatible with the parameter defined in the swagger file: should be number',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[pactRoot].interactions[0].request.headers.x-custom-header',
                mockFile: 'pact.json',
                value: '1,2,a'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[swaggerRoot].paths./does/exist.get.parameters[0]',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'swagger.json',
                value: headerParameter.build()
            },
            type: 'error'
        }]);
    });

    it('should pass when the pact request header is missing and the spec defines it as optional', async () => {
        const headerParameter = requestHeaderParameterBuilder.withOptionalNumberNamed('x-custom-header');

        const result = await validateRequestHeaders(headerParameter, {});

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should fail when the pact request header is missing and the spec defines it as required', async () => {
        const headerParameter = requestHeaderParameterBuilder.withRequiredNumberNamed('x-custom-header');

        const result = await validateRequestHeaders(headerParameter, {});

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'spv.request.header.incompatible',
            message: 'Value is incompatible with the parameter defined in the swagger file: ' +
            'should have required property \'value\'',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[pactRoot].interactions[0]',
                mockFile: 'pact.json',
                value: defaultInteractionBuilder.build()
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[swaggerRoot].paths./does/exist.get.parameters[0]',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'swagger.json',
                value: headerParameter.build()
            },
            type: 'error'
        }]);
    });

    it('should return a warning when a pact request header is defined that is not in the spec', async () => {
        const requestHeaders = {'x-custom-header': 'value'};

        const result = await validateRequestHeaders(undefined, requestHeaders);

        expect(result).toContainNoErrors();
        expect(result).toContainWarnings([{
            code: 'spv.request.header.unknown',
            message: 'Request header is not defined in the swagger file: x-custom-header',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[pactRoot].interactions[0].request.headers.x-custom-header',
                mockFile: 'pact.json',
                value: 'value'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[swaggerRoot].paths./does/exist.get',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'swagger.json',
                value: defaultOperationBuilder.build()
            },
            type: 'warning'
        }]);
    });

    it('should pass when pact request headers not defined in the spec are standard http headers', async () => {
        const requestHeaders = {
            'Accept': 'text/plain',
            'Accept-Charset': 'utf-8',
            'Accept-Datetime': 'Thu, 31 May 2007 20:35:00 GMT',
            'Accept-Encoding': 'gzip',
            'Accept-Language': 'en-US',
            'Authorization': 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Length': '348',
            'Content-MD5': 'Q2hlY2sgSW50ZWdyaXR5IQ==',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': '$Version=1',
            'Date': 'Tue, 15 Nov 1994 08:12:31 GMT',
            'Expect': '100-continue',
            'Forwarded': 'for=192.0.2.60;proto=http;by=203.0.113.43 Forwarded: for=192.0.2.43, for=198.51.100.17',
            'From': 'user@example.com',
            'Host': 'en.wikipedia.org:8080',
            'If-Match': '"737060cd8c284d8af7ad3082f209582d"',
            'If-Modified-Since': 'Sat, 29 Oct 1994 19:43:31 GMT',
            'If-None-Match': '"737060cd8c284d8af7ad3082f209582d"',
            'If-Range': '"737060cd8c284d8af7ad3082f209582d"',
            'If-Unmodified-Since': 'Sat, 29 Oct 1994 19:43:31 GMT',
            'Max-Forwards': '10',
            'Origin': 'http://www.example-social-network.com',
            'Pragma': 'no-cache',
            'Proxy-Authorization': 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==',
            'Range': 'bytes=500-999',
            'Referer': 'http://en.wikipedia.org/wiki/Main_Page',
            'TE': 'trailers, deflate',
            'Upgrade': 'HTTP/2.0, HTTPS/1.3, IRC/6.9, RTA/x11, websocket',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/21.0',
            'Via': '1.0 fred, 1.1 example.com (Apache/1.1)',
            'Warning': '199 Miscellaneous warning'
        };

        const result = await validateRequestHeaders(undefined, requestHeaders);

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should not be case sensitive when comparing mock and spec headers', async () => {
        const requestHeaders = {'content-Type': 'application/x-www-form-urlencoded', 'x-Custom-header': '1'};
        const headerParameter = requestHeaderParameterBuilder.withRequiredNumberNamed('X-custom-header');

        const result = await validateRequestHeaders(headerParameter, requestHeaders);

        expect(result).toContainNoWarningsOrErrors();
    });
});
