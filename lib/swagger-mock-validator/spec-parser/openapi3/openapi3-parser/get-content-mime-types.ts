import {Content} from '../openapi3';

export const getContentMimeTypes = (content: Content | undefined): string[] =>
    content ? Object.keys(content) : [];
