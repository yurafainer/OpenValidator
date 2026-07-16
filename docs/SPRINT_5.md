# Sprint 5 - Full Request Validation

## Endpoint

`POST http://localhost:3000/api/v1/validate`

Content type: `multipart/form-data`

## Postman fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `file` | File | Yes | Swagger 2.0 or OpenAPI 3.x YAML file |
| `path` | Text | Yes | Actual request path, for example `/accounts/123` |
| `method` | Text | Yes | HTTP method, for example `GET` or `POST` |
| `headers` | Text (JSON) | No | Request headers as a JSON object |
| `query` | Text (JSON) | No | Query parameters as a JSON object |
| `requestBody` | Text (JSON) | No | JSON request body |

## Example

`path`

```text
/accounts/123
```

`method`

```text
POST
```

`headers`

```json
{
  "x-request-id": "550e8400-e29b-41d4-a716-446655440000",
  "authorization": "Bearer token"
}
```

`query`

```json
{
  "bookingStatus": "booked"
}
```

`requestBody`

```json
{
  "amount": 100
}
```

## Validation coverage

- Static and parameterized path matching
- Path parameter extraction
- HTTP method validation
- Required path, query, and header parameters
- Parameter types: string, integer, number, boolean, array, object
- Enum, pattern, minLength, maxLength, minimum, maximum, minItems, maxItems
- Case-insensitive header lookup
- OpenAPI 3 request body schema validation
- Swagger 2 body parameter validation
- Local `$ref` resolution
- Aggregated validation errors
