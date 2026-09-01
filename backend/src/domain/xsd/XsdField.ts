export interface XsdField {
  name: string;
  type: string;
  length?: number;
  path: string;
  depth: number;
  minOccurs: string;
  maxOccurs: string;
  required: boolean;
  nillable: boolean;
  description?: string;
  allowedValues?: string[];
}

export interface XsdFieldExtractionResult {
  fileName: string;
  fieldCount: number;
  fields: XsdField[];
}
