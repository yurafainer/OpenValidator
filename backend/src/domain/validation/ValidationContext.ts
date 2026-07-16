import type { OpenApiOperationModel } from "../openapi/OpenApiOperationModel";
import type { OpenApiSpecificationDocument } from "../openapi/OpenApiSpecificationDocument";
import type { ValidationError } from "./ValidationError";
import type { ValidationRequestData } from "./ValidationRequestData";
import type { ValidationResponseData } from "./ValidationResponseData";
import type { ValidationOptions } from "./ValidationOptions";
import { ValidationMode } from "./ValidationMode";

export class ValidationContext {
  private readonly validationErrors: ValidationError[] = [];
  private stopped = false;

  public operationModel?: OpenApiOperationModel;
  public requestBodySchemaFound = false;
  public responseBodySchemaFound = false;

  constructor(
    public readonly fileName: string = "unknown",
    public readonly specification: OpenApiSpecificationDocument = { paths: {} },
    public readonly request: ValidationRequestData = {
      path: "",
      method: "",
      headers: {},
      query: {},
    },
    public readonly response?: ValidationResponseData,
    public readonly options: ValidationOptions = { mode: ValidationMode.REQUEST },
  ) {}

  public validatesRequestParameters(): boolean {
    return this.options.mode === ValidationMode.REQUEST || this.options.mode === ValidationMode.FULL;
  }

  public validatesRequestBody(): boolean {
    return this.options.mode === ValidationMode.BODY || this.options.mode === ValidationMode.REQUEST || this.options.mode === ValidationMode.FULL;
  }

  public validatesResponse(): boolean {
    return this.options.mode === ValidationMode.RESPONSE || this.options.mode === ValidationMode.FULL;
  }

  public addError(error: ValidationError): void {
    this.validationErrors.push(error);
  }

  public addErrors(errors: ValidationError[]): void {
    this.validationErrors.push(...errors);
  }

  public stop(): void {
    this.stopped = true;
  }

  public get shouldStop(): boolean {
    return this.stopped;
  }

  public get errors(): readonly ValidationError[] {
    return this.validationErrors;
  }

  public get valid(): boolean {
    return this.validationErrors.length === 0;
  }
}
