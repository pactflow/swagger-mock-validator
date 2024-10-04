
export const isOpenApi3Content = (specContent: any): boolean => {
    const openapiProperty = specContent.openapi;
    return typeof openapiProperty === "string" && openapiProperty.indexOf('3.') === 0;
};
