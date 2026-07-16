import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { ValidationHistoryStore } from "../../application/history/ValidationHistoryStore";

@injectable()
export class HistoryController {
  public constructor(@inject(ValidationHistoryStore) private readonly store: ValidationHistoryStore) {}

  public list = async (_req: Request, res: Response): Promise<void> => {
    res.json({ success: true, history: this.store.list() });
  };

  public get = async (req: Request, res: Response): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const entry = this.store.get(id);
    if (!entry) { res.status(404).json({ message: "History entry was not found" }); return; }
    res.json({ success: true, entry });
  };

  public clear = async (_req: Request, res: Response): Promise<void> => {
    this.store.clear();
    res.status(204).send();
  };
}
