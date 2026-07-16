import type { ValidationError } from "./ValidationError";

export class ValidationContext {

    private readonly _errors: ValidationError[] = [];

    public addErrors(errors: ValidationError[]): void {
        this._errors.push(...errors);
    }

    public get errors(): ValidationError[] {
        return this._errors;
    }

    public get valid(): boolean {
        return this._errors.length === 0;
    }
}