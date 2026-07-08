import { container } from './DependencyContainer';
import { ILogger } from '../../common/logger/ILogger';
import { LoggerService } from '../../common/logger/LoggerService';

export function registerDependencies(): void {
  container.registerSingleton<ILogger>('ILogger', LoggerService);
}