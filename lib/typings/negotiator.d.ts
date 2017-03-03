declare module 'negotiator' {
    interface Headers {
        accept: string;
    }

    interface Request {
        headers: Headers;
    }

    class NegotiatorStatic {
        constructor(request: Request);
        public mediaTypes(produces: string[]): string[];
    }

    export = NegotiatorStatic;
}
