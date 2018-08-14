import {openApi3Parser} from './spec-parser/openapi3/openapi3-parser';
import {validateAndDereferenceOpenApi3Spec} from './spec-parser/openapi3/validate-and-dereference-openapi3-spec';
import {ParsedSpec} from './spec-parser/parsed-spec';
import {resolveSpecFormat} from './spec-parser/resolve-spec-format';
import {swagger2Parser} from './spec-parser/swagger2/swagger2-parser';
import {validateAndDereferenceSwagger2Spec} from './spec-parser/swagger2/validate-and-dereference-swagger2-spec';
import {transformStringToObject} from './transform-string-to-object';
import {SerializedSpec} from './types';

export class SpecParser {
    public static async parse(spec: SerializedSpec): Promise<ParsedSpec> {
        const specJson = transformStringToObject<object>(spec.content, spec.pathOrUrl);

        const format = resolveSpecFormat(spec.format, specJson, spec.pathOrUrl);

        return format === 'swagger2'
            ? this.validateAndParseSwagger2(specJson, spec.pathOrUrl)
            : this.validateAndParseOpenApi3(specJson, spec.pathOrUrl);
    }

    private static async validateAndParseSwagger2(specJson: any, pathOrUrl: string): Promise<ParsedSpec> {
        const spec = await validateAndDereferenceSwagger2Spec(specJson, pathOrUrl);
        return swagger2Parser.parse(spec, pathOrUrl);
    }

    private static async validateAndParseOpenApi3(specJson: any, pathOrUrl: string): Promise<ParsedSpec> {
        const spec = await validateAndDereferenceOpenApi3Spec(specJson, pathOrUrl);
        return openApi3Parser.parse(spec, pathOrUrl);
    }
}
