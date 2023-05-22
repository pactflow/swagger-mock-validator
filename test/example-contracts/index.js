import $RefParser from "@apidevtools/json-schema-ref-parser";
import resolveAllOf from "json-schema-resolve-allof";
import fs from "fs";

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
