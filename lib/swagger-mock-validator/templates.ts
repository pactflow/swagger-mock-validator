
// tslint:disable: max-line-length
const coverage = `
{{#bold}}COVERAGE:{{/bold}}
{{#bold}}---------{{/bold}}
{{#spec}}
[{{#bold}}Spec: {{{pct}}}{{/bold}}] {{#bold}}{{{name}}}{{/bold}}
{{#operations}}
  [{{#bold}}Operation: {{{pct}}}{{/bold}}] {{#bold}}{{{name}}}{{/bold}}
  {{#responses}}
   - {{#bold}}Response: {{{name}}} {{#covered}}{{#green}}✔{{/green}}{{/covered}}{{^covered}}{{#red}}✘{{/red}}{{/covered}}{{/bold}}
     {{#interactions}}
     ○ {{{consumer}}} ⇨ {{{provider}}}: {{{description}}}
   {{/interactions}}
  {{/responses}}
{{/operations}}
{{/spec}}
`;

export {
    coverage
};
