# Sprint 6 – Validation Engine V2

Sprint 6 refactors request validation into an extensible pipeline while preserving the existing HTTP API.

## Architecture

The request is converted into a `ValidationContext` and processed by these ordered steps:

1. `PathValidationStep`
2. `MethodValidationStep`
3. `ParameterValidationStep`
4. `BodyValidationStep`

A step may stop the pipeline when later validation is impossible, for example when no matching path or HTTP operation exists.

## Structured errors

Every new validation error contains:

```json
{
  "code": "PARAMETER_REQUIRED",
  "location": "query.bookingStatus",
  "message": "Parameter 'bookingStatus' is required",
  "severity": "ERROR"
}
```

The legacy `path` and `keyword` fields remain in the response for compatibility with existing consumers.

## Internal OpenAPI model

The pipeline works with an `OpenApiOperationModel`, containing the matched specification path, operation, parameters, allowed methods and extracted path parameters. This isolates validation logic from the raw YAML structure and prepares the engine for future formats and plugins.

## Response additions

Validation responses now include:

- `pipeline`: ordered validation stages
- `metadata.pathFound`
- `metadata.specificationVersion`
- structured error `code`, `location` and `severity`

## Verification

Run from `backend`:

```bash
npm install
npm run build
npm test -- --run
```
