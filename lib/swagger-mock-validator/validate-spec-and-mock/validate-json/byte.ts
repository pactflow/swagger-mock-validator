import validator from 'validator';

export const isByte = (rawValue: string) => {
    return validator.isBase64(rawValue);
};
