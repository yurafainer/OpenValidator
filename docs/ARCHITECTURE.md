# OpenValidator Architecture

## Goal

OpenValidator is a validation platform for API specifications and payloads.

Initial support:
- Swagger 2.0
- JSON request/response validation
- IBM DataPower-compatible validation mode

Future support:
- OpenAPI 3.x
- JSON Schema
- XML / XSD
- WSDL
- JWS
- OAuth
- BOI-specific rules

## High Level Architecture

```text
React UI
   |
Express REST API
   |
Validation Platform
   |
Plugin Manager
   |
+-- Specification Plugins
|   +-- Swagger 2 Plugin
|   +-- OpenAPI 3 Plugin
|
+-- Validator Plugins
|   +-- AJV Validator
|   +-- DataPower Validator
|
+-- Report Engine