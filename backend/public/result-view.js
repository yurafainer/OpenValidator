function renderReadableResult(data) {
  const container = document.querySelector('#readableResult');
  const empty = document.querySelector('#resultEmptyState');
  const raw = document.querySelector('#resultRawDetails');
  container.replaceChildren();
  container.hidden = true;
  raw.open = false;
  raw.hidden = !data;
  empty.hidden = Boolean(data);
  if (!data) { empty.textContent = 'בחר פעולה והפעל בדיקה.'; return; }
  const errors = Array.isArray(data.errors) ? data.errors : [];
  if (!errors.length) {
    if (data.message && data.valid !== true) {
      container.append(yamlElement('p', data.message));
      container.hidden = false;
    }
    // Comparison and other tools retain their full result when there is no validation error list.
    if (typeof data.valid !== 'boolean' && !errors.length && !data.message) raw.open = true;
    return;
  }
  const table = yamlElement('table', undefined, 'validation-error-table');
  const heading = yamlElement('tr');
  ['השדה שנכשל', 'הערך שהתקבל', 'מה נדרש', 'סיבת הכשל'].forEach(text => {
    const cell = yamlElement('th', text); cell.scope = 'col'; heading.append(cell);
  });
  const head = yamlElement('thead'); head.append(heading);
  const body = yamlElement('tbody');
  const display = (error, key) => Object.prototype.hasOwnProperty.call(error, key) ? JSON.stringify(error[key]) ?? 'לא נמסר' : 'לא נמסר';
  errors.forEach(error => {
    const row = yamlElement('tr');
    if (error.severity === 'WARNING') row.className = 'validation-warning';
    const location = error.location || error.path || (error.line ? `שורה ${error.line}${error.column ? `, עמודה ${error.column}` : ''}` : 'כללי');
    const field = yamlElement('td'); field.append(yamlElement('code', location));
    if (error.line && (error.location || error.path)) field.append(yamlElement('small', `שורה ${error.line}`));
    const actual = yamlElement('td'); actual.append(yamlElement('code', display(error, 'actual')));
    const expected = yamlElement('td'); expected.append(yamlElement('code', display(error, 'expected')));
    const reason = yamlElement('td'); reason.append(yamlElement('p', error.message || 'הערך אינו תואם להגדרה'));
    if (error.code || error.keyword) reason.append(yamlElement('small', error.code || error.keyword));
    row.append(field, actual, expected, reason); body.append(row);
  });
  table.append(head, body);
  container.append(table);
  container.hidden = false;
}
renderReadableResult(null);
