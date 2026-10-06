# OpenValidator

A professional validator for:

- Swagger 2.0
- OpenAPI 3.x
- JSON Schema
- IBM DataPower compatible validation
- XML against XSD 1.0

Future support:

- Multi-file XSD include/import
- WSDL
- JWS
- OAuth
## Current API

The Sprint 5 validator endpoint is:

```text
POST http://localhost:3000/api/v1/validate
```

See [`docs/SPRINT_5.md`](docs/SPRINT_5.md) for Postman fields and examples.

## Sprint 6

Validation Engine V2 is implemented with an ordered validation pipeline, a richer validation context, structured error codes, and an internal OpenAPI operation model. See `docs/SPRINT_6.md`.


## Validation modes and response validation

See `docs/SPRINT_7.md` for BODY, REQUEST, RESPONSE and FULL Postman examples.


## XML and XSD validation

Use `POST /api/v1/validate/xml`. See `docs/SPRINT_8.md` and the files under `examples/xml`.

## XML/XSD runtime

XML Schema validation runs in Node.js through WebAssembly (`xmllint-wasm`). Java is not required.

## Sprint 9 product workspace

Run the backend and open `http://localhost:3000` for the browser UI. The API now includes HTML validation reports, Swagger/OpenAPI comparison at `POST /api/v1/compare`, and optional custom validation rules. See `docs/SPRINT_9.md`.

## Stored specifications

Uploaded Swagger/OpenAPI YAML or JSON files are saved under `backend/data/specifications` and appear in the web interface for future selection. The validation endpoint also accepts a `specificationId` instead of a new file upload. See `docs/SPRINT_11.md`.


## Sprint 13

Stored YAML deletion, validation history and automatic request/response example generation are documented in `docs/SPRINT_13.md`.

## Version 1.1.0

The workspace includes the YF logo and a Swagger-inspired green and charcoal palette.
After uploading, pasting and saving, or selecting a stored specification, choose
**YAML — שדות ואילוצים** from the menu to view the original YAML/JSON beside API documentation. The viewer
preserves source comments and formatting, provides line numbers, search, line wrapping,
copying and downloading, and shows operation parameters, request bodies, responses and
schemas. This is a read-only viewer; specification uploads and validation use the existing flows.
The application version defaults to `backend/package.json`; `APP_VERSION` can override it.
The YAML preview also includes field tables for parameters, request bodies, responses
and reusable schemas. Tables show enums, regex patterns, required fields, types,
formats, defaults, examples, length and numeric limits, array constraints and local
`$ref` targets. Composite schema branches are labeled separately; recursive and
external references are identified without blocking the viewer.

The menu groups YAML/API tools, XML/XSD tools and validation history, with a short
explanation for every entry. The YAML explorer is a dedicated page at `/#yaml`.
A shared file selection carries across validation, YAML inspection and examples;
new uploads, pasted content and file management have a dedicated page at `/#files`.
The explorer gives 28% of its width to source and 72% to fields and constraints.
Validation has one primary action,
and examples/export has a separate workspace with a single action for the chosen scope.

The field explorer opens a selected schema or operation directly as field tables.
API descriptions and raw definitions remain expandable. Search and the required,
regex and enum filters search across the document and display matching fields;
clicking a field highlights its exact source line, including local reference targets.
The source/fields separator supports pointer dragging and arrow keys, and stores
its width in browser local storage. Validation errors are displayed as a table of
field, received value, expected value and reason; full JSON is expandable.
