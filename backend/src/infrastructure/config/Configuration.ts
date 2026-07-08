export class Configuration {
  public readonly port: number;
  public readonly applicationName: string;
  public readonly version: string;

  constructor() {
    this.port = Number(process.env.PORT) || 3000;
    this.applicationName = process.env.APP_NAME || 'OpenValidator';
    this.version = process.env.APP_VERSION || '0.1.0';
  }
}