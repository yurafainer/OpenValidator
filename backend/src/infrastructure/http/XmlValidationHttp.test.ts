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

describe("POST /api/v1/validate/xml", () => {
  beforeAll(() => registerDependencies());

  it("validates XML uploaded as text", async () => {
    const app = new HttpServer(new Configuration()).getApp();

    const response = await request(app)
      .post("/api/v1/validate/xml")
      .attach("xsdFile", Buffer.from(xsd), "message.xsd")
      .field("xml", "<message>Hello</message>");

    expect(response.status).toBe(200);
    expect(response.body.valid).toBe(true);
  });

  it("requires an XSD file", async () => {
    const app = new HttpServer(new Configuration()).getApp();

    const response = await request(app)
      .post("/api/v1/validate/xml")
      .field("xml", "<message>Hello</message>");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("XSD file is required");
  });
});
