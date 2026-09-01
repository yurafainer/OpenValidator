import "reflect-metadata";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

import { Configuration } from "../config/Configuration";
import { registerDependencies } from "../di/registerDependencies";
import { HttpServer } from "./HttpServer";

const xsd = `
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="message" type="xs:string"/>
</xs:schema>`;

describe("POST /api/v1/xsd/fields", () => {
  beforeAll(() => registerDependencies());

  it("extracts fields from an uploaded XSD", async () => {
    const app = new HttpServer(new Configuration()).getApp();
    const response = await request(app)
      .post("/api/v1/xsd/fields")
      .attach("xsdFile", Buffer.from(xsd), "message.xsd");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      fileName: "message.xsd",
      fieldCount: 1,
      fields: [{ name: "message", type: "string", path: "message" }],
    });
  });

  it("extracts fields from pasted XSD text", async () => {
    const app = new HttpServer(new Configuration()).getApp();
    const response = await request(app)
      .post("/api/v1/xsd/fields")
      .field("xsd", xsd);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      fileName: "schema.xsd",
      fieldCount: 1,
      fields: [{ name: "message", type: "string" }],
    });
  });

  it("requires XSD input", async () => {
    const app = new HttpServer(new Configuration()).getApp();
    const response = await request(app).post("/api/v1/xsd/fields");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("XSD is required");
  });
});
