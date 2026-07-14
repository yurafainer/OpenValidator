export interface Property {
    name: string;

    type?: string;

    required?: string[];

    properties?: Map<string, Property>;

    items?: Property;

    enum?: unknown[];

    pattern?: string;

    format?: string;

    minLength?: number;

    maxLength?: number;

    minimum?: number;

    maximum?: number;

    nullable?: boolean;
   
    minItems?: number;
   
    maxItems?: number;
   
    uniqueItems?: boolean;
}