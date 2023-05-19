"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTypesOfJson = exports.isMediaTypeSupported = exports.normalizeMediaType = exports.areMediaTypesCompatible = void 0;
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
exports.areMediaTypesCompatible = areMediaTypesCompatible;
const normalizeMediaType = (mediaType) => {
    return mediaType
        .split(PARAMETER_SEPARATOR)[0]
        .toLowerCase()
        .trim();
};
exports.normalizeMediaType = normalizeMediaType;
const isMediaTypeSupported = (actualMediaType, supportedMediaTypes) => {
    const normalizedActualMediaType = (0, exports.normalizeMediaType)(actualMediaType);
    return supportedMediaTypes.some((supportedMediaType) => {
        const normalizedSupportedMediaType = (0, exports.normalizeMediaType)(supportedMediaType);
        return (0, exports.areMediaTypesCompatible)(normalizedActualMediaType, normalizedSupportedMediaType);
    });
};
exports.isMediaTypeSupported = isMediaTypeSupported;
const isTypesOfJson = (supportedMediaTypes) => {
    return supportedMediaTypes.some((supportedMediaType) => {
        const mediaType = (0, exports.normalizeMediaType)(supportedMediaType);
        return mediaType.startsWith('application/') && mediaType.endsWith('json') || mediaType === '*/*';
    });
};
exports.isTypesOfJson = isTypesOfJson;
