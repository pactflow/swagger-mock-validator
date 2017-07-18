import * as uuid from 'uuidjs';
import {UuidGenerator} from './types';

const uuidGenerator: UuidGenerator = {
    generate: () => uuid.generate()
};

export default uuidGenerator;
