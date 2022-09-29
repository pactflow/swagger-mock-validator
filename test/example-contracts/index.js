const $RefParser = require("@apidevtools/json-schema-ref-parser");
const resolveAllOf = require("json-schema-resolve-allof");
const fs = require("fs");


const myArgs = process.argv.slice(2);

const inputSchema = myArgs[0];
const outputSchema = "resolved.json";
(async () => {
  try {
    // Deref all $refs
    const schema = await $RefParser.dereference(inputSchema);

    // Inline all allOfs
    const resolved = resolveAllOf(schema);

    fs.writeFileSync(outputSchema, JSON.stringify(resolved))
  } catch (err) {
    console.error(err);
  }
})();