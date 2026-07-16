# Sprint 13 – YAML Management, History and Example Generation

## YAML deletion

The Web UI now provides a **Delete YAML** action next to the stored specification selector. Deletion requires confirmation and removes both the original file and its metadata from `backend/data/specifications`.

API:

```http
DELETE /api/v1/specifications/{id}
```

## Validation History

Every JSON request/response validation is stored automatically under:

```text
backend/data/history/validation-history.json
```

The History tab shows PASS/FAIL, date, specification name/version, method, path, validation mode and error count. A saved result can be reopened. Up to 500 recent entries are retained.

APIs:

```http
GET    /api/v1/history
GET    /api/v1/history/{id}
DELETE /api/v1/history
```

## Generate Examples

Choose a stored specification and operation, then click **Generate Examples**. OpenValidator resolves local `$ref` values and fills request headers, query values, path parameters, request body, response headers and response body.

Generation priority:

1. `example`
2. `default`
3. first `enum` value
4. generated value based on type/format

API:

```http
POST /api/v1/examples/generate
Content-Type: application/json
```

```json
{
  "specificationId": "...",
  "path": "/v1.0.0/mandates/{resourceId}",
  "method": "GET",
  "statusCode": "200"
}
```

Generated examples are starting points. Regex-only values may still require manual adjustment when the schema does not contain an explicit example or default.
