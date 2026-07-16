import type { Property } from "./Property";

export interface Schema extends Property {
    name: string;
    type: string;
    required: string[];
    properties: Map<string, Property>;
}