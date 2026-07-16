# Sprint 8 – XML and XSD Validation

## Endpoint

```text
POST http://localhost:3000/api/v1/validate/xml
```

Use `Body -> form-data` in Postman.

| Key | Type | Required | Description |
|---|---|---:|---|
| `xsdFile` | File | Yes | XSD 1.0 schema file |
| `xmlFile` | File | No | XML document file |
| `xml` | Text | No | XML document as text when `xmlFile` is not supplied |

Supply either `xmlFile` or `xml`. When both are supplied, `xmlFile` is used.

## Example using two files

```text
xsdFile = examples/xml/person.xsd
xmlFile = examples/xml/person-valid.xml
```

## Successful response

```json
{
  "valid": true,
  "schemaFileName": "person.xsd",
  "xmlFileName": "person-valid.xml",
  "format": "XML_XSD",
  "errorCount": 0,
  "warningCount": 0,
  "errors": [],
  "message": "XML validation passed"
}
```

## Invalid XML response

Schema violations return HTTP `422` and structured errors with code, severity, path, line and column when available.

## Security and limits

- External entities are not loaded.
- DTD entity expansion is disabled.
- Maximum upload size is 20 MB per request.
- XML parsing includes depth, attribute and node-count limits.

## Current scope

This version validates one XML document against one uploaded XSD schema. XSD include/import resolution across multiple uploaded files is planned as a separate feature because it requires explicit file-resolution rules.

## Runtime implementation

XML/XSD validation uses `xmllint-wasm`, which runs libxml2 inside WebAssembly from Node.js.
No Java, JDK, Python, native libxml installation, or Windows build tools are required.
Node.js 16 or newer is required.
