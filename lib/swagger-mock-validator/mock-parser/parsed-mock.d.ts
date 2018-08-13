export interface ParsedMock {
    consumer: string;
    interactions: ParsedMockInteraction[];
    pathOrUrl: string;
    provider: string;
}

export interface ParsedMockInteraction extends ParsedMockValue<any> {
    description: string;
    getRequestBodyPath: (path: string) => ParsedMockValue<any>;
    getResponseBodyPath: (path: string) => ParsedMockValue<any>;
    requestBody: ParsedMockValue<any>;
    requestHeaders: ParsedMockValueCollection;
    requestMethod: ParsedMockValue<string>;
    requestPath: ParsedMockValue<string>;
    requestPathSegments: Array<ParsedMockValue<string>>;
    requestQuery: ParsedMockValueCollection;
    responseBody: ParsedMockValue<any>;
    responseHeaders: ParsedMockValueCollection;
    responseStatus: ParsedMockValue<number>;
    mockFile: string;
    state: string;
}

export interface ParsedMockValueCollection {
    [name: string]: ParsedMockValue<string>;
}

export interface ParsedMockValue<T> {
    location: string;
    parentInteraction: ParsedMockInteraction;
    value: T;
}
