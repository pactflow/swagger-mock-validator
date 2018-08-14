// Temporary fix until https://github.com/janl/node-jsonpointer/pull/41 gets merged
declare module 'jsonpointer' {
    interface JSONPointer {
        get(object: object, pointer: string): any;
        set(object: object, pointer: string, value: any): void;
    }
    interface JSONPointerStatic {
        get(object: object, pointer: string): any;
        set(object: object, pointer: string, value: any): void;
        compile(pointer: string): JSONPointer;
    }
    const jsonpointer: JSONPointerStatic;
    export = jsonpointer;
}
