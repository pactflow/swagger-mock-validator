import { UUID } from 'uuidjs';

export class UuidGenerator {
    public generate(): string {
        return UUID.generate()
    }
}
