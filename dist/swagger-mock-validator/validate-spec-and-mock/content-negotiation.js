"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMediaTypeSupported = void 0;
const PARAMETER_SEPARATOR = ';';
const WILDCARD = '*';
const TYPE_SUBTYPE_SEPARATOR = '/';
const isWildcard = (type) => type === WILDCARD;
const areTypeFragmentsCompatible = (actualTypeFragment, supportedTypeFragment) => {
    return actualTypeFragment === supportedTypeFragment ||
        isWildcard(actualTypeFragment) ||
        isWildcard(supportedTypeFragment);
};
const parseMediaType = (mediaType) => {
    const [type, subtype] = mediaType.split(TYPE_SUBTYPE_SEPARATOR);
    return { type, subtype };
};
const areMediaTypesCompatible = (actualMediaType, supportedMediaType) => {
    const parsedActualMediaType = parseMediaType(actualMediaType);
    const parsedSupportedMediaType = parseMediaType(supportedMediaType);
    return areTypeFragmentsCompatible(parsedActualMediaType.type, parsedSupportedMediaType.type) &&
        areTypeFragmentsCompatible(parsedActualMediaType.subtype, parsedSupportedMediaType.subtype);
};
const normalizeMediaType = (mediaType) => {
    return mediaType
        .split(PARAMETER_SEPARATOR)[0]
        .toLowerCase()
        .trim();
};
exports.isMediaTypeSupported = (actualMediaType, supportedMediaTypes) => {
    const normalizedActualMediaType = normalizeMediaType(actualMediaType);
    return supportedMediaTypes.some((supportedMediaType) => {
        const normalizedSupportedMediaType = normalizeMediaType(supportedMediaType);
        return areMediaTypesCompatible(normalizedActualMediaType, normalizedSupportedMediaType);
    });
};
