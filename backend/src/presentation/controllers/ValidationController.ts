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
    private readonly validationService: ValidationService
  ) {}

  validate = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const specification = this.uploadService.getSpecification(req);

    const result = await this.validationService.validate(specification);

    res.json(result);
  };
}