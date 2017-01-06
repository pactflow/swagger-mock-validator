import {
    ParsedMockValue,
    ParsedSpecValue,
    ValidationResult,
    ValidationResultSource,
    ValidationResultType
} from './types';

interface ResultOptions {
    message: string;
    pactSegment: ParsedMockValue<any>;
    source: ValidationResultSource;
    swaggerSegment: ParsedSpecValue<any>;
}

const buildResult = (type: ValidationResultType, options: ResultOptions): ValidationResult => {
    const interaction = options.pactSegment.parentInteraction;
    const operation = options.swaggerSegment.parentOperation;

    return {
        message: options.message,
        pactDetails: {
            interactionDescription: interaction.description,
            interactionState: interaction.state,
            location: options.pactSegment.location,
            pactFile: interaction.pactFile,
            value: options.pactSegment.value
        },
        source: options.source,
        swaggerDetails: {
            location: options.swaggerSegment.location,
            pathMethod: operation.method,
            pathName: operation.pathName,
            swaggerFile: operation.swaggerFile,
            value: options.swaggerSegment.value
        },
        type
    };
};

export default {
    error: (options: ResultOptions) => buildResult('error', options),
    warning: (options: ResultOptions) => buildResult('warning', options)
};
