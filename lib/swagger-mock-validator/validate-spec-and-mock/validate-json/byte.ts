import {isBase64} from 'validator';

export const isByte = (rawValue: string) => {
    return isBase64(rawValue);
};
