import { describe, expect, it, vi } from "vitest";
import { ValidationContext } from "../../domain/validation/ValidationContext";
import { RequestValidationPipeline } from "./RequestValidationPipeline";
import type { RequestValidationStep } from "./RequestValidationStep";

function context(): ValidationContext {
  return new ValidationContext(
    "test.yaml",
    { openapi: "3.0.0", paths: {} },
    { path: "/test", method: "GET", headers: {}, query: {} },
  );
}

describe("RequestValidationPipeline", () => {
  it("should execute steps in their registered order", async () => {
    const calls: string[] = [];
    const steps: RequestValidationStep[] = [
      { name: "path", validate: () => { calls.push("path"); } },
      { name: "method", validate: () => { calls.push("method"); } },
      { name: "parameters", validate: () => { calls.push("parameters"); } },
    ];

    const pipeline = new RequestValidationPipeline(steps);
    await pipeline.execute(context());

    expect(calls).toEqual(["path", "method", "parameters"]);
    expect(pipeline.stepNames).toEqual(["path", "method", "parameters"]);
  });

  it("should stop executing after the context is stopped", async () => {
    const secondStep = vi.fn();
    const pipeline = new RequestValidationPipeline([
      {
        name: "first",
        validate: (validationContext) => validationContext.stop(),
      },
      { name: "second", validate: secondStep },
    ]);

    await pipeline.execute(context());

    expect(secondStep).not.toHaveBeenCalled();
  });
});
