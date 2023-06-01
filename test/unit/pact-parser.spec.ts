import { pactParser } from '../../lib/swagger-mock-validator/mock-parser/pact/pact-parser';
import type { Pact } from '../../lib/swagger-mock-validator/mock-parser/pact/pact';

describe('pact-parser', () => {
    it('should convert V3 formatted headers to v1 headers', () => {
        const pactJson = {
            consumer: {
                name: 'ExampleConsumer',
            },
            interactions: [
                {
                    name: 'sdfsdfsdf',
                    description: 'a request to retrieve a product with existing id',
                    request: {
                        headers: {
                            'Content-Type': ['text/json'],
                            Accept: ['text/plain', 'application/json', 'text/json'],
                        },
                        method: 'GET',
                        path: '/products/27',
                    },
                    response: {
                        body: {
                            id: 27,
                            name: 'burger',
                            type: 'food',
                        },
                        headers: {
                            'Content-Type': ['application/json'],
                        },
                        status: 200,
                    },
                },
            ],
            provider: {
                name: 'ExampleProvider',
            },
        };

        const pact = pactParser.parse(pactJson as unknown as Pact, 'sdfsdf');
        expect(pact.interactions[0].requestHeaders.Accept.value).toEqual('text/plain,application/json,text/json');
        expect(pact.interactions[0].requestHeaders['Content-Type'].value).toEqual('text/json');
    });

    it("should filter out interactions that have a type defined other than 'Synchronous/HTTP'", () => {
        const pactJson = {
            consumer: {
                name: 'ExampleConsumer',
            },
            interactions: [
                {
                    name: 'no type defined pre pactv4 spec',
                    description: 'a request to retrieve a product with existing id',
                    request: {
                        method: 'GET',
                        path: '/products/27',
                    },
                    response: {
                        status: 200,
                    },
                },
                {
                    name: 'Synchronous/HTTP defined',
                    type: 'Synchronous/HTTP',
                    description: 'a request to retrieve a product with existing id',
                    request: {
                        method: 'GET',
                        path: '/products/27',
                    },
                    response: {
                        status: 200,
                    },
                },
                {
                    name: 'different type defined',
                    type: 'Asynchronous/Messages',
                    description: 'a request to retrieve a product with existing id',
                    request: {
                        method: 'GET',
                        path: '/products/27',
                    },
                    response: {
                        status: 200,
                    },
                },
            ],
            provider: {
                name: 'ExampleProvider',
            },
        };

        const pact = pactParser.parse(pactJson as unknown as Pact, 'sdfsdf');
        expect(pact.interactions.length).toEqual(2);
    });

    it('should parse V4 body types', () => {
        const pactJson = {
            consumer: {
                name: 'ExampleConsumer',
            },
            interactions: [
                {
                    name: 'JSON response',
                    description: 'a request to retrieve a product with existing id',
                    request: {
                        method: 'GET',
                        path: '/products/27',
                    },
                    response: {
                        status: 200,
                        body: {
                            encoded: false,
                            contents: { hello: 'world' },
                        },
                    },
                },
                {
                    name: 'encoded JSON response',
                    description: 'a request to retrieve a product with existing id',
                    request: {
                        method: 'GET',
                        path: '/products/27',
                    },
                    response: {
                        status: 200,
                        body: {
                            encoded: 'JSON',
                            contents: '{ "hello": "world" }',
                        },
                    },
                },
                {
                    name: 'encoded string response',
                    description: 'a request to retrieve a product with existing id',
                    request: {
                        method: 'GET',
                        path: '/products/27',
                    },
                    response: {
                        status: 200,
                        body: {
                            encoded: 'base64',
                            contents: 'aGVsbG8gd29ybGQ=',
                        },
                    },
                },
                {
                    name: 'JSON response',
                    description: 'a request to update a product with existing id',
                    request: {
                        method: 'POST',
                        path: '/products/27',
                        body: {
                            encoded: false,
                            contents: { hello: 'world' },
                        },
                    },
                    response: {
                        status: 200,
                    },
                },
                {
                    name: 'encoded JSON response',
                    description: 'a request to update a product with existing id',
                    request: {
                        method: 'POST',
                        path: '/products/27',
                        body: {
                            encoded: 'JSON',
                            contents: '{ "hello": "world" }',
                        },
                    },
                    response: {
                        status: 200,
                    },
                },
                {
                    name: 'encoded string response',
                    description: 'a request to update a product with existing id',
                    request: {
                        method: 'POST',
                        path: '/products/27',
                        body: {
                            encoded: 'base64',
                            contents: 'aGVsbG8gd29ybGQ=',
                        },
                    },
                    response: {
                        status: 200,
                    },
                },
            ],
            provider: {
                name: 'ExampleProvider',
            },
            metadata: {
                pactSpecification: {
                    version: '4.0.0',
                },
            },
        };

        const pact = pactParser.parse(pactJson as unknown as Pact, 'sdfsdf');

        expect(pact.interactions[0].responseBody.value).toEqual({ hello: 'world' });
        expect(pact.interactions[1].responseBody.value).toEqual({ hello: 'world' });
        expect(pact.interactions[2].responseBody.value).toEqual('hello world');

        expect(pact.interactions[3].requestBody.value).toEqual({ hello: 'world' });
        expect(pact.interactions[4].requestBody.value).toEqual({ hello: 'world' });
        expect(pact.interactions[5].requestBody.value).toEqual('hello world');
    });
});
