import YAML from 'yaml';
import type { SpecificationLoader } from "../../application/services/ports/SpecificationLoader";

export class YamlSpecificationLoader implements SpecificationLoader {
  public async load(buffer: Buffer): Promise<object> {
    const content = buffer.toString('utf-8');

    const parsed = YAML.parse(content);


    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid YAML specification');
    }

    return parsed;
  }
}

