import * as uuid from 'uuidjs';

export class UuidGenerator {
    public generate(): string {
        return uuid.generate();
    }
}
