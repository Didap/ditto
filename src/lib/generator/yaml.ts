/**
 * Tiny YAML serializer for DESIGN.md frontmatter.
 *
 * We don't pull a dep because we only need a narrow slice of YAML 1.2:
 *   - strings (always double-quoted + escaped)
 *   - numbers (unquoted)
 *   - booleans (unquoted)
 *   - nested objects (2-space indent)
 *   - `null` → omitted (undefined/null keys skipped entirely)
 *
 * No anchors, no arrays-of-objects, no multi-line strings. The Google
 * DESIGN.md schema never needs them.
 */

export type YamlValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | YamlObject;
export interface YamlObject {
  [key: string]: YamlValue;
}

function quoteString(s: string): string {
  // Always double-quote; escape backslash, double-quote, newline.
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}

function serializeValue(value: YamlValue, indent: number): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return quoteString(value);
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  // object
  return "\n" + serializeObject(value, indent + 1);
}

function serializeObject(obj: YamlObject, indent: number): string {
  const pad = "  ".repeat(indent);
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    const k = /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(key) ? key : quoteString(key);
    const v = serializeValue(value, indent);
    if (typeof value === "object") {
      // Skip empty nested objects entirely.
      const hasChildren = Object.values(value).some((x) => x !== null && x !== undefined);
      if (!hasChildren) continue;
      lines.push(`${pad}${k}:${v}`);
    } else {
      lines.push(`${pad}${k}: ${v}`);
    }
  }
  return lines.join("\n");
}

/** Top-level: serialize object into YAML body (no leading/trailing `---`). */
export function stringifyYaml(obj: YamlObject): string {
  return serializeObject(obj, 0);
}

/** Wrap in `---` fences for Markdown frontmatter. */
export function stringifyFrontmatter(obj: YamlObject): string {
  return `---\n${stringifyYaml(obj)}\n---\n`;
}
