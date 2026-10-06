import { isMap, isNode, isScalar, isSeq, LineCounter, parseDocument } from "yaml";

/** JSON Pointer -> source line, using the YAML parser rather than matching field names. */
export function specificationSourceLocations(content: string): Record<string, number> {
  const counter = new LineCounter();
  const document = parseDocument(content, { lineCounter: counter });
  const locations: Record<string, number> = Object.create(null);
  function visit(node: unknown, pointer: string, keyOffset?: number): void {
    if (!isNode(node)) return;
    const offset = keyOffset ?? node.range?.[0];
    if (offset !== undefined) locations[pointer] = counter.linePos(offset).line;
    if (isMap(node)) {
      for (const pair of node.items) {
        if (!isScalar(pair.key)) continue;
        const part = String(pair.key.value).replace(/~/g, "~0").replace(/\//g, "~1");
        visit(pair.value, `${pointer}/${part}`, pair.key.range?.[0]);
      }
    } else if (isSeq(node)) node.items.forEach((item, index) => visit(item, `${pointer}/${index}`));
  }
  visit(document.contents, "");
  return locations;
}
