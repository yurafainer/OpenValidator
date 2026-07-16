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
const chooseUploadSource = document.querySelector("#chooseUploadSource");
const choosePasteSource = document.querySelector("#choosePasteSource");
const loadPastedSpecificationButton = document.querySelector("#loadPastedSpecification");

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options", "trace"];
let specificationOperations = new Map();


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
  if (!id) {
    specificationId.value = "";
    return;
  }

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
}

async function show(response) {
  const text = await response.text();

  try {
    const data = JSON.parse(text);
    output.textContent = JSON.stringify(data, null, 2);
    updateSummary(data, response);
  } catch {
    output.textContent = text;
    resultSummary.classList.add("hidden");
  }
}

function setSpecificationStatus(message, state = "") {
  specificationStatus.textContent = message;
  specificationStatus.className = `spec-status ${state}`.trim();
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

  specificationPath.disabled = false;
  applySelectedOperation();
}

function applySelectedOperation() {
  const selected = specificationOperations.get(specificationPath.value);
  if (!selected) return;

  requestPath.value = selected.path;
  methodSelect.value = selected.method;
}

function selectSpecificationSource(source) {
  const paste = source === "paste";
  uploadSpecificationSource.hidden = paste;
  pasteSpecificationSource.hidden = !paste;
  chooseUploadSource.classList.toggle("active", !paste);
  choosePasteSource.classList.toggle("active", paste);
}

async function loadPastedSpecification() {
  const content = specificationContent.value.trim();
  if (!content) {
    setSpecificationStatus("יש להדביק תוכן YAML או JSON", "error");
    return;
  }

  specificationOperations.clear();
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
  const file = specificationFile.files?.[0];

  specificationOperations.clear();
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
  specificationOperations.clear();
  specificationPath.disabled = true;
  specificationPath.innerHTML = '<option value="">בחר specification</option>';
  requestPath.value = "/";
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
      resultSummary.classList.remove("hidden", "valid", "invalid");
      resultSummary.classList.add(entry.valid ? "valid" : "invalid");
      resultSummary.textContent = entry.valid ? "הבדיקה הסתיימה בהצלחה." : `הבדיקה נכשלה — ${entry.errorCount} שגיאות.`;
      document.querySelector(".results").scrollIntoView({ behavior: "smooth" });
    };
    item.append(info, open);
    historyList.appendChild(item);
  });
}

document.querySelectorAll(".tab").forEach((button) => {
  button.onclick = () => {
    document.querySelectorAll(".tab, .panel").forEach((element) => element.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`#${button.dataset.panel}`).classList.add("active");
    if (button.dataset.panel === "history") refreshHistory().catch((error) => { historyList.textContent = error.message; });
  };
});

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
}

validationMode.addEventListener("change", updateValidationModeBlocks);
updateValidationModeBlocks();


document.querySelector("#validateForm").onsubmit = async (event) => {
  event.preventDefault();

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

document.querySelector("#compareForm").onsubmit = async (event) => {
  event.preventDefault();
  await show(await fetch("/api/v1/compare", {
    method: "POST",
    body: new FormData(event.target),
  }));
};

document.querySelector("#xmlForm").onsubmit = async (event) => {
  event.preventDefault();
  await show(await fetch("/api/v1/validate/xml", {
    method: "POST",
    body: new FormData(event.target),
  }));
};


chooseUploadSource.onclick = () => selectSpecificationSource("upload");
choosePasteSource.onclick = () => selectSpecificationSource("paste");
loadPastedSpecificationButton.onclick = () => loadPastedSpecification();
specificationContent.addEventListener("input", () => {
  if (specificationContent.value.trim()) {
    specificationId.value = "";
    savedSpecification.value = "";
    specificationFile.value = "";
  }
});

deleteSpecificationButton.onclick = () => deleteSelectedSpecification().catch((error) => setSpecificationStatus(error.message, "error"));
document.querySelector("#generateExamples").onclick = () => generateExamples().catch((error) => {
  resultSummary.classList.remove("hidden", "valid");
  resultSummary.classList.add("invalid");
  resultSummary.textContent = error.message;
});
document.querySelector("#refreshHistory").onclick = () => refreshHistory().catch((error) => { historyList.textContent = error.message; });
document.querySelector("#clearHistory").onclick = async () => {
  if (!window.confirm("למחוק את כל ה־History?")) return;
  await fetch("/api/v1/history", { method: "DELETE" });
  await refreshHistory();
};

document.querySelector("#htmlReport").onclick = async () => {
  const data = new FormData(document.querySelector("#validateForm"));
  data.set("reportFormat", "HTML");
  const response = await fetch("/api/v1/validate", { method: "POST", body: data });
  const html = await response.text();
  const page = window.open();

  if (!page) {
    output.textContent = "הדפדפן חסם את חלון הדוח. יש לאפשר pop-ups עבור localhost.";
    return;
  }

  page.document.write(html);
  page.document.close();
};

document.querySelector("#clear").onclick = () => {
  output.textContent = "בחר פעולה והפעל בדיקה.";
  resultSummary.classList.add("hidden");
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
