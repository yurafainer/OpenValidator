/* Full source viewer: keep the original text, including comments and formatting. */
const yamlDialog = document.querySelector("#yamlDialog");
const yamlSource = document.querySelector("#yamlSource");
const yamlDocumentation = document.querySelector("#yamlDocumentation");
const yamlSearch = document.querySelector("#yamlSearch");
const yamlPreviewStatus = document.querySelector("#yamlPreviewStatus");
const yamlEmptyState = document.querySelector("#yamlEmptyState");
let yamlPreviewData = null;
let yamlRenderedData = null;
let yamlLines = [];
let yamlSearchTimer;
let yamlSearchCache = new WeakMap();

function yamlElement(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = String(text);
  if (className) element.className = className;
  return element;
}

function setYamlPreview(data) {
  clearTimeout(yamlSearchTimer);
  yamlRenderedData = null;
  yamlPreviewData = data && typeof data.sourceContent === "string" ? data : null;
  yamlDialog.hidden = !yamlPreviewData;
  document.querySelector("#specificationWorkspace").dataset.loaded = String(Boolean(yamlPreviewData));
  yamlEmptyState.hidden = Boolean(yamlPreviewData);
  yamlLines = [];
  yamlSearchCache = new WeakMap();
  resetFieldExplorer();
  yamlSource.replaceChildren();
  yamlDocumentation.replaceChildren();
  yamlSearch.value = "";
  yamlPreviewStatus.textContent = "";
  if (document.querySelector("#yaml").classList.contains("active")) renderYamlPreview();
}

function yamlJsonDetails(label, value) {
  const details = yamlElement("details");
  details.append(yamlElement("summary", label));
  details.addEventListener("toggle", () => {
    if (details.open && details.childElementCount === 1) {
      details.append(yamlElement("pre", JSON.stringify(value, null, 2)));
    }
  });
  return details;
}

function yamlResolved(value) {
  return YamlSchemaInspector.resolveNode(yamlPreviewData.specification, value);
}

function yamlSchemaTable(schema, options = {}) {
  const inspection = options.inspection || fieldInspection(schema, options);
  const wrapper = yamlElement("div", undefined, "yaml-field-table-wrap");
  const table = yamlElement("table", undefined, "yaml-field-table");
  const head = yamlElement("thead");
  const headings = yamlElement("tr");
  ["Field / שדה", "Type / סוג", "Required / חובה", "Values, regex & limits / אילוצים"].forEach((label) => {
    const cell = yamlElement("th", label);
    cell.scope = "col";
    headings.append(cell);
  });
  head.append(headings);
  const body = yamlElement("tbody");
  inspection.rows.forEach((row) => {
    const tr = yamlElement("tr");
    const field = yamlElement("td");
    const sourceLine = yamlPreviewData.sourceLocations?.[row.sourcePointer];
    if (sourceLine) {
      const link = yamlElement("button", row.path, "yaml-field-link");
      link.type = "button";
      link.title = `הצג במקור — שורה ${sourceLine}`;
      link.addEventListener("click", () => highlightYamlField(row.sourcePointer));
      field.append(link);
    } else field.append(yamlElement("code", row.path));
    if (row.branch) field.append(yamlElement("small", row.branch, "yaml-schema-branch"));
    if (row.description) field.append(yamlElement("p", row.description, "yaml-field-description"));
    if (row.reference) field.append(yamlElement("small", row.reference, "yaml-field-reference"));
    const required = row.required ? (row.branch ? "Yes (in this branch)" : "Yes") : "Not declared";
    const limits = yamlElement("td");
    row.constraints.forEach(({ label, value, keyword }) => {
      const item = yamlElement("div", undefined, "yaml-constraint");
      item.dataset.keyword = keyword;
      item.append(yamlElement("strong", label), yamlElement("code", value));
      limits.append(item);
    });
    if (row.note) limits.append(yamlElement("p", row.note, "yaml-schema-note"));
    if (!row.constraints.length && !row.note) limits.textContent = "—";
    tr.append(field, yamlElement("td", row.type), yamlElement("td", required, row.required ? "yaml-required" : ""), limits);
    body.append(tr);
  });
  table.append(head, body);
  wrapper.append(table);
  if (inspection.truncated) wrapper.append(yamlElement("p", "התצוגה מוגבלת ל־2,000 שדות. כל ההגדרות זמינות בקובץ המקור.", "yaml-schema-note"));
  return wrapper;
}

function yamlSchemaDetails(label, schema, options = {}) {
  const details = yamlElement("details", undefined, "yaml-schema-details");
  details.append(yamlElement("summary", label));
  details.open = true;
  details.append(yamlSchemaTable(schema, options), yamlJsonDetails("Raw schema / הגדרה גולמית", schema));
  return details;
}

function yamlContentSchemas(container, content, prefix, required) {
  Object.entries(content || {}).forEach(([mediaType, media]) => {
    if (media?.schema !== undefined) {
      const schema = media.example !== undefined ? { ...media.schema, example: media.example } : media.schema;
      const section = yamlSchemaDetails(`${prefix} · ${mediaType}`, schema, { required });
      container.append(section);
    }
    if (media?.examples) container.append(yamlJsonDetails(`${mediaType} · Examples`, media.examples));
  });
}

function yamlOperationFields(pathItem, operation) {
  const content = yamlElement("div", undefined, "yaml-operation-content");
  if (operation.description) content.append(yamlTextDetails("תיאור הפעולה", operation.description));
  const groups = new Map();
  // Operation-level parameters override a path-level parameter with the same name and location.
  [...(pathItem.parameters || []), ...(operation.parameters || [])].forEach((raw) => {
    const resolved = yamlResolved(raw);
    const parameter = resolved.value;
    if (!parameter || resolved.note) {
      content.append(yamlElement("p", resolved.note || "Unresolved parameter", "yaml-schema-note"));
      return;
    }
    groups.set(`${parameter.in}:${parameter.name}`, parameter);
  });
  if (groups.size) content.append(yamlElement("h4", "Parameters / פרמטרים"));
  groups.forEach((parameter) => {
    const heading = `${parameter.in || "parameter"} · ${parameter.name || "body"}`;
    if (parameter.content) yamlContentSchemas(content, parameter.content, heading, parameter.required);
    else {
      const schema = parameter.schema !== undefined ? parameter.schema : parameter;
      const section = yamlSchemaDetails(heading, schema, { path: parameter.in === "body" ? "$" : parameter.name, required: parameter.in === "path" || parameter.required === true });
      content.append(section);
    }
    if (parameter.description && parameter.schema) content.append(yamlElement("p", parameter.description));
  });
  if (operation.requestBody) {
    content.append(yamlElement("h4", "Request body / גוף הבקשה"));
    const resolved = yamlResolved(operation.requestBody);
    if (resolved.note) content.append(yamlElement("p", resolved.note, "yaml-schema-note"));
    else {
      if (resolved.value.description) content.append(yamlElement("p", resolved.value.description));
      yamlContentSchemas(content, resolved.value.content, "Request", resolved.value.required === true);
    }
  }
  if (operation.responses) content.append(yamlElement("h4", "Responses / תגובות"));
  Object.entries(operation.responses || {}).forEach(([status, raw]) => {
    const resolved = yamlResolved(raw);
    const response = resolved.value;
    if (resolved.note) { content.append(yamlElement("p", `${status}: ${resolved.note}`, "yaml-schema-note")); return; }
    const title = yamlElement("p", `${status} · ${response.description || "Response"}`, "yaml-response-title");
    content.append(title);
    if (response.schema !== undefined) content.append(yamlSchemaDetails(`Response ${status}`, response.schema));
    yamlContentSchemas(content, response.content, `Response ${status}`, false);
    Object.entries(response.headers || {}).forEach(([name, header]) => {
      const resolvedHeader = yamlResolved(header);
      if (resolvedHeader.note) content.append(yamlElement("p", resolvedHeader.note, "yaml-schema-note"));
      else content.append(yamlSchemaDetails(`Response ${status} · header ${name}`, resolvedHeader.value.schema !== undefined ? resolvedHeader.value.schema : resolvedHeader.value, { path: name, required: resolvedHeader.value.required === true }));
    });
  });
  if (operation.security || yamlPreviewData.specification.security) content.append(yamlJsonDetails("Security", operation.security || yamlPreviewData.specification.security));
  content.append(yamlJsonDetails("Full operation / הגדרה גולמית", operation));
  return content;
}


function yamlSearchableText(value) {
  if (!value || typeof value !== "object") return String(value || "").toLowerCase();
  if (yamlSearchCache.has(value)) return yamlSearchCache.get(value);
  const fragments = [JSON.stringify(value)];
  const references = new Set();
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (typeof node.$ref === "string" && !references.has(node.$ref) && references.size < 2000) {
      references.add(node.$ref);
      const resolved = yamlResolved(node);
      if (!resolved.note) { fragments.push(JSON.stringify(resolved.value)); visit(resolved.value); }
    }
    Object.values(node).forEach((child) => { if (child && typeof child === "object") visit(child); });
  }
  visit(value);
  const result = fragments.join(" ").toLowerCase();
  yamlSearchCache.set(value, result);
  return result;
}

function renderYamlDocumentation(query) { renderFieldExplorer(query); }

function searchYamlPreview() {
  if (!yamlPreviewData) return;
  const query = yamlSearch.value.trim().toLowerCase();
  let count = 0;
  let first;
  yamlLines.forEach(({ element, text }) => {
    const matches = Boolean(query && text.toLowerCase().includes(query));
    element.classList.toggle("match", matches);
    if (matches) { count++; first ||= element; }
  });
  yamlPreviewStatus.textContent = query ? `${count} שורות תואמות` : `${yamlLines.length} שורות`;
  if (first) yamlSource.scrollTop = first.offsetTop - yamlLines[0].element.offsetTop;
  renderYamlDocumentation(query);
}

function renderYamlPreview() {
  if (!yamlPreviewData || yamlRenderedData === yamlPreviewData) return;
  const stored = yamlPreviewData.storedSpecification;
  document.querySelector("#yamlPreviewMeta").textContent = `${stored?.name || "Specification"} · ${stored?.fileName || "specification.yaml"}`;
  yamlSearch.value = "";
  const fragment = document.createDocumentFragment();
  yamlLines = yamlPreviewData.sourceContent.split(/\r\n|\n|\r/).map((text, index) => {
    const element = yamlElement("span", undefined, "yaml-line");
    element.dataset.line = String(index + 1);
    const key = text.match(/^(\s*(?:-\s+)?)([^#\s][^:]*:)(\s|$)/);
    if (/^\s*#/.test(text)) element.append(yamlElement("span", text, "yaml-comment"));
    else if (key) element.append(document.createTextNode(key[1]), yamlElement("span", key[2], "yaml-key"), document.createTextNode(text.slice(key[1].length + key[2].length)));
    else element.textContent = text || "\u200b";
    fragment.append(element);
    return { element, text };
  });
  yamlSource.replaceChildren(fragment);
  yamlSource.scrollTop = 0;
  yamlSource.scrollLeft = 0;
  prepareFieldExplorer();
  searchYamlPreview();
  yamlRenderedData = yamlPreviewData;
}

yamlSearch.addEventListener("input", () => {
  clearTimeout(yamlSearchTimer);
  yamlSearchTimer = setTimeout(searchYamlPreview, 180);
});
document.querySelector("#yamlWrap").addEventListener("change", (event) => yamlSource.classList.toggle("wrap", event.target.checked));
document.querySelector("#copyYaml").onclick = async () => {
  if (!yamlPreviewData) return;
  try {
    await navigator.clipboard.writeText(yamlPreviewData.sourceContent);
    yamlPreviewStatus.textContent = "תוכן המקור הועתק";
  } catch {
    yamlPreviewStatus.textContent = "ההעתקה נחסמה בדפדפן. ניתן להוריד את קובץ המקור.";
  }
};
document.querySelector("#downloadYaml").onclick = () => {
  if (!yamlPreviewData) return;
  const fileName = yamlPreviewData.storedSpecification?.fileName || "specification.yaml";
  const url = URL.createObjectURL(new Blob([yamlPreviewData.sourceContent], { type: /\.json$/i.test(fileName) ? "application/json;charset=utf-8" : "application/yaml;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  yamlPreviewStatus.textContent = "קובץ המקור הורד";
};

setYamlPreview(null);
