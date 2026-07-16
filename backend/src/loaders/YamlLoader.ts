import { injectable } from "tsyringe";
import YAML from "yaml";

@injectable()
export class YamlLoader {
  parse(content: string): unknown {
    return YAML.parse(content);
  }
}