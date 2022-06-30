import * as _ from 'lodash';
import { pactParser } from '../../lib/swagger-mock-validator/mock-parser/pact/pact-parser';
import { validateAndResolvePact } from '../../lib/swagger-mock-validator/validate-and-resolve-pact';

describe('pact-parser', () => {
    it('should convert V3 formatted headers to v1 headers', () => {
        const pactV3Json = {
            'consumer': {
                'name': 'ExampleConsumer'
            },
            'interactions': [
                {
                    'name': 'sdfsdfsdf',
                    'description': 'a request to retrieve a product with existing id',
                    'request': {
                        'headers': {
                            'Content-Type': ['text/json'],
                            'Accept': ['text/plain', 'application/json', 'text/json']
                        },
                        'method': 'GET',
                        'path': '/products/27'
                    },
                    'response': {
                        'body': {
                            'id': 27,
                            'name': 'burger',
                            'type': 'food'
                        },
                        'headers': {
                            'Content-Type': ['application/json']
                        },
                        'status': 200
                    }
                }
            ],
            'provider': {
                'name': 'ExampleProvider'
            }
        }

        const resolvedPact = validateAndResolvePact(pactV3Json, '../../pact_examples/pact.json');


        const pact = pactParser.parse(resolvedPact, 'sdfsdf')
        expect(pact.interactions[0].requestHeaders.Accept.value).toEqual('text/plain,application/json,text/json')
        expect(pact.interactions[0].requestHeaders['Content-Type'].value).toEqual('text/json')
    });

    it('should filter out interactions that have a type defined other than "Synchronous/HTTP"', () => {

        const pactV4Json = {
            'consumer': {
                'name': 'ExampleConsumer'
            },
            'interactions': [
                {
                    'name': 'no type defined pre pactv4 spec',
                    'description': 'a request to retrieve a product with existing id',
                    'request': {
                        'method': 'GET',
                        'path': '/products/27'
                    },
                    'response': {
                        'status': 200
                    }
                },
                {
                    'name': 'Synchronous/HTTP defined',
                    "type": "Synchronous/HTTP",
                    'description': 'a request to retrieve a product with existing id',
                    'request': {
                        'method': 'GET',
                        'path': '/products/27'
                    },
                    'response': {
                        'status': 200
                    }
                },
                {
                    'name': 'different type defined',
                    "type": "Asynchronous/Messages",
                    'description': 'a request to retrieve a product with existing id',
                    'request': {
                        'method': 'GET',
                        'path': '/products/27'
                    },
                    'response': {
                        'status': 200
                    }
                }
            ],
            'provider': {
                'name': 'ExampleProvider'
            }
        }


        const resolvedPact = validateAndResolvePact(pactV4Json, '../../pact_examples/pact.json');


        const pact = pactParser.parse(resolvedPact, 'sdfsdf')
        expect(pact.interactions.length).toEqual(2)
    });
});