import * as chalk from 'chalk';
import {
    CoverageHit,
    ParsedSpecOperation,
    Printer,
    SpecCoverage,
    SpecOperationCoverage,
    SpecResponseCoverage
} from '../types';

function percentageStr(actual: number, total: number): string {
    if (total <= 0) {
        return '-%';
    }
    const pct = (actual / total * 100);
    const color = pct === 0 ? chalk.red : pct < 100 ? chalk.yellow : chalk.green;
    return color.bold(pct.toFixed(2) + '%');
}

interface ReportLine {
    format: () => string;
}

interface SummaryReportLine extends ReportLine {
    actual: number;
    total: number;
}

const newSpecReportLine = ((text: string): SummaryReportLine => {
   const x: any = {actual: 0, total: 0};
   x.format = () => {
       const pct = percentageStr(x.actual, x.total);
       return `[${chalk.bold('Spec')}: ${pct}] ${chalk.bold(text)}`;
   };
   return x;
});

const newOperationReportLine = ((text: string): SummaryReportLine => {
    const x: any = {actual: 0, total: 0};
    x.format = () => {
        const pct = percentageStr(x.actual, x.total);
        return `  [${chalk.bold('Operation')}: ${pct}] ${chalk.bold(text)}`;
    };
    return x;
});

const newResponseReportLine = ((text: string, covered: boolean): ReportLine => {
    return {
        format: () => {
            const coverMark = covered ? chalk.green('✔') : chalk.red('✘');
            return `    - ${chalk.bold('Response')}: ${chalk.bold(text)} ${coverMark}`;
        }
    };
});

const newInteractionReportLine = ((text: string): ReportLine => {
    return {format: () => `      ○ ${text}`};
});

function printReport(reportLines: ReportLine[], printer: Printer) {
    printer(chalk.bold('COVERAGE:'));
    printer(chalk.bold('---------'));
    printer(reportLines.map((reportLine) => reportLine.format()).join('\n'));
    printer('\n');
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

function getInterationDisplayName(hit: CoverageHit): string {
    return `${hit.mock.consumer} ⇨ ${hit.mock.provider}: ${hit.interaction.description}`;
}

function displayCoverage(specCoverage: SpecCoverage | undefined, printer: Printer) {
    if (!specCoverage) {
        return;
    }
    const reportLines: ReportLine[] = [];
    const specLine: SummaryReportLine = newSpecReportLine(specCoverage.spec.pathOrUrl);

    reportLines.push(specLine);

    specCoverage.operations.forEach((specOperationCoverage: SpecOperationCoverage) => {
        const operationName = getOperationDisplayName(specOperationCoverage.operation);
        const operationLine: SummaryReportLine = newOperationReportLine(operationName);
        reportLines.push(operationLine);

        specOperationCoverage.responses.forEach((specResponseCoverage: SpecResponseCoverage) => {
            const responseName = getResponseDisplayName(specResponseCoverage);
            const covered = specResponseCoverage.hits.length > 0;
            reportLines.push(newResponseReportLine(responseName, covered));
            specResponseCoverage.hits.forEach((hit) => {
                reportLines.push(newInteractionReportLine(getInterationDisplayName(hit)));
            });
            operationLine.total++;
            if (covered) {
                operationLine.actual++;
            }
        });
        specLine.total += operationLine.total;
        specLine.actual += operationLine.actual;
    });
    printReport(reportLines, printer);
}

export default displayCoverage;
