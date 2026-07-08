import { injectable } from "tsyringe";
import { Request } from "express";
import { Specification } from "../../domain/models/Specification";

@injectable()
export class UploadService {

    public getSpecification(request: Request): Specification {
        const file = request.file;

        if (!file) {
            throw new Error("Specification file is required");
        }

        return {
            fileName: file.originalname,
            content: file.buffer.toString("utf8")
        };
    }
}