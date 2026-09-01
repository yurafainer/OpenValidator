import "reflect-metadata";
import { describe, expect, it } from "vitest";

import { XsdFieldExtractionService } from "./XsdFieldExtractionService";

const schema = `
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Response">
    <xs:complexType>
      <xs:sequence>
        <xs:element ref="Header"/>
        <xs:element name="Items" minOccurs="0" maxOccurs="unbounded">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="Code" type="xs:string">
                <xs:annotation><xs:appinfo><FieldInfo Length="6"/></xs:appinfo></xs:annotation>
              </xs:element>
              <xs:element name="Amount">
                <xs:annotation><xs:documentation>Item amount</xs:documentation></xs:annotation>
                <xs:simpleType>
                  <xs:restriction base="xs:decimal"><xs:totalDigits value="9"/></xs:restriction>
                </xs:simpleType>
              </xs:element>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

describe("XsdFieldExtractionService", () => {
  const service = new XsdFieldExtractionService();

  it("flattens elements in schema order with import-compatible values", () => {
    const result = service.extract(schema, "response.xsd");

    expect(result.fileName).toBe("response.xsd");
    expect(result.fields.map(({ name, type, length }) => ({ name, type, length }))).toEqual([
      { name: "Response", type: "complexType", length: undefined },
      { name: "Header", type: "ref:Header", length: undefined },
      { name: "Items", type: "unbounded", length: undefined },
      { name: "Code", type: "string", length: 6 },
      { name: "Amount", type: "decimal", length: 9 },
    ]);
    expect(result.fields[3].path).toBe("Response.Items.Code");
    expect(result.fields[4]).toMatchObject({ description: "Item amount", required: true });
  });

  it("rejects malformed XML and non-XSD documents", () => {
    expect(() => service.extract("<xs:schema>"))
      .toThrow(/Invalid XSD/);
    expect(() => service.extract("<root/>"))
      .toThrow(/Schema root/);
  });

  it("flattens a repeated wrapper that only contains another repeated block", () => {
    const wrapped = `<schema xmlns="http://www.w3.org/2001/XMLSchema">
      <element name="Root"><complexType><sequence>
        <element name="Continuation" maxOccurs="unbounded"><complexType><sequence>
          <element name="Record" maxOccurs="unbounded"><complexType><sequence>
            <element name="Value" type="string"/>
          </sequence></complexType></element>
        </sequence></complexType></element>
      </sequence></complexType></element>
    </schema>`;

    const fields = service.extract(wrapped).fields;
    expect(fields.map((field) => field.name)).toEqual(["Root", "Record", "Value"]);
    expect(fields[1].path).toBe("Root.Record");
  });
});
