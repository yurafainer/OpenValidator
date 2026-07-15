import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { UploadService } from "../../application/services/UploadService";
import { ValidationService } from "../../application/services/ValidationService";

@injectable()
export class ValidationController {
  constructor(
    @inject(UploadService)
    private readonly uploadService: UploadService,

    @inject(ValidationService)
    private readonly validationService: ValidationService,
  ) {}

  validate = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const specification = this.uploadService.getSpecification(req);

    const path = req.body.path;
    const method = req.body.method;

    if (!path || typeof path !== "string") {
      res.status(400).json({
        message: "Path is required",
      });
      return;
    }

    if (!method || typeof method !== "string") {
      res.status(400).json({
        message: "Method is required",
      });
      return;
    }
let requestBody: unknown;

if (req.body.requestBody) {
  try {
    requestBody = JSON.parse(req.body.requestBody);
  } catch {
    res.status(400).json({
      message: "requestBody must contain valid JSON",
    });
    return;
  }
}

const result = await this.validationService.validate(
  specification,
  path,
  method,
  requestBody,
);
    res.json(result);
  };
}