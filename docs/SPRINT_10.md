# Sprint 10 - Operation Selector and UI Refresh

## What changed

- The web UI now reads the uploaded Swagger/OpenAPI document through `POST /api/v1/specifications/load`.
- All operations are extracted from `paths` and shown in a dropdown.
- Selecting an operation automatically fills the HTTP method and request path.
- Parameter placeholders remain editable, so `/mandates/{resourceId}` can be changed to `/mandates/123`.
- The interface was redesigned for Hebrew RTL use with an orange and burgundy visual language, responsive cards, clearer sections and validation result status.

## Usage

1. Start the backend.
2. Open `http://localhost:3000`.
3. Upload a YAML, YML or JSON specification.
4. Select an operation from the Path dropdown.
5. Replace path placeholders with real values.
6. Choose the validation mode and provide the payload.
7. Run validation.
