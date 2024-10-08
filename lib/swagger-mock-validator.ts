import _ from 'lodash';
import { ValidationOutcome, ValidationResult } from './api-types';
import { Analytics } from './swagger-mock-validator/analytics';
import { FileStore } from './swagger-mock-validator/file-store';
import { MockParser } from './swagger-mock-validator/mock-parser';
import { ParsedMock } from './swagger-mock-validator/mock-parser/parsed-mock';
import { PactBroker } from './swagger-mock-validator/pact-broker';
import { SpecParser } from './swagger-mock-validator/spec-parser';
import {
  MockSource,
  ParsedSwaggerMockValidatorOptions,
  SerializedMock,
  SerializedSpec,
  SpecSource,
  SwaggerMockValidatorUserOptions,
  ValidateOptions
} from './swagger-mock-validator/types';
import { validateSpecAndMock } from './swagger-mock-validator/validate-spec-and-mock';

const getMockSource = (
  mockPathOrUrl: string,
  providerName?: string
): MockSource => {
  if (providerName) {
    return 'pactBroker';
  } else if (FileStore.isUrl(mockPathOrUrl)) {
    return 'url';
  }

  return 'path';
};

const getSpecSource = (specPathOrUrl: string): SpecSource =>
  FileStore.isUrl(specPathOrUrl) ? 'url' : 'path';

const parseUserOptions = (
  userOptions: SwaggerMockValidatorUserOptions
): ParsedSwaggerMockValidatorOptions => ({
  ...userOptions,
  mockSource: getMockSource(
    userOptions.mockPathOrUrl,
    userOptions.providerName
  ),
  specSource: getSpecSource(userOptions.specPathOrUrl),
  additionalPropertiesInResponse:
    typeof userOptions.additionalPropertiesInResponse === 'undefined'
      ? false // BREAKING CHANGE - option switch here to change default from true, to false for versions > v10.3.0
      : userOptions.additionalPropertiesInResponse === 'true'
      ? true
      : false,
  requiredPropertiesInResponse:
    typeof userOptions.requiredPropertiesInResponse === 'undefined'
      ? false // default to false - existing behaviour
      : userOptions.requiredPropertiesInResponse === 'true'
      ? true
      : false,
  publish: typeof userOptions.publish !== 'undefined'
});

const combineValidationResults = (
  validationResults: ValidationResult[][]
): ValidationResult[] => {
  const flattenedValidationResults = _.flatten(validationResults);
  return _.uniqWith(flattenedValidationResults, _.isEqual);
};

const combineValidationOutcomes = (
  validationOutcomes: ValidationOutcome[]
): ValidationOutcome => {
  return {
    errors: combineValidationResults(
      validationOutcomes.map((validationOutcome) => validationOutcome.errors)
    ),
    failureReason:
      _(validationOutcomes)
        .map((outcome: ValidationOutcome) => outcome.failureReason)
        .filter((failureReason) => failureReason !== undefined)
        .join(', ') || undefined,
    success: _.every(
      validationOutcomes,
      (outcome: ValidationOutcome) => outcome.success
    ),
    warnings: combineValidationResults(
      validationOutcomes.map((validationOutcome) => validationOutcome.warnings)
    )
  };
};

interface ValidationSpecAndMockContentResult {
  parsedMock?: ParsedMock;
  validationOutcome: ValidationOutcome;
}

export const validateSpecAndMockContent = async (
  options: ValidateOptions
): Promise<ValidationSpecAndMockContentResult> => {
  const spec = options.spec;
  const mock = options.mock;
  const opts = ({
    additionalPropertiesInResponse: options.additionalPropertiesInResponse,
    requiredPropertiesInResponse: options.requiredPropertiesInResponse
  } = options);

  const parsedSpec = await SpecParser.parse(spec);
  const parsedMock = MockParser.parse(mock);
  const validationOutcome = await validateSpecAndMock(
    parsedMock,
    parsedSpec,
    opts
  );

  return {
    parsedMock,
    validationOutcome
  };
};

export class SwaggerMockValidator {
  private static getNoMocksInBrokerValidationOutcome(): ValidationOutcome[] {
    const noMocksValidationOutcome: ValidationOutcome = {
      errors: [],
      success: true,
      warnings: [
        {
          code: 'pact-broker.no-pacts-found',
          message: 'No consumer pacts found in Pact Broker',
          source: 'pact-broker',
          type: 'warning'
        }
      ]
    };
    return [noMocksValidationOutcome];
  }

  public constructor(
    private readonly fileStore: FileStore,
    private readonly pactBroker: PactBroker,
    private readonly analytics: Analytics
  ) {}

  public async validate(
    userOptions: SwaggerMockValidatorUserOptions
  ): Promise<ValidationOutcome> {
    const options = parseUserOptions(userOptions);
    const { spec, mocks } = await this.loadSpecAndMocks(options);
    const validationOutcomes = await this.getValidationOutcomes(
      spec,
      mocks,
      options
    );

    return combineValidationOutcomes(validationOutcomes);
  }

  private async loadSpecAndMocks(
    options: ParsedSwaggerMockValidatorOptions
  ): Promise<{ spec: SerializedSpec; mocks: SerializedMock[] }> {
    const whenSpecContent = this.getSpecFromFileOrUrl(options.specPathOrUrl);

    const whenMocks = options.providerName
      ? this.pactBroker.loadPacts({
          pactBrokerUrl: options.mockPathOrUrl,
          providerName: options.providerName,
          tag: options.tag
        })
      : this.getPactFromFileOrUrl(options.mockPathOrUrl);

    const [spec, mocks] = await Promise.all([whenSpecContent, whenMocks]);
    return { spec, mocks };
  }

  private async getSpecFromFileOrUrl(
    specPathOrUrl: string
  ): Promise<SerializedSpec> {
    const content = await this.fileStore.loadFile(specPathOrUrl);

    return {
      content,
      format: 'auto-detect',
      pathOrUrl: specPathOrUrl
    };
  }

  private async getPactFromFileOrUrl(
    mockPathOrUrl: string
  ): Promise<SerializedMock[]> {
    const content = await this.fileStore.loadFile(mockPathOrUrl);

    return [
      {
        content,
        format: 'auto-detect',
        pathOrUrl: mockPathOrUrl
      }
    ];
  }

  private async getValidationOutcomes(
    spec: SerializedSpec,
    mocks: SerializedMock[],
    options: ParsedSwaggerMockValidatorOptions
  ): Promise<ValidationOutcome[]> {
    if (mocks.length === 0) {
      return SwaggerMockValidator.getNoMocksInBrokerValidationOutcome();
    }

    return Promise.all(
      mocks.map((mock) => this.validateSpecAndMock(spec, mock, options))
    );
  }

  private async validateSpecAndMock(
    spec: SerializedSpec,
    mock: SerializedMock,
    options: ParsedSwaggerMockValidatorOptions
  ): Promise<ValidationOutcome> {
    const { additionalPropertiesInResponse, requiredPropertiesInResponse } =
      options;
    const result = await validateSpecAndMockContent({
      mock,
      spec,
      additionalPropertiesInResponse,
      requiredPropertiesInResponse
    });

    if (result.parsedMock) {
      await this.postAnalyticEvent(
        options,
        result.parsedMock,
        result.validationOutcome
      );

      if (options.publish) {
        await this.pactBroker.publishVerificationResult(options, result.parsedMock, result.validationOutcome);
      }
    }

    return result.validationOutcome;
  }

  private async postAnalyticEvent(
    options: ParsedSwaggerMockValidatorOptions,
    parsedMock: ParsedMock,
    validationOutcome: ValidationOutcome
  ): Promise<void> {
    if (options.analyticsUrl) {
      try {
        await this.analytics.postEvent({
          analyticsUrl: options.analyticsUrl,
          consumer: parsedMock.consumer,
          mockPathOrUrl: parsedMock.pathOrUrl,
          mockSource: options.mockSource,
          provider: parsedMock.provider,
          specPathOrUrl: options.specPathOrUrl,
          specSource: options.specSource,
          validationOutcome
        });
      } catch (error) {
        // do not fail tool on analytics errors
      }
    }
  }
}
