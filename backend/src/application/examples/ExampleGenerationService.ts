import YAML from "yaml";

interface GenerateInput {
  content: string;
  path: string;
  method: string;
  statusCode?: string;
}

interface GenerateAllInput {
  content: string;
}

export interface GeneratedApiExample {
  templatePath: string;
  path: string;
  method: string;
  statusCode: number;
  request: {
    headers: Record<string, unknown>;
    query: Record<string, unknown>;
    pathParameters: Record<string, unknown>;
    body?: unknown;
  };
  response: {
    headers: Record<string, unknown>;
    body?: unknown;
  };
  metadata: {
    requestBodySchemaFound: boolean;
    responseBodySchemaFound: boolean;
  };
}

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options", "trace"];

export class ExampleGenerationService {
  public generate(input: GenerateInput): GeneratedApiExample {
    const specification = YAML.parse(input.content) as Record<string, any>;
    return this.generateOperation(specification, input.path, input.method, input.statusCode);
  }

  public generateAll(input: GenerateAllInput): GeneratedApiExample[] {
    const specification = YAML.parse(input.content) as Record<string, any>;
    const paths = specification?.paths;
    if (!paths || typeof paths !== "object") return [];

    const examples: GeneratedApiExample[] = [];
    for (const [path, pathItem] of Object.entries(paths)) {
      if (!pathItem || typeof pathItem !== "object") continue;
      for (const method of HTTP_METHODS) {
        if ((pathItem as Record<string, unknown>)[method]) {
          examples.push(this.generateOperation(specification, path, method));
        }
      }
    }

    return examples.sort((left, right) => left.templatePath.localeCompare(right.templatePath) || left.method.localeCompare(right.method));
  }

  private generateOperation(specification: Record<string, any>, path: string, method: string, statusCode?: string): GeneratedApiExample {
    const pathItem = specification?.paths?.[path];
    const operation = pathItem?.[method.toLowerCase()];
    if (!operation) throw new Error("Selected operation was not found in the specification");

    const parameters = [...(Array.isArray(pathItem?.parameters) ? pathItem.parameters : []), ...(Array.isArray(operation.parameters) ? operation.parameters : [])]
      .map((parameter: any) => this.resolveRef(specification, parameter));

    const requestSchema = this.findRequestSchema(specification, operation, parameters);
    const response = this.findResponse(specification, operation, statusCode);

    const headers: Record<string, unknown> = {};
    const query: Record<string, unknown> = {};
    const pathParameters: Record<string, unknown> = {};
    for (const parameter of parameters) {
      if (!parameter?.name || parameter.in === "body") continue;
      const schema = parameter.schema ?? parameter;
      const value = this.generateValue(specification, schema, new Set());
      if (parameter.in === "header") headers[parameter.name] = value;
      if (parameter.in === "query") query[parameter.name] = value;
      if (parameter.in === "path") pathParameters[parameter.name] = value;
    }

    const responseHeaders: Record<string, unknown> = {};
    for (const [name, header] of Object.entries(response.definition?.headers ?? {})) {
      responseHeaders[name] = this.generateValue(specification, header as any, new Set());
    }

    return {
      templatePath: path,
      path: this.applyPathParameters(path, pathParameters),
      method: method.toUpperCase(),
      statusCode: Number(response.statusCode),
      request: {
        headers,
        query,
        pathParameters,
        body: requestSchema ? this.generateValue(specification, requestSchema, new Set()) : undefined,
      },
      response: {
        headers: responseHeaders,
        body: response.schema ? this.generateValue(specification, response.schema, new Set()) : undefined,
      },
      metadata: {
        requestBodySchemaFound: Boolean(requestSchema),
        responseBodySchemaFound: Boolean(response.schema),
      },
    };
  }

  private findRequestSchema(spec: any, operation: any, parameters: any[]): any {
    const content = operation?.requestBody?.content;
    if (content) {
      const media = content["application/json"] ?? content[Object.keys(content)[0]];
      if (media?.example !== undefined) return { ...(media.schema ?? {}), example: media.example };
      if (media?.schema) return media.schema;
    }
    return parameters.find((parameter) => parameter?.in === "body")?.schema;
  }

  private findResponse(spec: any, operation: any, requested?: string): { statusCode: string; definition: any; schema: any } {
    const responses = operation?.responses ?? {};
    const keys = Object.keys(responses);
    const statusCode = requested && responses[requested]
      ? requested
      : keys.find((key) => /^2\d\d$/.test(key)) ?? keys.find((key) => /^2XX$/i.test(key)) ?? "default";
    const definition = this.resolveRef(spec, responses[statusCode] ?? responses.default ?? {});
    const content = definition?.content;
    const media = content ? content["application/json"] ?? content[Object.keys(content)[0]] : undefined;
    const schema = media?.example !== undefined ? { ...(media.schema ?? {}), example: media.example } : media?.schema ?? definition?.schema;
    return { statusCode: /^\d+$/.test(statusCode) ? statusCode : "200", definition, schema };
  }

  private generateValue(spec: any, rawSchema: any, visited: Set<string>): any {
    if (!rawSchema || typeof rawSchema !== "object") return null;
    if (rawSchema.example !== undefined) return this.normalizeExample(spec, rawSchema.example, rawSchema);
    if (rawSchema.default !== undefined) return rawSchema.default;
    if (Array.isArray(rawSchema.enum) && rawSchema.enum.length) return rawSchema.enum[0];
    if (rawSchema.$ref) {
      if (visited.has(rawSchema.$ref)) return {};
      visited.add(rawSchema.$ref);
      return this.generateValue(spec, this.resolveRef(spec, rawSchema), visited);
    }
    if (Array.isArray(rawSchema.allOf)) {
      return rawSchema.allOf.reduce((result: any, part: any) => ({ ...result, ...this.generateValue(spec, part, new Set(visited)) }), {});
    }
    if (Array.isArray(rawSchema.oneOf) && rawSchema.oneOf.length) return this.generateValue(spec, rawSchema.oneOf[0], visited);
    if (Array.isArray(rawSchema.anyOf) && rawSchema.anyOf.length) return this.generateValue(spec, rawSchema.anyOf[0], visited);

    const type = rawSchema.type ?? (rawSchema.properties ? "object" : undefined);
    if (type === "object") {
      const value: Record<string, unknown> = {};
      for (const [name, property] of Object.entries(rawSchema.properties ?? {})) {
        value[name] = this.generateValue(spec, property, new Set(visited));
      }
      return value;
    }
    if (type === "array") return [this.generateValue(spec, rawSchema.items ?? {}, new Set(visited))];
    if (type === "integer" || type === "number") return rawSchema.minimum ?? 0;
    if (type === "boolean") return true;
    if (rawSchema.format === "date") return "2026-07-16";
    if (rawSchema.format === "date-time") return "2026-07-16T12:00:00Z";
    if (rawSchema.format === "uuid") return "00000000-0000-4000-8000-000000000000";
    if (rawSchema.pattern) return "example";
    return "string";
  }

  private normalizeExample(spec: any, example: unknown, schema: Record<string, any>): unknown {
    const resolvedSchema = this.resolveRef(spec, schema);
    if (typeof example !== "string" || resolvedSchema.type === "string") return example;

    const trimmed = example.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return example;

    try {
      return JSON.parse(trimmed);
    } catch {
      return example;
    }
  }

  private resolveRef(spec: any, value: any): any {
    if (!value?.$ref || typeof value.$ref !== "string" || !value.$ref.startsWith("#/")) return value;
    return value.$ref.slice(2).split("/").reduce((current: any, part: string) => current?.[part.replace(/~1/g, "/").replace(/~0/g, "~")], spec) ?? value;
  }

  private applyPathParameters(template: string, parameters: Record<string, unknown>): string {
    return template.replace(/\{([^}]+)\}/g, (_match, name) => encodeURIComponent(String(parameters[name] ?? "example")));
  }
}
