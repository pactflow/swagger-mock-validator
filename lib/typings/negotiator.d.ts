interface Headers {
    accept: string;
}

interface Request {
    headers: Headers;
}

declare class NegotiatorStatic {
    constructor(request: Request);
    public mediaTypes(produces: string[]): string[];
}

declare module 'negotiator' {
    export = NegotiatorStatic;
}
