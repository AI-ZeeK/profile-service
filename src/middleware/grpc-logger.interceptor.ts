import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class GrpcLoggerInterceptor implements NestInterceptor {
  private logger = new Logger('gRPC');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler().name;
    const className = context.getClass().name;
    this.logger.log(`Incoming gRPC call: ${className}.${handler}`);

    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - now;
        this.logger.log(
          `gRPC call ${className}.${handler} completed in ${ms}ms`,
        );
      }),
    );
  }
}
