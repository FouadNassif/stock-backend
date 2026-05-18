import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startedAt;

        this.logger.log(
          `${request.method} ${request.originalUrl} ${response.statusCode} ${durationMs}ms`,
        );
      }),
    );
  }
}
