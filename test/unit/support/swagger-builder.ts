import {
    Swagger,
    SwaggerParameters,
    SwaggerPaths,
    SwaggerSecurityDefinitions,
    SwaggerSecurityRequirement
} from '../../../lib/swagger-mock-validator/types';
import {setIfDefined} from './builder-utilities';
import {DefinitionsBuilder, definitionsBuilder} from './swagger-builder/definitions-builder';
import {ParameterBuilder} from './swagger-builder/parameter-builder';
import {PathBuilder} from './swagger-builder/path-builder';
import {SecuritySchemeBuilder} from './swagger-builder/security-scheme-builder';

interface SwaggerBuilderState {
    basePath: string | undefined;
    consumes: string[] | undefined;
    definitions: DefinitionsBuilder;
    parameters: {[name: string]: ParameterBuilder};
    paths: {[name: string]: PathBuilder};
    produces: string[] | undefined;
    securityDefinitions: {[name: string]: SecuritySchemeBuilder};
    security: SwaggerSecurityRequirement[] | undefined;
    missingInfoTitle: boolean;
}

export class SwaggerBuilder {
    public static defaultSwaggerBuilder(): SwaggerBuilder {
        return new SwaggerBuilder({
            basePath: undefined,
            consumes: undefined,
            definitions: definitionsBuilder,
            missingInfoTitle: false,
            parameters: {},
            paths: {},
            produces: undefined,
            security: undefined,
            securityDefinitions: {}
        });
    }

    private constructor(private readonly state: SwaggerBuilderState) {}

    public withBasePath(basePath: string): SwaggerBuilder {
        return new SwaggerBuilder({...this.state, basePath});
    }

    public withConsumes(consumes: string[]): SwaggerBuilder {
        const copyOfConsumes = [...consumes];
        return new SwaggerBuilder({...this.state, consumes: copyOfConsumes});
    }

    public withProduces(produces: string[]): SwaggerBuilder {
        const copyOfProduces = [...produces];
        return new SwaggerBuilder({...this.state, produces: copyOfProduces});
    }

    public withDefinitions(definitions: DefinitionsBuilder): SwaggerBuilder {
        return new SwaggerBuilder({...this.state, definitions});
    }

    public withParameter(name: string, parameterBuilder: ParameterBuilder): SwaggerBuilder {
        const copyOfParameters = {...this.state.parameters};
        copyOfParameters[name] = parameterBuilder;
        return new SwaggerBuilder({...this.state, parameters: copyOfParameters});
    }

    public withPath(name: string, pathBuilder: PathBuilder): SwaggerBuilder {
        const copyOfPaths = {...this.state.paths};
        copyOfPaths[name] = pathBuilder;
        return new SwaggerBuilder({...this.state, paths: copyOfPaths});
    }

    public withSecurityDefinitionNamed(name: string, securitySchemeBuilder: SecuritySchemeBuilder): SwaggerBuilder {
        const copyOfSecurityDefinitions = {...this.state.securityDefinitions};
        copyOfSecurityDefinitions[name] = securitySchemeBuilder;
        return new SwaggerBuilder({...this.state, securityDefinitions: copyOfSecurityDefinitions});
    }

    public withSecurityRequirementNamed(securityName: string): SwaggerBuilder {
        const currentSecurities = this.state.security || [];
        const copyOfSecurities = [...currentSecurities];
        const securityRequirement: SwaggerSecurityRequirement = {};
        securityRequirement[securityName] = [];
        copyOfSecurities.push(securityRequirement);
        return new SwaggerBuilder({...this.state, security: copyOfSecurities});
    }

    public withMissingInfoTitle(): SwaggerBuilder {
        return new SwaggerBuilder({...this.state, missingInfoTitle: true});
    }

    public build(): Swagger {
        const paths = Object.keys(this.state.paths).reduce<SwaggerPaths>((accumulator, currentPath) => {
            accumulator[currentPath] = this.state.paths[currentPath].build();
            return accumulator;
        }, {});
        const securityDefinitions = Object.keys(this.state.securityDefinitions)
            .reduce<SwaggerSecurityDefinitions>((accumulator, currentDefinition) => {
                accumulator[currentDefinition] = this.state.securityDefinitions[currentDefinition].build();
                return accumulator;
            }, {});
        const parameters = Object.keys(this.state.parameters).reduce<SwaggerParameters>((accumulator, name) => {
            accumulator[name] = this.state.parameters[name].build();
            return accumulator;
        }, {});
        const swagger: Swagger = {
            definitions: this.state.definitions.build(),
            info: {
                title: 'default-title',
                version: '1.0.0'
            },
            parameters,
            paths,
            securityDefinitions,
            swagger: '2.0'
        };

        setIfDefined(swagger, 'consumes', this.state.consumes);
        setIfDefined(swagger, 'produces', this.state.produces);
        setIfDefined(swagger, 'basePath', this.state.basePath);
        setIfDefined(swagger, 'security', this.state.security);

        return swagger;
    }
}

export const swaggerBuilder = SwaggerBuilder.defaultSwaggerBuilder();
