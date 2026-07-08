import { injectable } from "tsyringe";

import { Specification } from "../../domain/models/Specification";

@injectable()
export class ValidationService {

  public async validate(specification: Specification): Promise<object> {
    return {
      valid: true,
      fileName: specification.fileName,
      message: "Specification file received successfully"
    };
  }
}