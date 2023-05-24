const PARAMETER_SEPARATOR = ';';
const WILDCARD = '*';
const TYPE_SUBTYPE_SEPARATOR = '/';
const EXTENSION_SEPARATOR = '+';

const quality = (a: string): number => {
    const match = /.*;q=([01].?\d*)/.exec(a);
    return match ? parseFloat(match[1]) : 1.0;
};

const byQuality = (a: string, b: string): number => {
    return quality(b) - quality(a);
};
const ignoreCasing = (t: string): string => t.toLowerCase();
const ignoreWhitespace = (t: string): string => t.replace(/\s+/g, '');
const ignoreParameters = (t: string): string => t.split(PARAMETER_SEPARATOR)[0];
const removeQuality = (t: string): string => t.replace(/;q=[01].?\d*/, '');
const type = (t: string): string => t.split(TYPE_SUBTYPE_SEPARATOR)[0];
const subtype = (t: string): string | undefined => {
    const [_, subtype] = t.split(TYPE_SUBTYPE_SEPARATOR);
    return subtype?.split(EXTENSION_SEPARATOR).pop();
};

export function findMatchingType(requestType: string, responseTypes: string[]): string | undefined {
    // exact match
    let accept = requestType.split(',').map(ignoreWhitespace).map(ignoreCasing).sort(byQuality).map(removeQuality);
    let available = responseTypes.map(ignoreWhitespace).map(ignoreCasing);
    for (const a of accept) {
        const matchExactly = (t: string): boolean => t === a;
        const index = available.findIndex(matchExactly);
        if (index >= 0) {
            return responseTypes[index];
        }
    }

    // ignore additional parameters
    accept = accept.map(ignoreParameters);
    for (const a of accept) {
        const matchExactly = (t: string): boolean => t === a;
        const index = available.findIndex(matchExactly);
        if (index >= 0) {
            return responseTypes[index];
        }
    }

    // ignore vendor extensions
    for (const a of accept) {
        const matchTypesAndSubtypes = (t: string): boolean => type(t) === type(a) && subtype(t) === subtype(a);
        const index = available.findIndex(matchTypesAndSubtypes);
        if (index >= 0) {
            return responseTypes[index];
        }
    }

    // wildcards in responseTypes
    available = available.map(ignoreParameters);
    for (const a of accept) {
        const matchSubtype = (t: string): boolean => subtype(t) === WILDCARD && type(t) === type(a);
        const index = available.findIndex(matchSubtype);
        if (index >= 0) {
            return responseTypes[index];
        }
    }
    if (available.includes(`${WILDCARD}/${WILDCARD}`)) {
        return `${WILDCARD}/${WILDCARD}`;
    }

    // wildcards in requestTypes
    for (const a of accept) {
        const matchSubtype = (t: string): boolean => subtype(a) === WILDCARD && type(t) === type(a);
        const index = available.findIndex(matchSubtype);
        if (index >= 0) {
            return responseTypes[index];
        }
    }
    if (accept.includes(`${WILDCARD}/${WILDCARD}`)) {
        return responseTypes[0];
    }

    // legacy fallback behaviour
    if (available.includes('application/json')) {
        return 'application/json';
    }

    return undefined;
}

export const isTypesOfJson = (supportedMediaTypes: string[]): boolean => {
    return !!findMatchingType('application/json', supportedMediaTypes);
};
