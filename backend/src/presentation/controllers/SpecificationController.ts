import { Request, Response } from 'express';
import { LoadSpecificationUseCase } from '../../application/usecases/LoadSpecificationUseCase';

export class SpecificationController {
  constructor(
    private readonly loadSpecificationUseCase: LoadSpecificationUseCase,
  ) {}

  public load = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          message: 'Specification file is required',
        });
        return;
      }

      const specification = await this.loadSpecificationUseCase.execute(
        req.file.buffer,
      );

      res.status(200).json({
        success: true,
        specification,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}
