import type { Schema } from "./Schema";

export interface Specification {
    schemas: Map<string, Schema>;
}