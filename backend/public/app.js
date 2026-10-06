const output = document.querySelector("#output");
const resultSummary = document.querySelector("#resultSummary");
const specificationFile = document.querySelector("#specificationFile");
const specificationPath = document.querySelector("#specificationPath");
const requestPath = document.querySelector("#requestPath");
const methodSelect = document.querySelector("#method");
const specificationStatus = document.querySelector("#specificationStatus");
const savedSpecification = document.querySelector("#savedSpecification");
const specificationId = document.querySelector("#specificationId");
const specificationName = document.querySelector("#specificationName");
const specificationVersion = document.querySelector("#specificationVersion");
const validationMode = document.querySelector("#validationMode");
const requestBlock = document.querySelector("#requestBlock");
const responseBlock = document.querySelector("#responseBlock");
const requestMetadataFields = document.querySelector("#requestMetadataFields");
const statusCodeField = document.querySelector("#statusCodeField");
const deleteSpecificationButton = document.querySelector("#deleteSpecification");
const historyList = document.querySelector("#historyList");
const specificationContent = document.querySelector("#specificationContent");
const specificationFileName = document.querySelector("#specificationFileName");
const uploadSpecificationSource = document.querySelector("#uploadSpecificationSource");
const pasteSpecificationSource = document.querySelector("#pasteSpecificationSource");
const specificationSource = document.querySelector("#specificationSource");
const loadPastedSpecificationButton = document.querySelector("#loadPastedSpecification");
const compareForm = document.querySelector("#compareForm");
const compareUploadSource = document.querySelector("#compareUploadSource");
const comparePasteSource = document.querySelector("#comparePasteSource");
const chooseCompareUpload = document.querySelector("#chooseCompareUpload");
const chooseComparePaste = document.querySelector("#chooseComparePaste");
const oldSpecificationContent = document.querySelector("#oldSpecificationContent");
const newSpecificationContent = document.querySelector("#newSpecificationContent");
const xmlForm = document.querySelector("#xmlForm");
const xmlUploadSource = document.querySelector("#xmlUploadSource");
const xmlPasteSource = document.querySelector("#xmlPasteSource");
const chooseXmlUpload = document.querySelector("#chooseXmlUpload");
const chooseXmlPaste = document.querySelector("#chooseXmlPaste");
const xsdContent = document.querySelector("#xsdContent");
const xmlContent = document.querySelector("#xmlContent");
const xsdFieldsForm = document.querySelector("#xsdFieldsForm");
const xsdFieldsResult = document.querySelector("#xsdFieldsResult");
const xsdFieldsSummary = document.querySelector("#xsdFieldsSummary");
const xsdFieldsBody = document.querySelector("#xsdFieldsBody");
const xsdFieldsStatus = document.querySelector("#xsdFieldsStatus");
const copyXsdFields = document.querySelector("#copyXsdFields");
const downloadXsdFields = document.querySelector("#downloadXsdFields");
const xsdFieldsUploadSource = document.querySelector("#xsdFieldsUploadSource");
const xsdFieldsPasteSource = document.querySelector("#xsdFieldsPasteSource");
const chooseXsdFieldsUpload = document.querySelector("#chooseXsdFieldsUpload");
const chooseXsdFieldsPaste = document.querySelector("#chooseXsdFieldsPaste");
const xsdFieldsContent = document.querySelector("#xsdFieldsContent");
const validateForm = document.querySelector("#validateForm");
const requestBaseUrl = document.querySelector("#requestBaseUrl");
const requestPreview = document.querySelector("#requestPreview");
const responsePreview = document.querySelector("#responsePreview");
const requestPreviewMeta = document.querySelector("#requestPreviewMeta");
const responsePreviewMeta = document.querySelector("#responsePreviewMeta");
const exportFormat = document.querySelector("#exportFormat");
const exportPreview = document.querySelector("#exportPreview");
const copyStatus = document.querySelector("#copyStatus");
const exchangeDialog = document.querySelector("#exchangeDialog");
const closeExchangePreview = document.querySelector("#closeExchangePreview");
const generateAllExamplesButton = document.querySelector("#generateExamples");
const exampleScope = document.querySelector("#exampleScope");
const exampleOperation = document.querySelector("#exampleOperation");
const examplesStatus = document.querySelector("#examplesStatus");
const showSelectedApi = document.querySelector("#showSelectedApi");
const showAllApis = document.querySelector("#showAllApis");
const selectedApiPreviewPanel = document.querySelector("#selectedApiPreviewPanel");
const allApisPreviewPanel = document.querySelector("#allApisPreviewPanel");
const allApisCount = document.querySelector("#allApisCount");
const allApisSummary = document.querySelector("#allApisSummary");
const allApisList = document.querySelector("#allApisList");
const expandAllApis = document.querySelector("#expandAllApis");
const collapseAllApis = document.querySelector("#collapseAllApis");
const resultExportActions = document.querySelector("#resultExportActions");
const resultExportStatus = document.querySelector("#resultExportStatus");
const copyResultDocument = document.querySelector("#copyResultDocument");
const downloadResultHtml = document.querySelector("#downloadResultHtml");
const emailResult = document.querySelector("#emailResult");

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options", "trace"];
const HTTP_STATUS_TEXT = {
  100: "Continue", 200: "OK", 201: "Created", 202: "Accepted", 204: "No Content",
  301: "Moved Permanently", 302: "Found", 304: "Not Modified", 400: "Bad Request",
  401: "Unauthorized", 403: "Forbidden", 404: "Not Found", 409: "Conflict",
  422: "Unprocessable Entity", 429: "Too Many Requests", 500: "Internal Server Error",
  502: "Bad Gateway", 503: "Service Unavailable", 504: "Gateway Timeout",
};
const postmanCollectionId = globalThis.crypto?.randomUUID?.() || `openvalidator-${Date.now()}`;
let specificationOperations = new Map();
let exchangeFormats = { request: "", response: "", markdown: "", curl: "", postman: "" };
let selectedExchangeFormats = { request: "", response: "", markdown: "", curl: "", postman: "" };
let allApiFormats = { request: "", response: "", markdown: "", curl: "", postman: "" };
let extractedXsdFields = [];
let allApiExamples = [];
let allApisSpecificationId = "";
let exchangeScope = "selected";
let lastResultExport = null;

function formFieldValue(name) {
  const field = validateForm.elements.namedItem(name);
  return typeof field?.value === "string" ? field.value.trim() : "";
}

function parsePreviewJson(name, fallback) {
  const raw = formFieldValue(name);
  if (!raw) return { raw: "", value: fallback, valid: true, present: false };

  try {
    return { raw, value: JSON.parse(raw), valid: true, present: true };
  } catch {
    return { raw, value: fallback, valid: false, present: true };
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function printableValue(value) {
  if (typeof value === "string") return value;
  const serialized = JSON.stringify(value);
  return serialized === undefined ? String(value) : serialized;
}

function formatBody(snapshot) {
  if (!snapshot.present) return "";
  if (!snapshot.valid) return snapshot.raw;
  if (typeof snapshot.value === "string") return snapshot.value;
  return JSON.stringify(snapshot.value, null, 2);
}

function formatPostmanBody(snapshot) {
  if (!snapshot.present) return "";
  if (snapshot.valid && typeof snapshot.value !== "string") {
    return JSON.stringify(snapshot.value) ?? "";
  }
  return formatBody(snapshot).replace(/\r?\n\s*/g, " ");
}

function headerEntries(snapshot) {
  if (!snapshot.valid || !isRecord(snapshot.value)) return [];
  return Object.entries(snapshot.value).map(([key, value]) => [key, printableValue(value)]);
}

function appendQuery(path, snapshot) {
  const requestTarget = path.trim() || "/";
  if (!snapshot.valid || !isRecord(snapshot.value) || Object.keys(snapshot.value).length === 0) {
    return requestTarget;
  }

  const hashIndex = requestTarget.indexOf("#");
  const hash = hashIndex >= 0 ? requestTarget.slice(hashIndex) : "";
  const targetWithoutHash = hashIndex >= 0 ? requestTarget.slice(0, hashIndex) : requestTarget;
  const params = new URLSearchParams();

  Object.entries(snapshot.value).forEach(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];
    values.forEach((item) => params.append(key, item === null ? "" : printableValue(item)));
  });

  const serialized = params.toString();
  if (!serialized) return requestTarget;
  const separator = targetWithoutHash.includes("?") ? "&" : "?";
  return `${targetWithoutHash}${separator}${serialized}${hash}`;
}

function normalizedBaseUrl() {
  const value = requestBaseUrl.value.trim();
  if (!value) return "";
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

function absoluteRequestUrl(path) {
  const baseUrl = normalizedBaseUrl();
  if (!baseUrl) return path;
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

function requestHost() {
  try {
    return new URL(normalizedBaseUrl()).host;
  } catch {
    return "";
  }
}

function currentSpecificationLabel() {
  const typedName = specificationName.value.trim();
  if (typedName) return typedName;
  if (savedSpecification.value) {
    return savedSpecification.options[savedSpecification.selectedIndex]?.textContent?.trim() || "OpenValidator API";
  }
  return "OpenValidator API";
}

function collectExchangeDetails() {
  const headers = parsePreviewJson("headers", {});
  const query = parsePreviewJson("query", {});
  const requestBody = parsePreviewJson("requestBody", null);
  const responseHeaders = parsePreviewJson("responseHeaders", {});
  const responseBody = parsePreviewJson("responseBody", null);
  const path = appendQuery(requestPath.value || "/", query);
  const method = methodSelect.value || "GET";
  const statusCodeValue = Number(formFieldValue("statusCode"));
  const statusCode = Number.isInteger(statusCodeValue) && statusCodeValue >= 100 && statusCodeValue <= 599
    ? statusCodeValue
    : 200;

  return {
    method,
    templatePath: requestPath.value || "/",
    path,
    url: absoluteRequestUrl(path),
    host: requestHost(),
    headers,
    query,
    requestBody,
    requestBodyText: formatBody(requestBody),
    statusCode,
    statusText: HTTP_STATUS_TEXT[statusCode] || "Response",
    responseHeaders,
    responseBody,
    responseBodyText: formatBody(responseBody),
  };
}

function invalidJsonWarning(label, snapshot) {
  if (snapshot.valid || !snapshot.present) return [];
  return [`# WARNING: ${label} is not valid JSON`, snapshot.raw];
}

function formatRawRequest(details) {
  const headers = headerEntries(details.headers);
  const hasHostHeader = headers.some(([name]) => name.toLowerCase() === "host");
  const lines = [`${details.method} ${details.path} HTTP/1.1`];

  if (details.host && !hasHostHeader) lines.push(`Host: ${details.host}`);
  headers.forEach(([name, value]) => lines.push(`${name}: ${value}`));
  lines.push(...invalidJsonWarning("Headers", details.headers));
  lines.push(...invalidJsonWarning("Query", details.query));
  lines.push("");
  if (details.requestBodyText) lines.push(details.requestBodyText);
  return lines.join("\n");
}

function formatRawResponse(details) {
  const lines = [`HTTP/1.1 ${details.statusCode} ${details.statusText}`];
  headerEntries(details.responseHeaders).forEach(([name, value]) => lines.push(`${name}: ${value}`));
  lines.push(...invalidJsonWarning("Response headers", details.responseHeaders));
  lines.push("");
  if (details.responseBodyText) lines.push(details.responseBodyText);
  return lines.join("\n");
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

function buildCurl(details) {
  const parts = [
    `curl --request ${details.method}`,
    `  --url ${shellQuote(details.url)}`,
  ];

  headerEntries(details.headers).forEach(([name, value]) => {
    parts.push(`  --header ${shellQuote(`${name}: ${value}`)}`);
  });
  if (details.requestBodyText) parts.push(`  --data-raw ${shellQuote(details.requestBodyText)}`);
  return parts.join(" \\\n");
}

function postmanHeaders(snapshot) {
  return headerEntries(snapshot).map(([key, value]) => ({ key, value, type: "text" }));
}

function buildPostmanItem(details) {
  const requestBodyText = formatPostmanBody(details.requestBody);
  const responseBodyText = formatPostmanBody(details.responseBody);
  const postmanRequest = {
    method: details.method,
    header: postmanHeaders(details.headers),
    url: details.url,
  };

  if (requestBodyText) {
    postmanRequest.body = {
      mode: "raw",
      raw: requestBodyText,
      options: { raw: { language: details.requestBody.valid ? "json" : "text" } },
    };
  }

  const response = {
    name: `${details.statusCode} ${details.statusText}`,
    originalRequest: JSON.parse(JSON.stringify(postmanRequest)),
    status: details.statusText,
    code: details.statusCode,
    _postman_previewlanguage: details.responseBody.valid ? "json" : "text",
    header: postmanHeaders(details.responseHeaders),
    cookie: [],
    body: responseBodyText,
  };

  return {
    name: `${details.method} ${details.templatePath || details.path}`,
    request: postmanRequest,
    response: [response],
  };
}

function buildPostmanCollection(input) {
  const detailsList = Array.isArray(input) ? input : [input];
  const collectionSuffix = detailsList.length === 1
    ? `${detailsList[0].method} ${detailsList[0].templatePath || detailsList[0].path}`
    : `All APIs (${detailsList.length})`;

  return {
    info: {
      _postman_id: postmanCollectionId,
      name: `${currentSpecificationLabel()} — ${collectionSuffix}`,
      description: "Generated by OpenValidator from the Request / Response workspace.",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: detailsList.map(buildPostmanItem),
  };
}

function buildMarkdown(details, rawRequest, rawResponse) {
  return [
    "# API Request / Response",
    "",
    `- **Specification:** ${currentSpecificationLabel()}`,
    `- **Operation:** ${details.method} ${details.templatePath || details.path}`,
    `- **URL:** ${details.url}`,
    "",
    "## Request",
    "",
    "```http",
    rawRequest,
    "```",
    "",
    "## Response",
    "",
    "```http",
    rawResponse,
    "```",
  ].join("\n");
}

function updateExportPreview() {
  exportPreview.textContent = exchangeFormats[exportFormat.value] || "";
}

function updateExchangePreview() {
  const details = collectExchangeDetails();
  const rawRequest = formatRawRequest(details);
  const rawResponse = formatRawResponse(details);

  selectedExchangeFormats = {
    request: rawRequest,
    response: rawResponse,
    markdown: buildMarkdown(details, rawRequest, rawResponse),
    curl: buildCurl(details),
    postman: JSON.stringify(buildPostmanCollection(details), null, 2),
  };

  if (exchangeScope === "selected") exchangeFormats = selectedExchangeFormats;

  requestPreview.textContent = rawRequest;
  responsePreview.textContent = rawResponse;
  requestPreviewMeta.textContent = `${details.method} · ${details.url}`;
  responsePreviewMeta.textContent = `${details.statusCode} · ${details.statusText}`;
  if (exchangeScope === "selected") updateExportPreview();
}

function generatedSnapshot(value, fallback) {
  const present = value !== undefined;
  return {
    raw: present ? (typeof value === "string" ? value : JSON.stringify(value)) : "",
    value: present ? value : fallback,
    valid: true,
    present,
  };
}

function detailsFromGeneratedExample(example) {
  const headers = generatedSnapshot(example.request?.headers, {});
  const query = generatedSnapshot(example.request?.query, {});
  const requestBody = generatedSnapshot(example.request?.body, null);
  const responseHeaders = generatedSnapshot(example.response?.headers, {});
  const responseBody = generatedSnapshot(example.response?.body, null);
  const path = appendQuery(example.path || example.templatePath || "/", query);
  const statusCode = Number.isInteger(Number(example.statusCode)) ? Number(example.statusCode) : 200;

  return {
    method: example.method || "GET",
    templatePath: example.templatePath || example.path || "/",
    path,
    url: absoluteRequestUrl(path),
    host: requestHost(),
    headers,
    query,
    requestBody,
    requestBodyText: formatBody(requestBody),
    statusCode,
    statusText: HTTP_STATUS_TEXT[statusCode] || "Response",
    responseHeaders,
    responseBody,
    responseBodyText: formatBody(responseBody),
  };
}

function buildAllMarkdown(detailsList) {
  const lines = [
    "# API Catalog",
    "",
    `- **Specification:** ${currentSpecificationLabel()}`,
    `- **Base URL:** ${normalizedBaseUrl() || "Not specified"}`,
    `- **Operations:** ${detailsList.length}`,
    "",
  ];

  detailsList.forEach((details, index) => {
    lines.push(
      `## ${index + 1}. ${details.method} ${details.templatePath}`,
      "",
      "### Request",
      "",
      "```http",
      formatRawRequest(details),
      "```",
      "",
      "### Response",
      "",
      "```http",
      formatRawResponse(details),
      "```",
      "",
    );
  });

  return lines.join("\n");
}

function createAllApiExchangeCard(title, eyebrow, meta, text) {
  const card = document.createElement("article");
  card.className = "exchange-card";

  const header = document.createElement("header");
  header.className = "exchange-card-header";
  const heading = document.createElement("div");
  const eyebrowElement = document.createElement("span");
  eyebrowElement.className = "eyebrow";
  eyebrowElement.textContent = eyebrow;
  const titleElement = document.createElement("strong");
  titleElement.textContent = title;
  const metaElement = document.createElement("small");
  metaElement.textContent = meta;
  heading.append(eyebrowElement, titleElement, metaElement);
  header.appendChild(heading);

  const code = document.createElement("pre");
  code.className = "exchange-code";
  code.textContent = text;
  card.append(header, code);
  return card;
}

function renderAllApiExamples() {
  const detailsList = allApiExamples.map(detailsFromGeneratedExample);
  allApisList.replaceChildren();
  allApisCount.textContent = detailsList.length ? `(${detailsList.length})` : "";
  allApisSummary.textContent = detailsList.length
    ? `${detailsList.length} operations הופקו מה־YAML`
    : "לא נמצאו operations ב־YAML";

  if (detailsList.length === 0) {
    const empty = document.createElement("div");
    empty.className = "all-apis-empty";
    empty.textContent = "לא נמצאו paths עם methods נתמכים ב־specification.";
    allApisList.appendChild(empty);
  }

  detailsList.forEach((details, index) => {
    const rawRequest = formatRawRequest(details);
    const rawResponse = formatRawResponse(details);
    const item = document.createElement("details");
    item.className = "all-api-item";
    item.open = index === 0;

    const summary = document.createElement("summary");
    const title = document.createElement("span");
    title.className = "all-api-title";
    const method = document.createElement("span");
    method.className = "api-method";
    method.textContent = details.method;
    const path = document.createElement("span");
    path.className = "all-api-path";
    path.textContent = details.templatePath;
    const status = document.createElement("span");
    status.className = "api-status";
    status.textContent = `${details.statusCode} ${details.statusText}`;
    title.append(method, path);
    summary.append(title, status);

    const content = document.createElement("div");
    content.className = "all-api-content";
    const grid = document.createElement("div");
    grid.className = "exchange-grid";
    grid.append(
      createAllApiExchangeCard("Request מלא", "FULL HTTP REQUEST", details.url, rawRequest),
      createAllApiExchangeCard("Response מלא", "FULL HTTP RESPONSE", `${details.statusCode} · ${details.statusText}`, rawResponse),
    );
    const copyRow = document.createElement("div");
    copyRow.className = "all-api-copy-row";
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "ghost-button compact-button";
    copyButton.textContent = "העתק API זה למסמך";
    copyButton.onclick = () => copyExchangeText(buildMarkdown(details, rawRequest, rawResponse), `${details.method} ${details.templatePath}`);
    copyRow.appendChild(copyButton);
    content.append(grid, copyRow);
    item.append(summary, content);
    allApisList.appendChild(item);
  });

  allApiFormats = {
    request: detailsList.map((details) => formatRawRequest(details)).join("\n\n---\n\n"),
    response: detailsList.map((details) => formatRawResponse(details)).join("\n\n---\n\n"),
    markdown: buildAllMarkdown(detailsList),
    curl: detailsList.map((details) => `# ${details.method} ${details.templatePath}\n${buildCurl(details)}`).join("\n\n"),
    postman: JSON.stringify(buildPostmanCollection(detailsList), null, 2),
  };

  if (exchangeScope === "all") {
    exchangeFormats = allApiFormats;
    updateExportPreview();
  }
}

function setExchangeScope(scope) {
  exchangeScope = scope === "all" ? "all" : "selected";
  const showingAll = exchangeScope === "all";
  selectedApiPreviewPanel.hidden = showingAll;
  allApisPreviewPanel.hidden = !showingAll;
  showSelectedApi.classList.toggle("active", !showingAll);
  showAllApis.classList.toggle("active", showingAll);
  showSelectedApi.setAttribute("aria-pressed", String(!showingAll));
  showAllApis.setAttribute("aria-pressed", String(showingAll));
  exchangeFormats = showingAll ? allApiFormats : selectedExchangeFormats;
  updateExportPreview();
}

function resetAllApiExamples() {
  allApiExamples = [];
  allApisSpecificationId = "";
  allApiFormats = { request: "", response: "", markdown: "", curl: "", postman: "" };
  allApisCount.textContent = "";
  allApisSummary.textContent = "טרם הופקו APIs מה־YAML";
  allApisList.replaceChildren();
  if (exchangeScope === "all") setExchangeScope("selected");
}

async function generateAllExamples() {
  if (!specificationId.value) throw new Error("יש לבחור specification שמור לפני הפקת כל ה־APIs");
  const originalLabel = generateAllExamplesButton.textContent;
  generateAllExamplesButton.disabled = true;
  generateAllExamplesButton.textContent = "מפיק את כל ה־APIs…";

  try {
    const response = await fetch("/api/v1/examples/generate-all", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ specificationId: specificationId.value }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || "הפקת כל ה־APIs נכשלה");

    allApiExamples = Array.isArray(data.examples) ? data.examples : [];
    allApisSpecificationId = specificationId.value;
    renderAllApiExamples();
    setExchangeScope("all");
    showExchangeDialog();
    resultSummary.classList.remove("hidden", "invalid");
    resultSummary.classList.add("valid");
    resultSummary.textContent = `${allApiExamples.length} operations הופקו מה־YAML ומוכנים להעתקה.`;
  } finally {
    generateAllExamplesButton.disabled = false;
    generateAllExamplesButton.textContent = originalLabel;
  }
}

function setCopyStatus(message, state = "success") {
  copyStatus.textContent = message;
  copyStatus.className = `copy-status ${state}`;
}

async function writeClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.appendChild(helper);
  helper.select();
  const copied = document.execCommand("copy");
  helper.remove();
  if (!copied) throw new Error("Copy command was rejected");
}

async function copyExchangeText(text, label) {
  try {
    await writeClipboard(text);
    setCopyStatus(`${label} הועתק ללוח.`);
  } catch {
    setCopyStatus("ההעתקה נחסמה בדפדפן. ניתן לסמן את התוכן ולהעתיק ידנית.", "error");
  }
}

function resultSourceLabel(source) {
  return {
    validate: "API Validation",
    compare: "Specification Comparison",
    xml: "XML / XSD Validation",
    history: "Validation History",
  }[source] || "Validation Result";
}

function currentResultMetadata(source) {
  if (source === "validate") {
    return {
      Specification: currentSpecificationLabel(),
      Operation: `${methodSelect.value || "GET"} ${requestPath.value || "/"}`,
      "Validation mode": validationMode.value || "Not selected",
      "Base URL": normalizedBaseUrl() || "Not specified",
    };
  }
  return { Tool: resultSourceLabel(source) };
}

function setLastResultExport({ data, rawText, valid, source, summary, metadata, exchangeDetails, createdAt }) {
  lastResultExport = {
    data,
    rawText,
    valid,
    source,
    summary,
    metadata: metadata || currentResultMetadata(source),
    exchangeDetails: exchangeDetails || null,
    createdAt: createdAt || new Date().toISOString(),
  };
  resultExportActions.hidden = false;
  resultExportStatus.textContent = "";
  resultExportStatus.className = "result-export-status";
}

function clearLastResultExport() {
  renderReadableResult(null);
  lastResultExport = null;
  resultExportActions.hidden = true;
  resultExportStatus.textContent = "";
  resultExportStatus.className = "result-export-status";
}

function resultText() {
  if (!lastResultExport) return "";
  if (lastResultExport.data !== undefined) {
    if (typeof lastResultExport.data === "string") return lastResultExport.data;
    return JSON.stringify(lastResultExport.data, null, 2);
  }
  return lastResultExport.rawText || "";
}

function resultMetadataLines() {
  if (!lastResultExport) return [];
  return Object.entries(lastResultExport.metadata || {}).map(([key, value]) => `- **${key}:** ${value}`);
}

function buildResultMarkdown() {
  if (!lastResultExport) return "";
  const status = lastResultExport.valid ? "PASS" : "FAIL";
  const details = lastResultExport.exchangeDetails;
  const lines = [
    `# OpenValidator — ${resultSourceLabel(lastResultExport.source)}`,
    "",
    `- **Status:** ${status}`,
    `- **Summary:** ${lastResultExport.summary}`,
    `- **Generated:** ${new Date(lastResultExport.createdAt).toLocaleString("he-IL")}`,
    ...resultMetadataLines(),
    "",
  ];

  if (details) {
    lines.push(
      "## Request",
      "",
      "```http",
      formatRawRequest(details),
      "```",
      "",
      "## Response",
      "",
      "```http",
      formatRawResponse(details),
      "```",
      "",
    );
  }

  lines.push(
    "## Validation Result",
    "",
    "```json",
    resultText(),
    "```",
  );
  return lines.join("\n");
}

function buildResultPlainText() {
  if (!lastResultExport) return "";
  const status = lastResultExport.valid ? "PASS" : "FAIL";
  const lines = [
    `OpenValidator - ${resultSourceLabel(lastResultExport.source)}`,
    `Status: ${status}`,
    `Summary: ${lastResultExport.summary}`,
    `Generated: ${new Date(lastResultExport.createdAt).toLocaleString("he-IL")}`,
    ...Object.entries(lastResultExport.metadata || {}).map(([key, value]) => `${key}: ${value}`),
    "",
  ];
  const details = lastResultExport.exchangeDetails;
  if (details) {
    lines.push("REQUEST", formatRawRequest(details), "", "RESPONSE", formatRawResponse(details), "");
  }
  lines.push("VALIDATION RESULT", resultText());
  return lines.join("\n");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildResultHtml() {
  if (!lastResultExport) return "";
  const status = lastResultExport.valid ? "PASS" : "FAIL";
  const statusClass = lastResultExport.valid ? "pass" : "fail";
  const metadata = Object.entries(lastResultExport.metadata || {})
    .map(([key, value]) => `<div><strong>${escapeHtml(key)}</strong><span>${escapeHtml(value)}</span></div>`)
    .join("");
  const details = lastResultExport.exchangeDetails;
  const exchangeSections = details ? `
    <section><h2>Request</h2><pre>${escapeHtml(formatRawRequest(details))}</pre></section>
    <section><h2>Response</h2><pre>${escapeHtml(formatRawResponse(details))}</pre></section>` : "";

  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>OpenValidator - ${escapeHtml(resultSourceLabel(lastResultExport.source))}</title>
  <style>
    body{margin:0;background:#f4f7fb;color:#172033;font:14px/1.55 Arial,sans-serif}main{max-width:960px;margin:28px auto;padding:0 18px}.report{padding:26px;border:1px solid #dbe3ef;border-radius:14px;background:white;box-shadow:0 12px 35px #0f172a12}h1{margin:0 0 8px;color:#172554;font-size:26px}h2{margin:24px 0 9px;color:#1e3a8a;font-size:17px}.status{display:inline-block;margin:6px 0 16px;padding:7px 12px;border-radius:999px;font-weight:800}.pass{background:#e8f7ef;color:#087443}.fail{background:#fff0f1;color:#b4233c}.summary{color:#475569}.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:16px}.meta div{padding:10px;border:1px solid #e2e8f0;border-radius:8px}.meta strong,.meta span{display:block}.meta strong{color:#64748b;font-size:11px}.meta span{margin-top:2px;direction:ltr;text-align:left}pre{padding:16px;overflow:auto;border-radius:9px;background:#111827;color:#dbeafe;direction:ltr;text-align:left;white-space:pre-wrap;word-break:break-word;font:12px/1.55 Consolas,monospace}@media(max-width:650px){.meta{grid-template-columns:1fr}.report{padding:18px}}
  </style>
</head>
<body><main><article class="report">
  <h1>OpenValidator — ${escapeHtml(resultSourceLabel(lastResultExport.source))}</h1>
  <div class="status ${statusClass}">${status}</div>
  <div class="summary">${escapeHtml(lastResultExport.summary)}</div>
  <div class="meta"><div><strong>Generated</strong><span>${escapeHtml(new Date(lastResultExport.createdAt).toLocaleString("he-IL"))}</span></div>${metadata}</div>
  ${exchangeSections}
  <section><h2>Validation Result</h2><pre>${escapeHtml(resultText())}</pre></section>
</article></main></body></html>`;
}

function resultFileName(extension) {
  const operation = lastResultExport?.metadata?.Operation || resultSourceLabel(lastResultExport?.source);
  const safeOperation = String(operation).replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "result";
  const date = new Date().toISOString().slice(0, 10);
  return `openvalidator-${safeOperation}-${date}.${extension}`;
}

function downloadResultFile(content, type, fileName) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function setResultExportStatus(message, state = "success") {
  resultExportStatus.textContent = message;
  resultExportStatus.className = `result-export-status ${state === "error" ? "error" : ""}`.trim();
}

async function copyResultForDocument() {
  const markdown = buildResultMarkdown();
  const html = buildResultHtml();
  try {
    if (navigator.clipboard?.write && globalThis.ClipboardItem && window.isSecureContext) {
      const item = new ClipboardItem({
        "text/plain": new Blob([markdown], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
      });
      await navigator.clipboard.write([item]);
    } else {
      await writeClipboard(markdown);
    }
    setResultExportStatus("התוצאה הועתקה ומוכנה להדבקה במסמך או במייל.");
  } catch {
    try {
      await writeClipboard(markdown);
      setResultExportStatus("התוצאה הועתקה כ־Markdown.");
    } catch {
      setResultExportStatus("הדפדפן חסם את ההעתקה. ניתן להשתמש בהורדת HTML.", "error");
    }
  }
}

function buildResultMailto() {
  if (!lastResultExport) return "";
  const status = lastResultExport.valid ? "PASS" : "FAIL";
  const operation = lastResultExport.metadata?.Operation || resultSourceLabel(lastResultExport.source);
  const subject = `OpenValidator ${status} - ${operation}`;
  const fullBody = buildResultPlainText();
  const maximumBodyLength = 12000;
  const body = fullBody.length > maximumBodyLength
    ? `${fullBody.slice(0, maximumBodyLength)}\n\n[התוצאה קוצרה עבור המייל. יש לצרף את דוח ה-HTML המלא.]`
    : fullBody;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function showExchangeDialog() {
  updateExchangePreview();
  setCopyStatus("", "");
  if (typeof exchangeDialog.showModal === "function") {
    if (!exchangeDialog.open) exchangeDialog.showModal();
  } else {
    exchangeDialog.setAttribute("open", "");
  }
  document.body.classList.add("exchange-dialog-open");
}

function hideExchangeDialog() {
  if (typeof exchangeDialog.close === "function" && exchangeDialog.open) {
    exchangeDialog.close();
  } else {
    exchangeDialog.removeAttribute("open");
  }
  document.body.classList.remove("exchange-dialog-open");
}


function storedSpecificationLabel(item) {
  const uploadedAt = new Date(item.uploadedAt);
  const dateLabel = Number.isNaN(uploadedAt.getTime())
    ? ""
    : uploadedAt.toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });
  const displayName = item.name || item.fileName;
  const version = item.version && item.version !== "unspecified" ? ` · v${item.version}` : "";
  return `${displayName}${version}${dateLabel ? ` — ${dateLabel}` : ""}`;
}

async function refreshStoredSpecifications(selectedId = "") {
  const response = await fetch("/api/v1/specifications");
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "לא ניתן לטעון specifications שמורים");
  }

  savedSpecification.innerHTML = '<option value="">בחר specification שמור</option>';
  data.specifications.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = storedSpecificationLabel(item);
    option.dataset.fileName = item.fileName;
    savedSpecification.appendChild(option);
  });

  if (selectedId) {
    savedSpecification.value = selectedId;
  }
  deleteSpecificationButton.disabled = !savedSpecification.value;


  if (data.specifications.length === 0) {
    savedSpecification.innerHTML = '<option value="">אין specifications שמורים</option>';
  }
}

async function loadStoredSpecification(id) {
  setYamlPreview(null);
  if (!id) {
    specificationId.value = "";
    resetAllApiExamples();
    return;
  }

  if (id !== allApisSpecificationId) resetAllApiExamples();

  setSpecificationStatus("טוען specification שמור…", "loading");
  specificationPath.disabled = true;
  specificationPath.innerHTML = '<option value="">טוען paths…</option>';

  const response = await fetch(`/api/v1/specifications/${encodeURIComponent(id)}`);
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "לא ניתן לטעון את ה־specification השמור");
  }

  specificationId.value = id;
  deleteSpecificationButton.disabled = false;
  specificationFile.value = "";
  specificationContent.value = "";
  setYamlPreview(data);
  const operations = extractOperations(data.specification);
  populateOperations(operations);
  const stored = data.storedSpecification;
  setSpecificationStatus(`${stored.name || stored.fileName}${stored.version && stored.version !== "unspecified" ? ` · v${stored.version}` : ""} · ${operations.length} operations`, "success");
}

function updateSummary(data, response) {
  resultSummary.classList.remove("valid", "invalid", "hidden");

  const valid = typeof data?.valid === "boolean"
    ? data.valid
    : response.ok && data?.success !== false;

  const errorCount = Array.isArray(data?.errors) ? data.errors.length : 0;
  resultSummary.classList.add(valid ? "valid" : "invalid");
  resultSummary.textContent = valid
    ? "הבדיקה הסתיימה בהצלחה — לא נמצאו שגיאות."
    : `הבדיקה נכשלה — נמצאו ${errorCount || "מספר"} שגיאות.`;
  return { valid, errorCount };
}

async function show(response) {
  const text = await response.text();
  const source = document.querySelector(".panel.active")?.id || "validate";

  try {
    const data = JSON.parse(text);
    output.textContent = JSON.stringify(data, null, 2);
    renderReadableResult(data);
    const summary = updateSummary(data, response);
    if (Array.isArray(data.errors) && data.errors.length) document.querySelector(".results").scrollIntoView({ behavior: "smooth", block: "start" });
    setLastResultExport({
      data,
      rawText: text,
      valid: summary.valid,
      source,
      summary: resultSummary.textContent,
      exchangeDetails: source === "validate" ? collectExchangeDetails() : null,
    });
  } catch {
    output.textContent = text;
    renderReadableResult({ message: text });
    resultSummary.classList.add("hidden");
    setLastResultExport({
      rawText: text,
      valid: response.ok,
      source,
      summary: response.ok ? "הפעולה הסתיימה בהצלחה." : "הפעולה נכשלה.",
      exchangeDetails: source === "validate" ? collectExchangeDetails() : null,
    });
  }
}

function setSpecificationStatus(message, state = "") {
  specificationStatus.textContent = message;
  specificationStatus.className = `spec-status ${state}`.trim();
}

function showClientError(message) {
  clearLastResultExport();
  resultSummary.classList.remove("hidden", "valid");
  resultSummary.classList.add("invalid");
  resultSummary.textContent = message;
  output.textContent = message;
  renderReadableResult({ message });
}

function selectToolSource(form, source, uploadPanel, pastePanel, uploadButton, pasteButton) {
  const paste = source === "paste";
  form.dataset.source = source;
  uploadPanel.hidden = paste;
  pastePanel.hidden = !paste;
  uploadButton.classList.toggle("active", !paste);
  pasteButton.classList.toggle("active", paste);
  uploadButton.setAttribute("aria-pressed", String(!paste));
  pasteButton.setAttribute("aria-pressed", String(paste));
}

function pastedFile(content, name, type) {
  return new File([content], name, { type });
}

function operationLabel(path, method, operation) {
  const summary = operation?.summary || operation?.operationId;
  return `${method.toUpperCase()}  ${path}${summary ? ` — ${summary}` : ""}`;
}

function extractOperations(specification) {
  const operations = [];
  const paths = specification?.paths;

  if (!paths || typeof paths !== "object") {
    return operations;
  }

  Object.entries(paths).forEach(([path, pathItem]) => {
    if (!pathItem || typeof pathItem !== "object") return;

    HTTP_METHODS.forEach((method) => {
      const operation = pathItem[method];
      if (operation && typeof operation === "object") {
        operations.push({ path, method: method.toUpperCase(), operation });
      }
    });
  });

  return operations.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

function populateOperations(operations) {
  specificationOperations = new Map();
  specificationPath.innerHTML = "";
  exampleOperation.replaceChildren();
  exampleOperation.disabled = operations.length === 0;

  if (operations.length === 0) {
    specificationPath.disabled = true;
    specificationPath.innerHTML = '<option value="">לא נמצאו paths בקובץ</option>';
    return;
  }

  operations.forEach((item, index) => {
    const key = `${item.method} ${item.path}`;
    specificationOperations.set(key, item);

    const option = document.createElement("option");
    option.value = key;
    option.textContent = operationLabel(item.path, item.method, item.operation);
    specificationPath.appendChild(option);

    if (index === 0) option.selected = true;
  });

  exampleOperation.replaceChildren(...Array.from(specificationPath.options, (option) => option.cloneNode(true)));
  specificationPath.disabled = false;
  applySelectedOperation();
}

function applySelectedOperation() {
  exampleOperation.value = specificationPath.value;
  const selected = specificationOperations.get(specificationPath.value);
  if (!selected) return;

  requestPath.value = selected.path;
  methodSelect.value = selected.method;
  updateExchangePreview();
}

function selectSpecificationSource(source) {
  const paste = source === "paste";
  uploadSpecificationSource.hidden = paste;
  pasteSpecificationSource.hidden = !paste;
  specificationSource.value = source;
}

async function loadPastedSpecification() {
  setYamlPreview(null);
  const content = specificationContent.value.trim();
  if (!content) {
    setSpecificationStatus("יש להדביק תוכן YAML או JSON", "error");
    return;
  }

  resetAllApiExamples();

  specificationOperations.clear();
  exampleOperation.replaceChildren(new Option("בחר קובץ YAML תחילה", ""));
  exampleOperation.disabled = true;
  specificationPath.disabled = true;
  specificationPath.innerHTML = '<option value="">טוען paths…</option>';
  setSpecificationStatus("קורא ושומר את התוכן המודבק…", "loading");

  const formData = new FormData();
  formData.append("specificationContent", content);
  formData.append("specificationName", specificationName.value.trim());
  formData.append("specificationVersion", specificationVersion.value.trim());
  formData.append("specificationFileName", specificationFileName.value || "pasted-specification.yaml");

  try {
    const response = await fetch("/api/v1/specifications/load", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || "לא ניתן לקרוא את התוכן");

    setYamlPreview(data);
    const operations = extractOperations(data.specification);
    populateOperations(operations);
    specificationId.value = data.storedSpecification?.id || "";
    specificationContent.value = "";
    await refreshStoredSpecifications(specificationId.value);
    const stored = data.storedSpecification;
    setSpecificationStatus(`${stored?.name || stored?.fileName || "Specification"}${stored?.version && stored.version !== "unspecified" ? ` · v${stored.version}` : ""} · ${operations.length} operations נשמרו ונטענו`, "success");
  } catch (error) {
    specificationPath.innerHTML = '<option value="">טעינת התוכן נכשלה</option>';
    setSpecificationStatus(error instanceof Error ? error.message : "טעינת התוכן נכשלה", "error");
  }
}

async function loadSpecificationPaths() {
  setYamlPreview(null);
  const file = specificationFile.files?.[0];

  resetAllApiExamples();
  specificationOperations.clear();
  exampleOperation.replaceChildren(new Option("בחר קובץ YAML תחילה", ""));
  exampleOperation.disabled = true;
  specificationPath.disabled = true;
  specificationPath.innerHTML = '<option value="">טוען paths…</option>';

  if (!file) {
    setSpecificationStatus("טרם נבחר קובץ");
    specificationPath.innerHTML = '<option value="">יש להעלות קובץ תחילה</option>';
    return;
  }

  setSpecificationStatus("קורא את ה־YAML…", "loading");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("specificationName", specificationName.value.trim());
  formData.append("specificationVersion", specificationVersion.value.trim());

  try {
    const response = await fetch("/api/v1/specifications/load", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "לא ניתן לקרוא את הקובץ");
    }

    setYamlPreview(data);
    const operations = extractOperations(data.specification);
    populateOperations(operations);
    specificationId.value = data.storedSpecification?.id || "";
    await refreshStoredSpecifications(specificationId.value);
    const stored = data.storedSpecification;
    setSpecificationStatus(`${stored?.name || stored?.fileName || file.name}${stored?.version && stored.version !== "unspecified" ? ` · v${stored.version}` : ""} · ${operations.length} operations נשמרו ונטענו`, "success");
  } catch (error) {
    specificationPath.innerHTML = '<option value="">טעינת הקובץ נכשלה</option>';
    setSpecificationStatus(error instanceof Error ? error.message : "טעינת הקובץ נכשלה", "error");
  }
}


async function deleteSelectedSpecification() {
  const id = savedSpecification.value;
  if (!id) return;
  const label = savedSpecification.options[savedSpecification.selectedIndex]?.textContent || "הקובץ";
  if (!window.confirm(`למחוק את ${label}? הפעולה אינה ניתנת לביטול.`)) return;
  const response = await fetch(`/api/v1/specifications/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "מחיקת ה־YAML נכשלה");
  }
  specificationId.value = "";
  setYamlPreview(null);
  specificationOperations.clear();
  exampleOperation.replaceChildren(new Option("בחר קובץ YAML תחילה", ""));
  exampleOperation.disabled = true;
  specificationPath.disabled = true;
  specificationPath.innerHTML = '<option value="">בחר specification</option>';
  requestPath.value = "/";
  resetAllApiExamples();
  updateExchangePreview();
  await refreshStoredSpecifications();
  deleteSpecificationButton.disabled = true;
  setSpecificationStatus("ה־YAML נמחק בהצלחה", "success");
}

function setJsonField(name, value) {
  const field = document.querySelector(`[name="${name}"]`);
  if (!field) return;
  field.value = value === undefined ? "" : JSON.stringify(value, null, 2);
}

async function generateExamples() {
  if (!specificationId.value) throw new Error("יש לבחור specification שמור לפני יצירת דוגמאות");
  const selected = specificationOperations.get(specificationPath.value);
  if (!selected) throw new Error("יש לבחור operation");
  const response = await fetch("/api/v1/examples/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      specificationId: specificationId.value,
      path: selected.path,
      method: selected.method,
      statusCode: document.querySelector('[name="statusCode"]')?.value || "200",
    }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || "יצירת הדוגמאות נכשלה");
  const example = data.example;
  requestPath.value = example.path;
  methodSelect.value = example.method;
  document.querySelector('[name="statusCode"]').value = String(example.statusCode || 200);
  setJsonField("headers", example.request?.headers);
  setJsonField("query", example.request?.query);
  setJsonField("requestBody", example.request?.body);
  setJsonField("responseHeaders", example.response?.headers);
  setJsonField("responseBody", example.response?.body);
  updateExchangePreview();
  resultSummary.classList.remove("hidden", "invalid");
  resultSummary.classList.add("valid");
  resultSummary.textContent = "הדוגמאות נוצרו מתוך ה־schema ונטענו לשדות.";
}

function historyLabel(entry) {
  const spec = entry.specificationName || "Specification";
  const version = entry.specificationVersion && entry.specificationVersion !== "unspecified" ? ` v${entry.specificationVersion}` : "";
  return `${entry.method} ${entry.path} · ${spec}${version}`;
}

async function refreshHistory() {
  historyList.innerHTML = "טוען history…";
  const response = await fetch("/api/v1/history");
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || "טעינת history נכשלה");
  historyList.innerHTML = "";
  if (!data.history.length) {
    historyList.textContent = "עדיין לא נשמרו בדיקות.";
    return;
  }
  data.history.forEach((entry) => {
    const item = document.createElement("article");
    item.className = `history-item ${entry.valid ? "valid" : "invalid"}`;
    const info = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = `${entry.valid ? "PASS" : "FAIL"} · ${historyLabel(entry)}`;
    const meta = document.createElement("div");
    meta.className = "history-meta";
    meta.textContent = `${new Date(entry.createdAt).toLocaleString("he-IL")} · ${entry.validationMode} · ${entry.errorCount} שגיאות`;
    info.append(title, meta);
    const open = document.createElement("button");
    open.type = "button";
    open.className = "history-open";
    open.textContent = "פתח תוצאה";
    open.onclick = () => {
      output.textContent = JSON.stringify(entry.result, null, 2);
      renderReadableResult(entry.result);
      resultSummary.classList.remove("hidden", "valid", "invalid");
      resultSummary.classList.add(entry.valid ? "valid" : "invalid");
      resultSummary.textContent = entry.valid ? "הבדיקה הסתיימה בהצלחה." : `הבדיקה נכשלה — ${entry.errorCount} שגיאות.`;
      setLastResultExport({
        data: entry.result,
        rawText: JSON.stringify(entry.result),
        valid: entry.valid,
        source: "history",
        summary: resultSummary.textContent,
        createdAt: entry.createdAt,
        metadata: {
          Specification: `${entry.specificationName || "Specification"}${entry.specificationVersion && entry.specificationVersion !== "unspecified" ? ` v${entry.specificationVersion}` : ""}`,
          Operation: `${entry.method} ${entry.path}`,
          "Validation mode": entry.validationMode,
          Errors: entry.errorCount,
        },
      });
      document.querySelector(".results").scrollIntoView({ behavior: "smooth" });
    };
    item.append(info, open);
    historyList.appendChild(item);
  });
}

const workspaceViews = {
  files: ["העלאה וניהול YAML", "העלה קובץ YAML / JSON או הדבק תוכן, והגדר שם וגרסה לשמירה."],
  validate: ["בדיקת API", "בחר קובץ YAML, מלא בקשה או תגובה והפעל בדיקה."],
  yaml: ["YAML — שדות ואילוצים", "צפה בקובץ המקור, בערכים המותרים, ב־Regex ובמגבלות של כל שדה."],
  examples: ["דוגמאות וייצוא", "הפק דוגמאות מה־YAML או ייצא את נתוני הבדיקה למסמך, cURL ו־Postman."],
  compare: ["השוואת גרסאות YAML", "השווה שני קבצי Swagger / OpenAPI וראה מה השתנה."],
  xml: ["בדיקת XML מול XSD", "בדוק התאמה לסכימה וקבל פירוט של שגיאות."],
  "xsd-fields": ["שדות XSD ל־Excel", "הפק רשימת שדות מסודרת והעתק או הורד קובץ CSV."],
  history: ["היסטוריית בדיקות", "פתח תוצאות של בדיקות קודמות."],
};
function activateWorkspace(view) {
  if (!workspaceViews[view]) view = "validate";
  document.querySelectorAll(".tab").forEach((button) => {
    const active = button.dataset.panel === view;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === view));
  document.querySelector("#specificationWorkspace").hidden = !["files", "validate", "yaml", "examples"].includes(view);
  document.querySelector(".results").hidden = ["files", "yaml", "examples", "xsd-fields"].includes(view);
  document.querySelector(".workbench").dataset.view = view;
  document.querySelector("#workspaceTitle").textContent = workspaceViews[view][0];
  document.querySelector("#workspaceDescription").textContent = workspaceViews[view][1];
  if (view === "files") document.querySelector("#newSpecificationDetails").open = true;
  if (view === "yaml") renderYamlPreview();
  if (view === "history") refreshHistory().catch((error) => { historyList.textContent = error.message; });
}
document.querySelectorAll(".tab").forEach((button) => {
  button.onclick = () => {
    activateWorkspace(button.dataset.panel);
    history.replaceState(null, "", `#${button.dataset.panel}`);
  };
});
window.addEventListener("hashchange", () => activateWorkspace(location.hash.slice(1)));
activateWorkspace(location.hash.slice(1) || "validate");
document.querySelector("#environmentLabel").textContent = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(location.hostname) ? "Local" : "OpenValidator";

specificationFile.addEventListener("change", () => {
  if (specificationFile.files?.length) {
    specificationId.value = "";
    savedSpecification.value = "";
    specificationContent.value = "";
  }
  loadSpecificationPaths();
});

savedSpecification.addEventListener("change", async () => {
  deleteSpecificationButton.disabled = !savedSpecification.value;
  try {
    await loadStoredSpecification(savedSpecification.value);
  } catch (error) {
    setSpecificationStatus(error instanceof Error ? error.message : "טעינת הקובץ נכשלה", "error");
  }
});

specificationPath.addEventListener("change", applySelectedOperation);
function updateValidationModeBlocks() {
  const mode = validationMode.value;
  const showRequest = mode === "REQUEST" || mode === "BODY" || mode === "FULL";
  const showResponse = mode === "RESPONSE" || mode === "FULL";

  requestBlock.hidden = !showRequest;
  responseBlock.hidden = !showResponse;
  statusCodeField.hidden = !showResponse;
  requestMetadataFields.hidden = mode === "BODY";

  requestBlock.open = showRequest;
  responseBlock.open = showResponse;
  updateExchangePreview();
}

validationMode.addEventListener("change", updateValidationModeBlocks);
updateValidationModeBlocks();
validateForm.addEventListener("input", updateExchangePreview);
validateForm.addEventListener("change", updateExchangePreview);
requestBaseUrl.addEventListener("input", () => {
  if (allApiExamples.length) renderAllApiExamples();
});
exportFormat.addEventListener("change", updateExportPreview);
closeExchangePreview.onclick = hideExchangeDialog;
exchangeDialog.addEventListener("click", (event) => {
  if (event.target === exchangeDialog) hideExchangeDialog();
});
exchangeDialog.addEventListener("close", () => {
  document.body.classList.remove("exchange-dialog-open");
});
showSelectedApi.onclick = () => setExchangeScope("selected");
showAllApis.onclick = () => {
  if (allApiExamples.length && allApisSpecificationId === specificationId.value) {
    setExchangeScope("all");
    return;
  }
  generateAllExamples().catch((error) => {
    setCopyStatus(error instanceof Error ? error.message : "הפקת כל ה־APIs נכשלה", "error");
  });
};
expandAllApis.onclick = () => allApisList.querySelectorAll("details").forEach((item) => { item.open = true; });
collapseAllApis.onclick = () => allApisList.querySelectorAll("details").forEach((item) => { item.open = false; });
document.querySelector("#copyRequest").onclick = () => copyExchangeText(selectedExchangeFormats.request, "ה־Request המלא");
document.querySelector("#copyResponse").onclick = () => copyExchangeText(selectedExchangeFormats.response, "ה־Response המלא");
document.querySelector("#copyExport").onclick = () => {
  const labels = {
    markdown: "מסמך ה־Markdown",
    curl: "פקודת ה־cURL",
    postman: "ה־Postman Collection",
  };
  copyExchangeText(exchangeFormats[exportFormat.value] || "", labels[exportFormat.value] || "התוכן");
};
copyResultDocument.onclick = () => copyResultForDocument();
downloadResultHtml.onclick = () => {
  if (!lastResultExport) return;
  downloadResultFile(buildResultHtml(), "text/html;charset=utf-8", resultFileName("html"));
  setResultExportStatus("דוח ה־HTML הורד ומוכן לצירוף למייל או למסמך.");
};
emailResult.onclick = () => {
  const mailto = buildResultMailto();
  if (mailto) window.location.href = mailto;
};


validateForm.onsubmit = async (event) => {
  event.preventDefault();
  clearLastResultExport();

  if (!validationMode.value) {
    resultSummary.classList.remove("hidden", "valid");
    resultSummary.classList.add("invalid");
    resultSummary.textContent = "יש לבחור מצב בדיקה לפני הפעלת הוולידציה.";
    return;
  }

  if (!specificationFile.files?.length && !specificationId.value && !specificationContent.value.trim()) {
    setSpecificationStatus("יש לבחור specification שמור, להעלות קובץ או להדביק YAML/JSON", "error");
    return;
  }

  await show(await fetch("/api/v1/validate", {
    method: "POST",
    body: new FormData(event.target),
  }));
  refreshHistory().catch(() => undefined);
};

compareForm.onsubmit = async (event) => {
  event.preventDefault();
  clearLastResultExport();
  const formData = new FormData();

  if (compareForm.dataset.source === "paste") {
    const oldContent = oldSpecificationContent.value.trim();
    const newContent = newSpecificationContent.value.trim();
    if (!oldContent || !newContent) {
      showClientError("יש להדביק את התוכן המלא של שני ה-Specifications.");
      return;
    }
    formData.append("oldFile", pastedFile(oldContent, "old-specification.yaml", "application/yaml"));
    formData.append("newFile", pastedFile(newContent, "new-specification.yaml", "application/yaml"));
  } else {
    const oldFile = compareForm.elements.oldFile.files?.[0];
    const newFile = compareForm.elements.newFile.files?.[0];
    if (!oldFile || !newFile) {
      showClientError("יש לבחור שני קבצים או לעבור למצב הדבקת תוכן.");
      return;
    }
    formData.append("oldFile", oldFile);
    formData.append("newFile", newFile);
  }

  await show(await fetch("/api/v1/compare", {
    method: "POST",
    body: formData,
  }));
};

xmlForm.onsubmit = async (event) => {
  event.preventDefault();
  clearLastResultExport();
  const formData = new FormData();

  if (xmlForm.dataset.source === "paste") {
    const schema = xsdContent.value.trim();
    const xml = xmlContent.value.trim();
    if (!schema || !xml) {
      showClientError("יש להדביק גם XSD וגם XML לפני הפעלת הבדיקה.");
      return;
    }
    formData.append("xsdFile", pastedFile(schema, "schema.xsd", "application/xml"));
    formData.append("xmlFile", pastedFile(xml, "document.xml", "application/xml"));
  } else {
    const xsdFile = xmlForm.elements.xsdFile.files?.[0];
    const xmlFile = xmlForm.elements.xmlFile.files?.[0];
    if (!xsdFile || !xmlFile) {
      showClientError("יש לבחור קובצי XSD ו-XML או לעבור למצב הדבקת תוכן.");
      return;
    }
    formData.append("xsdFile", xsdFile);
    formData.append("xmlFile", xmlFile);
  }

  await show(await fetch("/api/v1/validate/xml", {
    method: "POST",
    body: formData,
  }));
};

function xsdFieldsCsv() {
  const escapeCsv = (value) => {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const rows = extractedXsdFields.map((field) => [field.name, field.type, field.length ?? ""]);
  return [["Field Name", "TYPE", "Length"], ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");
}

function renderXsdFields(data) {
  extractedXsdFields = Array.isArray(data.fields) ? data.fields : [];
  xsdFieldsBody.replaceChildren();
  extractedXsdFields.forEach((field) => {
    const row = document.createElement("tr");
    const name = document.createElement("td");
    const type = document.createElement("td");
    const length = document.createElement("td");
    name.textContent = field.name;
    name.title = field.path || field.name;
    name.style.paddingLeft = `${14 + (Math.max(0, Number(field.depth) || 0) * 14)}px`;
    type.textContent = field.type;
    length.textContent = field.length ?? "";
    row.append(name, type, length);
    xsdFieldsBody.appendChild(row);
  });
  xsdFieldsSummary.textContent = `${data.fileName || "XSD"}: נמצאו ${extractedXsdFields.length} שדות`;
  xsdFieldsStatus.textContent = "";
  xsdFieldsResult.hidden = false;
}

xsdFieldsForm.onsubmit = async (event) => {
  event.preventDefault();
  const formData = new FormData();
  if (xsdFieldsForm.dataset.source === "paste") {
    const content = xsdFieldsContent.value.trim();
    if (!content) {
      showClientError("יש להדביק תוכן XSD.");
      return;
    }
    formData.append("xsd", content);
  } else {
    const file = xsdFieldsForm.elements.xsdFile.files?.[0];
    if (!file) {
      showClientError("יש לבחור קובץ XSD או לעבור למצב הדבקת תוכן.");
      return;
    }
    formData.append("xsdFile", file);
  }
  xsdFieldsStatus.textContent = "קורא את מבנה ה־XSD…";
  xsdFieldsResult.hidden = false;
  try {
    const response = await fetch("/api/v1/xsd/fields", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "קריאת ה־XSD נכשלה");
    renderXsdFields(data);
  } catch (error) {
    extractedXsdFields = [];
    xsdFieldsBody.replaceChildren();
    xsdFieldsSummary.textContent = "לא ניתן לבנות את רשימת השדות";
    xsdFieldsStatus.textContent = error instanceof Error ? error.message : "קריאת ה־XSD נכשלה";
  }
};

copyXsdFields.onclick = async () => {
  if (!extractedXsdFields.length) return;
  await navigator.clipboard.writeText(xsdFieldsCsv());
  xsdFieldsStatus.textContent = "רשימת השדות הועתקה כ־CSV.";
};

downloadXsdFields.onclick = () => {
  if (!extractedXsdFields.length) return;
  const blob = new Blob(["\uFEFF", xsdFieldsCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "xsd-fields.csv";
  link.click();
  URL.revokeObjectURL(url);
  xsdFieldsStatus.textContent = "קובץ ה־CSV הורד ומוכן לייבוא ל־Excel.";
};

chooseXsdFieldsUpload.onclick = () => selectToolSource(
  xsdFieldsForm,
  "upload",
  xsdFieldsUploadSource,
  xsdFieldsPasteSource,
  chooseXsdFieldsUpload,
  chooseXsdFieldsPaste,
);
chooseXsdFieldsPaste.onclick = () => selectToolSource(
  xsdFieldsForm,
  "paste",
  xsdFieldsUploadSource,
  xsdFieldsPasteSource,
  chooseXsdFieldsUpload,
  chooseXsdFieldsPaste,
);


specificationSource.addEventListener("change", () => selectSpecificationSource(specificationSource.value));
loadPastedSpecificationButton.onclick = () => loadPastedSpecification();
chooseCompareUpload.onclick = () => selectToolSource(compareForm, "upload", compareUploadSource, comparePasteSource, chooseCompareUpload, chooseComparePaste);
chooseComparePaste.onclick = () => selectToolSource(compareForm, "paste", compareUploadSource, comparePasteSource, chooseCompareUpload, chooseComparePaste);
chooseXmlUpload.onclick = () => selectToolSource(xmlForm, "upload", xmlUploadSource, xmlPasteSource, chooseXmlUpload, chooseXmlPaste);
chooseXmlPaste.onclick = () => selectToolSource(xmlForm, "paste", xmlUploadSource, xmlPasteSource, chooseXmlUpload, chooseXmlPaste);
specificationContent.addEventListener("input", () => {
  setYamlPreview(null);
  resetAllApiExamples();
  if (specificationContent.value.trim()) {
    specificationId.value = "";
    savedSpecification.value = "";
    specificationFile.value = "";
  }
});

deleteSpecificationButton.onclick = () => deleteSelectedSpecification().catch((error) => setSpecificationStatus(error.message, "error"));
exampleScope.addEventListener("change", () => {
  document.querySelector("#exampleOperationField").hidden = exampleScope.value !== "selected";
});
exampleOperation.addEventListener("change", () => {
  specificationPath.value = exampleOperation.value;
  applySelectedOperation();
});
generateAllExamplesButton.onclick = async () => {
  examplesStatus.textContent = "מכין תצוגה…";
  generateAllExamplesButton.disabled = true;
  try {
    if (exampleScope.value === "all") await generateAllExamples();
    else {
      if (exampleScope.value === "selected") await generateExamples();
      setExchangeScope("selected");
      showExchangeDialog();
    }
    examplesStatus.textContent = "התצוגה מוכנה להעתקה ולייצוא.";
  } catch (error) {
    examplesStatus.textContent = error instanceof Error ? error.message : "הכנת התצוגה נכשלה";
  } finally {
    generateAllExamplesButton.disabled = false;
  }
};
document.querySelector("#refreshHistory").onclick = () => refreshHistory().catch((error) => { historyList.textContent = error.message; });
document.querySelector("#clearHistory").onclick = async () => {
  if (!window.confirm("למחוק את כל ה־History?")) return;
  await fetch("/api/v1/history", { method: "DELETE" });
  await refreshHistory();
};

document.querySelector("#clear").onclick = () => {
  output.textContent = "בחר פעולה והפעל בדיקה.";
  resultSummary.classList.add("hidden");
  clearLastResultExport();
};

refreshStoredSpecifications()
  .then(async () => {
    const firstOption = savedSpecification.querySelector('option[value]:not([value=""])');
    if (firstOption) {
      savedSpecification.value = firstOption.value;
      await loadStoredSpecification(firstOption.value);
    } else {
      setSpecificationStatus("טרם נשמר specification");
    }
  })
  .catch((error) => {
    setSpecificationStatus(error instanceof Error ? error.message : "טעינת specifications נכשלה", "error");
  });

fetch("/health")
  .then((response) => response.json())
  .then((health) => {
    const element = document.querySelector("#health");
    element.textContent = `${health.status} · v${health.version}`;
    element.className = "health health-up";
  })
  .catch(() => {
    const element = document.querySelector("#health");
    element.textContent = "השרת אינו זמין";
    element.className = "health health-down";
  });
