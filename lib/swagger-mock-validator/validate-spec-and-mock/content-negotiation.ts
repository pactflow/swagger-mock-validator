const PARAMETER_SEPARATOR = ';';
const WILDCARD = '*';
const TYPE_SUBTYPE_SEPARATOR = '/';

const isWildcard = (type: string): boolean => type === WILDCARD;

const areTypeFragmentsCompatible = (actualTypeFragment: string, supportedTypeFragment: string): boolean => {
    return actualTypeFragment === supportedTypeFragment ||
        isWildcard(actualTypeFragment) ||
        isWildcard(supportedTypeFragment);
};

const parseMediaType = (mediaType: string): { type: string, subtype: string } => {
    const [type, subtype] = mediaType.split(TYPE_SUBTYPE_SEPARATOR);

    return {type, subtype};
};

export const areMediaTypesCompatible = (actualMediaType: string, supportedMediaType: string): boolean => {
    const parsedActualMediaType = parseMediaType(actualMediaType);
    const parsedSupportedMediaType = parseMediaType(supportedMediaType);

    return areTypeFragmentsCompatible(parsedActualMediaType.type, parsedSupportedMediaType.type) &&
        areTypeFragmentsCompatible(parsedActualMediaType.subtype, parsedSupportedMediaType.subtype);
};

export const normalizeMediaType = (mediaType: string): string => {
    return mediaType
        .split(PARAMETER_SEPARATOR)[0]
        .toLowerCase()
        .trim();
};

export const isMediaTypeSupported = (actualMediaType: string, supportedMediaTypes: string[]): boolean => {
    const normalizedActualMediaType = normalizeMediaType(actualMediaType);

    return supportedMediaTypes.some((supportedMediaType) => {
        const normalizedSupportedMediaType = normalizeMediaType(supportedMediaType);

        return areMediaTypesCompatible(normalizedActualMediaType, normalizedSupportedMediaType);
    });
};

export const isTypesOfJson = (supportedMediaTypes: string[]): boolean => {
    return supportedMediaTypes.some((supportedMediaType) => {
        const mediaType = normalizeMediaType(supportedMediaType);
        return mediaType.startsWith("application/") && mediaType.endsWith("json") || mediaType === "*/*";
    });
};
