export const isSwagger2Content = (specContent: any): boolean =>
    Object.prototype.hasOwnProperty.call(specContent, 'swagger');
