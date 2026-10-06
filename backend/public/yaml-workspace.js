/* Field selection/search and an accessible, persistent pane separator. */
const yamlDefinition = document.querySelector('#yamlDefinition');
const yamlDefinitionKind = document.querySelector('#yamlDefinitionKind');
const yamlDefinitionLabel = document.querySelector('#yamlDefinitionLabel');
const fieldSearchStatus = document.querySelector('#fieldSearchStatus');
const fieldFilterInputs = ['filterRequired', 'filterPattern', 'filterEnum'].map(id => document.getElementById(id));
let fieldEntries = [];
let fieldPointers = new WeakMap();
let fieldInspectionCache = new WeakMap();

function resetFieldExplorer() {
  fieldEntries = [];
  fieldPointers = new WeakMap();
  fieldInspectionCache = new WeakMap();
  yamlDefinition.replaceChildren();
  fieldSearchStatus.textContent = '';
  fieldFilterInputs.forEach(input => { input.checked = false; });
}
function fieldInspection(schema, options = {}) {
  const key = `${options.path || '$'}:${Boolean(options.required)}`;
  if (schema && typeof schema === 'object') {
    const cached = fieldInspectionCache.get(schema);
    if (cached?.has(key)) return cached.get(key);
  }
  const inspection = YamlSchemaInspector.inspectSchema(yamlPreviewData.specification, schema, {
    ...options,
    nodePointer: node => node && typeof node === 'object' ? fieldPointers.get(node) : undefined,
  });
  if (schema && typeof schema === 'object') {
    const cached = fieldInspectionCache.get(schema) || new Map();
    cached.set(key, inspection);
    fieldInspectionCache.set(schema, cached);
  }
  return inspection;
}
function yamlTextDetails(label, text) {
  const details = yamlElement('details', undefined, 'yaml-description-details');
  details.append(yamlElement('summary', label), yamlElement('p', text));
  return details;
}
function prepareFieldExplorer() {
  const specification = yamlPreviewData.specification;
  function index(node, pointer) {
    if (!node || typeof node !== 'object' || fieldPointers.has(node)) return;
    fieldPointers.set(node, pointer);
    Object.entries(node).forEach(([key, value]) => index(value, `${pointer}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`));
  }
  index(specification, '');
  const schemas = specification.components?.schemas || specification.definitions;
  if (schemas) Object.entries(schemas).forEach(([name, schema]) => fieldEntries.push({ key: `schema:${name}`, kind: 'schema', label: name, sections: [{ label: name, schema }] }));
  else if (!specification.paths) fieldEntries.push({ key: 'root', kind: 'schema', label: specification.title || 'Root schema', sections: [{ label: 'Root schema', schema: specification }] });
  const mediaSections = (content, label, required) => Object.entries(content || {}).filter(([, media]) => media?.schema !== undefined).map(([type, media]) => ({ label: `${label} · ${type}`, schema: media.schema, options: { required } }));
  extractOperations(specification).forEach(({ path, method, operation }) => {
    const sections = [];
    const parameters = new Map();
    [...(specification.paths[path].parameters || []), ...(operation.parameters || [])].forEach(raw => {
      const resolved = yamlResolved(raw);
      if (resolved.note) sections.push({ label: 'Parameter', schema: raw });
      else parameters.set(`${resolved.value.in}:${resolved.value.name}`, resolved.value);
    });
    parameters.forEach(parameter => {
      const label = `${parameter.in || 'parameter'} · ${parameter.name || 'body'}`;
      if (parameter.content) sections.push(...mediaSections(parameter.content, label, parameter.required));
      else sections.push({ label, schema: parameter.schema ?? parameter, options: { path: parameter.in === 'body' ? '$' : parameter.name, required: parameter.in === 'path' || parameter.required === true } });
    });
    if (operation.requestBody) {
      const resolved = yamlResolved(operation.requestBody);
      if (resolved.note) sections.push({ label: 'Request', schema: operation.requestBody });
      else sections.push(...mediaSections(resolved.value.content, 'Request', resolved.value.required === true));
    }
    Object.entries(operation.responses || {}).forEach(([status, raw]) => {
      const resolved = yamlResolved(raw);
      if (resolved.note) { sections.push({ label: `Response ${status}`, schema: raw }); return; }
      const response = resolved.value;
      if (response.schema !== undefined) sections.push({ label: `Response ${status}`, schema: response.schema });
      sections.push(...mediaSections(response.content, `Response ${status}`, false));
      Object.entries(response.headers || {}).forEach(([name, rawHeader]) => {
        const header = yamlResolved(rawHeader);
        sections.push({ label: `Response ${status} · header ${name}`, schema: header.note ? rawHeader : header.value.schema ?? header.value, options: { path: name, required: header.value.required === true } });
      });
    });
    fieldEntries.push({ key: `operation:${method}:${path}`, kind: 'operation', label: `${method} ${path}${operation.summary ? ` — ${operation.summary}` : ''}`, description: operation.description, sections, raw: operation });
  });
  for (const option of yamlDefinitionKind.options) option.disabled = !fieldEntries.some(entry => entry.kind === option.value);
  yamlDefinitionKind.disabled = !fieldEntries.length;
  if (!fieldEntries.some(entry => entry.kind === yamlDefinitionKind.value)) yamlDefinitionKind.value = fieldEntries[0]?.kind || 'operation';
  populateFieldDefinitions();
}
function populateFieldDefinitions() {
  const entries = fieldEntries.filter(entry => entry.kind === yamlDefinitionKind.value);
  if (yamlDefinitionKind.value === 'schema') entries.sort((a, b) => a.label.localeCompare(b.label, 'he', { numeric: true, sensitivity: 'base' }));
  yamlDefinition.replaceChildren(...entries.map(entry => new Option(entry.label, entry.key)));
  yamlDefinition.disabled = !entries.length;
  yamlDefinitionLabel.textContent = yamlDefinitionKind.value === 'schema' ? 'Schema — מבנה נתונים' : 'בקשת API';
}
function fieldMatches(row, query) {
  if (fieldFilterInputs[0].checked && !row.required) return false;
  if (fieldFilterInputs[1].checked && !row.constraints.some(item => item.keyword === 'pattern')) return false;
  if (fieldFilterInputs[2].checked && !row.constraints.some(item => item.keyword === 'enum')) return false;
  return !query || `${row.path} ${row.description} ${row.type} ${row.constraints.map(item => `${item.label} ${item.value}`).join(' ')}`.toLowerCase().includes(query);
}
function renderFieldExplorer(query) {
  yamlDocumentation.replaceChildren();
  const filtered = Boolean(query || fieldFilterInputs.some(input => input.checked));
  const entries = filtered ? fieldEntries.filter(entry => entry.kind === yamlDefinitionKind.value) : fieldEntries.filter(entry => entry.key === yamlDefinition.value);
  const seen = new Set();
  let total = 0;
  let displayed = 0;
  let truncated = false;
  for (const entry of entries) {
    const section = yamlElement('section', undefined, 'field-definition-section');
    section.append(yamlElement('h4', entry.label));
    if (!filtered && entry.description) section.append(yamlTextDetails('תיאור הפעולה', entry.description));
    for (const definition of entry.sections) {
      const inspection = fieldInspection(definition.schema, definition.options);
      truncated ||= inspection.truncated;
      const rows = inspection.rows.filter(row => {
        if (!fieldMatches(row, query)) return false;
        if (filtered) {
          const key = `${row.sourcePointer}:${row.path}:${row.branch}:${row.required}`;
          if (seen.has(key)) return false;
          seen.add(key);
        }
        return true;
      });
      total += rows.length;
      const visible = rows.slice(0, Math.max(0, 300 - displayed));
      displayed += visible.length;
      if (!visible.length) continue;
      section.append(yamlElement('h5', definition.label), yamlSchemaTable(definition.schema, { ...definition.options, inspection: { rows: visible, truncated: false } }));
      if (!filtered) section.append(yamlJsonDetails('הגדרה גולמית', definition.schema));
    }
    if (section.querySelector('table')) yamlDocumentation.append(section);
  }
  const category = yamlDefinitionKind.value === 'schema' ? 'Schemas' : 'בקשות API';
  fieldSearchStatus.textContent = filtered ? `${total} שדות תואמים בקבוצת ${category}${displayed < total ? ` · מוצגים ${displayed}, צמצם את החיפוש` : ''}` : `${total} שדות בהגדרה הנבחרת${displayed < total ? ` · מוצגים ${displayed}` : ''}`;
  if (!displayed) yamlDocumentation.append(yamlElement('p', 'לא נמצאו שדות תואמים. נסה לשנות את החיפוש או המסננים.', 'workspace-empty'));
  if (truncated) yamlDocumentation.append(yamlElement('p', 'הגדרות גדולות מוגבלות ל־2,000 שדות; כל ההגדרה זמינה במקור.', 'yaml-schema-note'));
  if (!filtered && yamlPreviewData.specification.info?.description) yamlDocumentation.append(yamlTextDetails('תיאור ה־API המלא', yamlPreviewData.specification.info.description));
}
function highlightYamlField(pointer) {
  const lineNumber = yamlPreviewData.sourceLocations?.[pointer];
  const line = yamlLines[lineNumber - 1];
  if (!line) return;
  yamlSource.querySelectorAll('.selected-field').forEach(element => element.classList.remove('selected-field'));
  line.element.classList.add('selected-field');
  yamlSource.scrollTop = Math.max(0, line.element.offsetTop - yamlLines[0].element.offsetTop - 30);
  yamlSource.scrollLeft = 0;
  yamlPreviewStatus.textContent = `הגדרת השדה במקור — שורה ${lineNumber}`;
  yamlSource.focus({ preventScroll: true });
}
yamlDefinitionKind.addEventListener('change', () => {
  populateFieldDefinitions();
  searchYamlPreview();
  yamlDocumentation.scrollTop = 0;
});
yamlDefinition.addEventListener('change', () => {
  yamlSearch.value = '';
  fieldFilterInputs.forEach(input => { input.checked = false; });
  searchYamlPreview();
  yamlDocumentation.scrollTop = 0;
});
fieldFilterInputs.forEach(input => input.addEventListener('change', () => searchYamlPreview()));

const yamlDivider = document.querySelector('#yamlDivider');
const yamlSplit = document.querySelector('.yaml-split');
const splitPreferenceKey = 'openvalidator.yamlSourcePercent';
let yamlSourcePercent = 28;
function setYamlPaneRatio(value, persist = false) {
  yamlSourcePercent = Math.max(18, Math.min(60, Number.isFinite(value) ? value : 28));
  yamlSplit.style.setProperty('--yaml-source-share', `${yamlSourcePercent}fr`);
  yamlSplit.style.setProperty('--yaml-fields-share', `${100 - yamlSourcePercent}fr`);
  yamlDivider.setAttribute('aria-valuenow', String(Math.round(yamlSourcePercent)));
  yamlDivider.setAttribute('aria-valuetext', `YAML ${Math.round(yamlSourcePercent)}%, שדות ${Math.round(100 - yamlSourcePercent)}%`);
  if (persist) { try { localStorage.setItem(splitPreferenceKey, String(yamlSourcePercent)); } catch {} }
}
try { const saved = localStorage.getItem(splitPreferenceKey); if (saved !== null) yamlSourcePercent = Number(saved); } catch {}
setYamlPaneRatio(yamlSourcePercent);
yamlDivider.addEventListener('pointerdown', event => {
  if (event.button !== 0 || !matchMedia('(min-width: 761px)').matches) return;
  event.preventDefault();
  yamlDivider.setPointerCapture(event.pointerId);
  yamlDivider.classList.add('dragging');
});
yamlDivider.addEventListener('pointermove', event => {
  if (!yamlDivider.hasPointerCapture(event.pointerId)) return;
  const box = yamlSplit.getBoundingClientRect();
  setYamlPaneRatio((event.clientX - box.left) / (box.width - 10) * 100);
});
function endYamlResize(event) {
  if (yamlDivider.hasPointerCapture(event.pointerId)) yamlDivider.releasePointerCapture(event.pointerId);
  yamlDivider.classList.remove('dragging');
  setYamlPaneRatio(yamlSourcePercent, true);
}
yamlDivider.addEventListener('pointerup', endYamlResize);
yamlDivider.addEventListener('pointercancel', endYamlResize);
yamlDivider.addEventListener('keydown', event => {
  const value = { ArrowLeft: yamlSourcePercent - 2, ArrowRight: yamlSourcePercent + 2, Home: 18, End: 60 }[event.key];
  if (value === undefined) return;
  event.preventDefault();
  setYamlPaneRatio(value, true);
});
yamlDivider.addEventListener('dblclick', () => setYamlPaneRatio(28, true));
