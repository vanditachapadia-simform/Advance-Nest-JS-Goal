import { Injectable, Logger, Scope } from '@nestjs/common';

/**
 * CONCEPT #4: Injection scopes (TRANSIENT).
 *
 * A TRANSIENT provider is instantiated fresh for every consumer that injects it.
 * That lets each service stamp the logger with its own context/prefix without
 * sharing state — unlike a DEFAULT (singleton) provider.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger {
  private context = 'App';
  private readonly logger = new Logger();

  setContext(context: string): this {
    this.context = context;
    return this;
  }

  log(message: string): void {
    this.logger.log(`${message}`, this.context);
  }

  warn(message: string): void {
    this.logger.warn(`${message}`, this.context);
  }
}
