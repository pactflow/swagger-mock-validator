import * as uuid from 'uuidjs';
import {UuidGenerator} from './types';

export const defaultUuidGenerator: UuidGenerator = {
    generate: () => uuid.generate()
};
