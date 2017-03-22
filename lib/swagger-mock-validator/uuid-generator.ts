import * as uuid from 'uuid';
import {UuidGenerator} from './types';

const uuidGenerator: UuidGenerator = {
    generate: () => uuid.v4()
};

export default uuidGenerator;
