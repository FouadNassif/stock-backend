import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { map, Observable } from 'rxjs';

type StandardResponse<T> = {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
    timestamp: string;
    path: string;
};

type ResponseWithMessage<T> = { message?: string; } & T;

@Injectable()
export class ResponseTransformInterceptor<T>
    implements NestInterceptor<T, StandardResponse<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler<T>,
    ): Observable<StandardResponse<T>> {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<Request>();
        const response = httpContext.getResponse<Response>();

        return next.handle().pipe(
            map((data: T) => {
                const message = this.extractMessage(data);

                return {
                    success: true,
                    statusCode: response.statusCode,
                    message,
                    data,
                    timestamp: new Date().toISOString(),
                    path: request.originalUrl,
                };
            }),
        );
    }

    private extractMessage(data: T): string {
        if (
            data &&
            typeof data === 'object' &&
            'message' in data &&
            typeof (data as ResponseWithMessage<T>).message === 'string'
        ) {
            return (data as ResponseWithMessage<T>).message as string;
        }

        return 'Request completed successfully';
    }
}