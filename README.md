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
