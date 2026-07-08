import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { ValidationService } from "../services/ValidationService";

@injectable()
export class ValidationController {

  constructor(
    @inject(ValidationService)
    private readonly validationService: ValidationService
  ) {}

  validate = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const result = await this.validationService.validate(req.body);

    res.json(result);

  };

}