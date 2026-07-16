# Sprint 11 — Stored Specifications

## Purpose

Uploaded Swagger/OpenAPI YAML and JSON files are now retained by the server and can be selected again from the web interface without uploading the file on every validation.

## Storage

Files and metadata are stored under:

```text
backend/data/specifications
```

The storage directory is created automatically. Identical file contents are de-duplicated by SHA-256 hash.

## API

### List stored specifications

```http
GET /api/v1/specifications
```

### Upload, validate and store a specification

```http
POST /api/v1/specifications/load
Content-Type: multipart/form-data
file: <yaml|yml|json>
```

### Read a stored specification

```http
GET /api/v1/specifications/{id}
```

### Delete a stored specification

```http
DELETE /api/v1/specifications/{id}
```

### Validate with a stored specification

`POST /api/v1/validate` accepts either a `file` or a `specificationId` form field.

## Web interface

On startup, the latest saved specification is selected automatically. Uploading a new valid specification saves it and refreshes the selection list.
