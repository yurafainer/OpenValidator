import { describe, expect, it } from "vitest";

import { DefaultXmlSchemaValidator } from "./DefaultXmlSchemaValidator";

const xsd = `
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="person">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="name" type="xs:string"/>
        <xs:element name="age" type="xs:positiveInteger"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

describe("DefaultXmlSchemaValidator", () => {
  const validator = new DefaultXmlSchemaValidator();

  it("validates a valid XML document", async () => {
    const result = await validator.validate({
      xsd,
      xml: "<person><name>Yura</name><age>47</age></person>",
      schemaFileName: "person.xsd",
      xmlFileName: "person.xml",
    });

    expect(result.valid).toBe(true);
    expect(result.errorCount).toBe(0);
    expect(result.format).toBe("XML_XSD");
  });

  it("returns structured errors for an XML that violates the XSD", async () => {
    const result = await validator.validate({
      xsd,
      xml: "<person><name>Yura</name><age>-1</age></person>",
      schemaFileName: "person.xsd",
    });

    expect(result.valid).toBe(false);
    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.errors[0]).toEqual(expect.objectContaining({
      severity: "ERROR",
      message: expect.any(String),
      path: expect.any(String),
    }));
  });

  it("returns an error for malformed XML", async () => {
    const result = await validator.validate({
      xsd,
      xml: "<person><name>Yura</person>",
      schemaFileName: "person.xsd",
    });

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("INVALID_XML_DOCUMENT");
  });
});
