# Sprint 12 – Validation UX and stored specification metadata

## Changes

- Fixed runtime dependency injection for `SpecificationStore` by registering a concrete store instance.
- Validation Request/Response sections remain hidden until a validation mode is selected.
- BODY mode shows only request body fields.
- RESPONSE and FULL modes show status code and response fields.
- Removed default `{}` and `[]` values from JSON editors.
- New specifications can be saved with a friendly name and version.
- Saved specification selector displays friendly name and version.
- Existing metadata files remain backward compatible and receive safe fallback values.

## Stored metadata

Files are stored under `backend/data/specifications` with metadata containing:

- id
- name
- version
- original file name
- upload timestamp
- size
- SHA-256
