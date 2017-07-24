import * as _chalk from 'chalk';
import * as _ from 'lodash';
import * as Mustache from 'mustache';

import {coverage as template} from '../templates';

import {
    CoverageHit,
    Formatter,
    FormatterSet,
    ParsedSpecOperation,
    Printer,
    SpecCoverage,
    SpecOperationCoverage,
    SpecResponseCoverage
} from '../types';

const chalk = new _chalk.constructor({enabled: true});

interface SummaryCoverageReport {
    name: string;
    totalCount: number;
    coveredCount: number;
}

interface SpecCoverageReport extends SummaryCoverageReport {
    operations: OperationCoverageReport[];
}

interface OperationCoverageReport extends SummaryCoverageReport {
    responses: ResponseCoverageReport[];
}

interface ResponseCoverageReport {
    name: string;
    covered: boolean;
    interactions: InteractionCoverageReport[];
}

interface InteractionCoverageReport {
    consumer: string;
    provider: string;
    description: string;
}

function createPercentageRenderer(
    green: Formatter,
    yellow: Formatter,
    red: Formatter
): (this: SummaryCoverageReport) => string {
    return function(this: SummaryCoverageReport): string {
        if (this.totalCount <= 0) {
            return '-%';
        }
        const pct = this.coveredCount / this.totalCount * 100;
        const pctStr = pct.toFixed(2) + '%';
        return pct === 100 ? green(pctStr) : pct > 0 ? yellow(pctStr) : red(pctStr);
    };
}

type MustacheRenderer = (text: string, render: (text: string) => string) => string;

function createMustacheRenderer(formatter: Formatter): MustacheRenderer {
    return (text: string, render: (text: string) => string) => formatter(render(text));
}

const chalkFormatters: FormatterSet = {
    bold: chalk.bold,
    green: chalk.green,
    red: chalk.red,
    yellow: chalk.yellow
};

interface CoverageView {
    spec: SpecCoverageReport;
    bold: () => MustacheRenderer;
    green: () => MustacheRenderer;
    red: () => MustacheRenderer;
    pct: (this: SummaryCoverageReport) => string;
}

function createView(spec: SpecCoverageReport, formatters: FormatterSet): CoverageView {
    return {
        bold: () => createMustacheRenderer(formatters.bold),
        green: () => createMustacheRenderer(formatters.green),
        pct: createPercentageRenderer(formatters.green, formatters.yellow, formatters.red),
        red: () => createMustacheRenderer(formatters.red),
        spec
    };
}

function getResponseDisplayName(responseCoverage: SpecResponseCoverage): string {
    const response = responseCoverage.response.location;
    return response.substr(response.lastIndexOf('.') + 1);
}

function getOperationDisplayName(operation: ParsedSpecOperation) {
    const name = operation.pathName || '';
    const method = operation.method || 'default';
    return `${method.toUpperCase()} ${name}`;
}

function buildSpecCoverageReport(specCoverage: SpecCoverage): SpecCoverageReport {
    const name = specCoverage.spec.pathOrUrl;
    const operations = specCoverage.operations.map((operation) => buildOperationCoverageReport(operation));
    const coveredCount = _(operations).sumBy((op) => op.coveredCount);
    const totalCount = _(operations).sumBy((op) => op.totalCount);
    return {name, coveredCount, totalCount, operations};
}

function buildOperationCoverageReport(operationCoverage: SpecOperationCoverage): OperationCoverageReport {
    const name = getOperationDisplayName(operationCoverage.operation);
    const responses = operationCoverage.responses.map((response) => buildResponseCoverageReport(response));
    const totalCount = responses.length;
    const coveredCount = responses.filter((r) => r.covered).length;
    return {name, totalCount, coveredCount, responses};
}

function buildResponseCoverageReport(responseCoverage: SpecResponseCoverage): ResponseCoverageReport {
    const name = getResponseDisplayName(responseCoverage);
    const covered = responseCoverage.hits.length > 0;
    const interactions: InteractionCoverageReport[] = responseCoverage.hits.map(
        (hit) => buildInteractionCoverageReport(hit)
    );
    return {name, covered, interactions};
}

function buildInteractionCoverageReport(coverageHit: CoverageHit): InteractionCoverageReport {
    return {
        consumer: coverageHit.mock.consumer,
        description: coverageHit.interaction.description,
        provider: coverageHit.mock.provider
    };
}

function displayCoverage(
    specCoverage: SpecCoverage | undefined,
    printer: Printer,
    formatters?: FormatterSet | undefined
): void {
    if (!specCoverage) {
        return;
    }
    const model: SpecCoverageReport = buildSpecCoverageReport(specCoverage);
    const view: CoverageView = createView(model, formatters || chalkFormatters);
    printer(Mustache.render(template, view));
}

export default displayCoverage;
