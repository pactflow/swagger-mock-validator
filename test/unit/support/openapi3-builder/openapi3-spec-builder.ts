import {Openapi3Schema, Paths as Openapi3Paths} from '../../../../lib/swagger-mock-validator/openapi3';
import {OpenApi3PathItemBuilder} from './openapi3-path-item-builder';

interface Paths {
    [pathName: string]: OpenApi3PathItemBuilder;
}

interface Openapi3SpecBuilderState {
    paths: Paths;
}

export class OpenApi3SpecBuilder {
    public static defaultOpenApi3SpecBuilder(): OpenApi3SpecBuilder {
        return new OpenApi3SpecBuilder({paths: {}});
    }
    private constructor(private readonly state: Openapi3SpecBuilderState) {}

    public build(): Openapi3Schema {
        const paths = Object.keys(this.state.paths).reduce<Openapi3Paths>((openApi3Paths, currentPath) => {
            openApi3Paths[currentPath] = this.state.paths[currentPath].build();
            return openApi3Paths;
        }, {});

        return {
            info: {
                title: 'spec title',
                version: 'spec version'
            },
            openapi: '3.0.0',
            paths
        };
    }

    public withPath(pathName: string, pathItem: OpenApi3PathItemBuilder): OpenApi3SpecBuilder {
        const copyOfPaths = {...this.state.paths};
        copyOfPaths[pathName] = pathItem;
        return new OpenApi3SpecBuilder({...this.state, paths: copyOfPaths});
    }

    public withNoPaths(): OpenApi3SpecBuilder {
        return new OpenApi3SpecBuilder({...this.state, paths: {}});
    }
}

export const openApi3SpecBuilder = OpenApi3SpecBuilder.defaultOpenApi3SpecBuilder();
