export class ValidationReportService {
  public toHtml(result: Record<string, any>): string {
    const errors = Array.isArray(result.errors) ? result.errors : [];
    const rows = errors.length
      ? errors.map((error: any) => `<tr><td>${this.escape(error.severity ?? "ERROR")}</td><td>${this.escape(error.code ?? error.keyword ?? "VALIDATION_ERROR")}</td><td>${this.escape(error.location ?? error.path ?? "-")}</td><td>${this.escape(error.message ?? "")}</td></tr>`).join("")
      : `<tr><td colspan="4">No validation errors</td></tr>`;
    const status = result.valid ? "PASSED" : "FAILED";
    return `<!doctype html><html><head><meta charset="utf-8"><title>OpenValidator Report</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#172033}h1{margin-bottom:4px}.badge{display:inline-block;padding:6px 12px;border-radius:16px;background:${result.valid ? "#dcfce7" : "#fee2e2"};color:${result.valid ? "#166534" : "#991b1b"};font-weight:700}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:24px 0}.card{border:1px solid #dbe2ea;border-radius:10px;padding:14px}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top}th{background:#f8fafc}</style></head><body><h1>OpenValidator Report</h1><span class="badge">${status}</span><div class="grid"><div class="card"><strong>File</strong><br>${this.escape(result.fileName ?? "-")}</div><div class="card"><strong>Operation</strong><br>${this.escape(`${result.method ?? ""} ${result.path ?? ""}`)}</div><div class="card"><strong>Mode</strong><br>${this.escape(result.validationMode ?? "-")}</div><div class="card"><strong>Errors</strong><br>${errors.length}</div></div><h2>Validation details</h2><table><thead><tr><th>Severity</th><th>Code</th><th>Location</th><th>Message</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  }
  private escape(value: unknown): string { return String(value).replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char] ?? char)); }
}
