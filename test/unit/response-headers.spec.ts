import * as _ from 'lodash';
import {ValidationResultCode, ValidationResultSource, ValidationResultType} from '../../lib/api-types';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {
    operationBuilder,
    pathBuilder,
    responseBuilder,
    responseHeaderBuilder,
    swaggerBuilder
} from './support/swagger-builder';
import {ResponseBuilder} from './support/swagger-builder/response-builder';
import {swaggerMockValidatorLoader} from './support/swagger-mock-validator-loader';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('response headers', () => {
    const expectedFailedValidationError = 'Mock file "pact.json" is not compatible with swagger file "swagger.json"';
    const defaultInteractionBuilder = interactionBuilder
        .withDescription('interaction description')
        .withRequestPath('/does/exist')
        .withResponseStatus(200);

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    const validateResponseHeaders = (swaggerResponseBuilder?: ResponseBuilder,
                                     pactResponseHeaders?: { [name: string]: string }) => {
        let interaction = defaultInteractionBuilder;

        _.each(pactResponseHeaders as { [name: string]: string }, (headerValue, headerName) => {
            if (!headerName) {
                return;
            }
            interaction = interaction.withResponseHeader(headerName, headerValue);
        });

        const pactFile = pactBuilder.withInteraction(interaction).build();

        const response = swaggerResponseBuilder || responseBuilder;

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder.withGetOperation(operationBuilder.withResponse(200, response)))
            .withProduces(['application/json'])
            .build();

        return swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);
    };

    it('should pass when the pact response header matches the spec', async () => {
        const pactResponseHeaders = {'x-custom-header': '1'};
        const responseSpec = responseBuilder.withHeader('x-custom-header', responseHeaderBuilder.withNumber());

        const result = await validateResponseHeaders(responseSpec, pactResponseHeaders);
        expect(result).toContainNoWarningsOrErrors();
    });

    it('should return the error when the pact response header does not match the spec', async () => {
        const pactResponseHeaders = {'x-custom-header': 'not-a-number'};
        const responseHeaderSpec = responseHeaderBuilder.withNumber();
        const responseSpec = responseBuilder.withHeader('x-custom-header', responseHeaderSpec);

        const result = await validateResponseHeaders(responseSpec, pactResponseHeaders);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'spv.response.header.incompatible',
            message: 'Value is incompatible with the parameter defined in the swagger file: should be number',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[pactRoot].interactions[0].response.headers.x-custom-header',
                mockFile: 'pact.json',
                value: 'not-a-number'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-custom-header',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'swagger.json',
                value: responseHeaderSpec.build()
            },
            type: 'error'
        }]);
    });

    it('should return the error when the pact response header does not match the array spec', async () => {
        const pactResponseHeaders = {'x-custom-header': '1,2,a'};
        const responseHeaderSpec = responseHeaderBuilder.withArrayOfNumber();
        const responseSpec = responseBuilder.withHeader('x-custom-header', responseHeaderSpec);

        const result = await validateResponseHeaders(responseSpec, pactResponseHeaders);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'spv.response.header.incompatible',
            message:
                'Value is incompatible with the parameter defined in the swagger file: should be number',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[pactRoot].interactions[0].response.headers.x-custom-header',
                mockFile: 'pact.json',
                value: '1,2,a'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-custom-header',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'swagger.json',
                value: responseHeaderSpec.build()
            },
            type: 'error'
        }]);
    });

    it('should pass when the pact response header is missing and the spec defines it', async () => {
        const responseSpec = responseBuilder.withHeader('x-custom-header', responseHeaderBuilder.withNumber());

        const result = await validateResponseHeaders(responseSpec);
        expect(result).toContainNoWarningsOrErrors();
    });

    it('should fail when a pact response header is defined that is not in the spec', async () => {
        const requestHeaders = {'x-custom-header': 'value'};

        const result = await validateResponseHeaders(undefined, requestHeaders);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'spv.response.header.unknown',
            message: 'Response header is not defined in the swagger file: x-custom-header',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[pactRoot].interactions[0].response.headers.x-custom-header',
                mockFile: 'pact.json',
                value: 'value'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[swaggerRoot].paths./does/exist.get.responses.200',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'swagger.json',
                value: responseBuilder.build()
            },
            type: 'error'
        }]);
    });

    it('should warn when pact response headers not defined in the spec are standard http headers', async () => {
        const pactResponseHeaders = {
            'Accept-Patch': 'text/example;charset=utf-8',
            'Accept-Ranges': 'bytes',
            'Access-Control-Allow-Origin': '*',
            'Age': '12',
            'Allow': 'GET, HEAD',
            'Alt-Svc': 'h2="http2.example.com:443"; ma=7200',
            'Cache-Control': 'max-age=3600',
            'Connection': 'close',
            'Content-Disposition': 'attachment; filename="fname.ext"',
            'Content-Encoding': 'gzip',
            'Content-Language': 'da',
            'Content-Length': '348',
            'Content-Location': '/index.htm',
            'Content-MD5': 'Q2hlY2sgSW50ZWdyaXR5IQ==',
            'Content-Range': 'bytes 21010-47021/47022',
            'Date': 'Tue, 15 Nov 1994 08:12:31 GMT',
            'ETag': '"737060cd8c284d8af7ad3082f209582d"',
            'Expires': 'Thu, 01 Dec 1994 16:00:00 GMT',
            'Last-Modified': 'Tue, 15 Nov 1994 12:45:26 GMT',
            'Link': '</feed>; rel="alternate"[36]',
            'Location': 'http://www.w3.org/pub/WWW/People.html',
            'P3P': 'CP="This is not a P3P policy!"',
            'Pragma': 'no-cache',
            'Proxy-Authenticate': 'Basic',
            'Public-Key-Pins': 'max-age=2592000; pin-sha256="E9CZ9INDbd+2eRQozYqqbQ2yXLVKB9+xcprMF+44U1g=";',
            'Refresh': '5; url=http://www.w3.org/pub/WWW/People.html',
            'Retry-After': '120',
            'Server': 'Apache/2.4.1 (Unix)',
            'Set-Cookie': 'UserID=JohnDoe; Max-Age=3600; Version=1',
            'Status': '200 OK',
            'Strict-Transport-Security': 'max-age=16070400; includeSubDomains',
            'TSV': '?',
            'Trailer': 'Max-Forwards',
            'Transfer-Encoding': 'chunked',
            'Upgrade': 'HTTP/2.0, HTTPS/1.3, IRC/6.9, RTA/x11, websocket',
            'Vary': '*',
            'Via': '1.0 fred, 1.1 example.com (Apache/1.1)',
            'WWW-Authenticate': 'Basic',
            'Warning': '199 Miscellaneous warning',
            'X-Frame-Options': 'deny'
        };

        const result = await validateResponseHeaders(undefined, pactResponseHeaders);
        const warnings = _.map(pactResponseHeaders, (headerValue: string, headerName: string) => ({
            code: 'spv.response.header.undefined' as ValidationResultCode,
            message:
                `Standard http response header is not defined in the swagger file: ${headerName.toLowerCase()}`,
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: `[pactRoot].interactions[0].response.headers.${headerName}`,
                mockFile: 'pact.json',
                value: headerValue
            },
            source: 'spec-mock-validation' as ValidationResultSource,
            specDetails: {
                location: '[swaggerRoot].paths./does/exist.get.responses.200',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'swagger.json',
                value: responseBuilder.build()
            },
            type: 'warning' as ValidationResultType
        }));

        expect(result).toContainNoErrors();
        expect(result).toContainWarnings(warnings);
    });

    it('should pass when pact mocks out the content type header', async () => {
        const requestHeaders = {'Content-Type': 'application/json'};

        const result = await validateResponseHeaders(undefined, requestHeaders);

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should not be case sensitive when comparing mock and spec response headers', async () => {
        const pactResponseHeaders = {'content-Type': 'application/json', 'X-Custom-Header': '1'};
        const responseSpec = responseBuilder.withHeader('X-custom-header', responseHeaderBuilder.withNumber());

        const result = await validateResponseHeaders(responseSpec, pactResponseHeaders);

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should validate headers of default responses in the spec', async () => {
        const pactFile = pactBuilder
            .withInteraction(defaultInteractionBuilder
                .withResponseStatus(201)
                .withResponseHeader('x-custom-header', 'not-a-number'))
            .build();

        const responseHeader = responseHeaderBuilder.withNumber();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder
                    .withDefaultResponse(responseBuilder.withHeader('x-custom-header', responseHeader))
                )
            )
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'spv.response.header.incompatible',
            message: 'Value is incompatible with the parameter defined in the swagger file: should be number',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[pactRoot].interactions[0].response.headers.x-custom-header',
                mockFile: 'pact.json',
                value: 'not-a-number'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[swaggerRoot].paths./does/exist.get.responses.default.headers.x-custom-header',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'swagger.json',
                value: responseHeader.build()
            },
            type: 'error'
        }]);
    });
});
