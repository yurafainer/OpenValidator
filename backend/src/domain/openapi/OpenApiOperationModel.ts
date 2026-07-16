import type { OpenApiOperation } from "./OpenApiOperation";

export interface OpenApiOperationModel {
  specificationPath: string;
  method: string;
  operation: OpenApiOperation;
  pathItem: Record<string, unknown>;
  parameters: Record<string, unknown>[];
  pathParameters: Record<string, string>;
  allowedMethods: string[];
}
