# Sprint 7 — Validation Modes and Response Validation

## Endpoint

`POST http://localhost:3000/api/v1/validate`

Use `multipart/form-data` and attach the OpenAPI/Swagger YAML in the `file` field.

The fields `path` and `method` are always required because they identify the operation in the specification.

## Validation modes

| validationMode | Validation performed |
|---|---|
| `BODY` | Request body only. Path and method are used only to locate the schema. Request headers, query parameters and path-parameter rules are skipped. |
| `REQUEST` | Full request: path parameters, query parameters, headers and request body. This is the default. |
| `RESPONSE` | Response status, response headers and response body. |
| `FULL` | Full request and response validation. |

## Request-only example

Form-data fields:

- `file`: specification YAML
- `validationMode`: `REQUEST`
- `path`: `/accounts/123`
- `method`: `POST`
- `headers`: `{"x-request-id":"request-1"}`
- `query`: `{"bookingStatus":"booked"}`
- `requestBody`: `{"amount":10}`

## Body-only example

- `file`: specification YAML
- `validationMode`: `BODY`
- `path`: `/accounts/123`
- `method`: `POST`
- `requestBody`: `{"amount":10}`

Headers and query fields may be omitted in this mode.

## Response-only example

- `file`: specification YAML
- `validationMode`: `RESPONSE`
- `path`: `/accounts/123`
- `method`: `POST`
- `statusCode`: `200`
- `responseHeaders`: `{"x-response-id":"response-1"}`
- `responseBody`: `{"result":"ok"}`

`statusCode` is mandatory for `RESPONSE` and `FULL` and must be between 100 and 599.

The response definition is selected in this order:

1. Exact status, such as `200`
2. Status range, such as `2XX`
3. `default`

Both OpenAPI 3.x (`content.application/json.schema`) and Swagger 2.0 (`schema`) response schemas are supported.

## Full example

Use `validationMode=FULL` and provide all request and response fields.

## Result additions

The validation result now includes:

- `validationMode`
- `requestBodySchemaFound`
- `responseBodySchemaFound`
- `responseStatusCode`
- structured response error paths such as `response.body`, `response.header.x-response-id`, and `response.statusCode`
