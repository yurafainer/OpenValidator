import { describe, expect, it } from "vitest";
import { ExampleGenerationService } from "./ExampleGenerationService";

const specification = `openapi: 3.0.0
paths:
  /pets:
    post:
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                  example: Luna
      responses:
        '201':
          description: created
  /pets/{petId}:
    get:
      parameters:
        - in: path
          name: petId
          required: true
          schema:
            type: string
            example: PET-1
      responses:
        '200':
          description: ok
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    enum: [active, inactive]
`;

describe("ExampleGenerationService", () => {
  it("generates path parameters and response body", () => {
    const result = new ExampleGenerationService().generate({ content: specification, path: "/pets/{petId}", method: "GET", statusCode: "200" });
    expect(result.path).toBe("/pets/PET-1");
    expect((result.response as any).body).toEqual({ status: "active" });
  });

  it("generates examples for every API operation", () => {
    const results = new ExampleGenerationService().generateAll({ content: specification });

    expect(results).toHaveLength(2);
    expect(results.map(({ method, templatePath, statusCode }) => ({ method, templatePath, statusCode }))).toEqual([
      { method: "POST", templatePath: "/pets", statusCode: 201 },
      { method: "GET", templatePath: "/pets/{petId}", statusCode: 200 },
    ]);
    expect(results[0].request.body).toEqual({ name: "Luna" });
  });
});
