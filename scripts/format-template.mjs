import { format, resolveConfig } from "prettier";

/**
 * The Go plugin can reflow an attribute conditional again on its second pass.
 * Return a fixed point so one invocation is idempotent; fail on oscillation.
 * @param {string} source
 * @returns {Promise<string>}
 */
export async function formatTemplate(source) {
  const options = await resolveConfig("themes/shsh/layouts/__format_probe.html");
  if (!options) throw new Error("Missing Go template formatter configuration");
  let current = source;
  const seen = new Set([current]);
  for (let pass = 0; pass < 5; pass++) {
    const next = await format(current, options);
    if (next === current) return current;
    if (seen.has(next)) throw new Error("Go template formatting oscillates");
    seen.add(next);
    current = next;
  }
  throw new Error("Go template formatting did not reach a fixed point in five passes");
}
