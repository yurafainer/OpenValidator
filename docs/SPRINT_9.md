# Sprint 9 – Product Workspace

## Browser UI

Start the backend and open:

```text
http://localhost:3000
```

The workspace supports API request/response validation, XML/XSD validation, HTML reports, and Swagger/OpenAPI comparison.

## HTML validation reports

Use the existing endpoint and add this form-data field:

```text
reportFormat = HTML
```

The response is a standalone HTML report suitable for saving or printing to PDF from the browser.

## Specification comparison

```text
POST /api/v1/compare
```

Multipart form-data fields:

```text
oldFile = previous Swagger/OpenAPI file
newFile = new Swagger/OpenAPI file
```

The response includes added, removed and changed paths, methods and schemas, breaking-change classification, and a compatibility score.

## Custom rules

Add a `rules` form-data field containing a JSON array:

```json
[
  { "location": "headers.x-request-id", "required": true, "format": "uuid" },
  { "location": "body.debtor.identification", "format": "israeliId" },
  { "location": "body.account.iban", "format": "iban" },
  { "location": "response.statusCode", "equals": 200 },
  { "location": "query.consentId", "pattern": "^CONS-" }
]
```

Supported built-in formats:

```text
uuid, iban, israeliId, bic, lei
```

## Readable validation errors

JSON Schema errors now include the exact field path, the received value, the expected constraint and a readable message. Enum failures, for example, return the rejected value and the complete list of allowed values.
