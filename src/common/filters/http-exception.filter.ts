import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

type ErrorResponseBody = {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
};

type HttpExceptionResponse = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const statusCode: HttpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const formattedResponse = this.formatResponse(
      statusCode,
      exceptionResponse,
      request.url,
    );

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const errorMessage =
        exception instanceof Error ? exception.message : 'Unknown error';

      this.logger.error(
        `${request.method} ${request.url} ${statusCode} - ${errorMessage}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(statusCode).json(formattedResponse);
  }

  private formatResponse(
    statusCode: HttpStatus,
    exceptionResponse: string | object | null,
    path: string,
  ): ErrorResponseBody {
    if (typeof exceptionResponse === 'string') {
      return {
        statusCode,
        message: exceptionResponse,
        error: this.getDefaultError(statusCode),
        timestamp: new Date().toISOString(),
        path,
      };
    }

    if (exceptionResponse && typeof exceptionResponse === 'object') {
      const responseBody = exceptionResponse as HttpExceptionResponse;

      return {
        statusCode,
        message: responseBody.message ?? this.getDefaultMessage(statusCode),
        error: responseBody.error ?? this.getDefaultError(statusCode),
        timestamp: new Date().toISOString(),
        path,
      };
    }

    return {
      statusCode,
      message:
        statusCode === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal server error'
          : this.getDefaultMessage(statusCode),
      error: this.getDefaultError(statusCode),
      timestamp: new Date().toISOString(),
      path,
    };
  }

  private getDefaultMessage(statusCode: HttpStatus): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not found';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Too many requests';
      default:
        return 'Error';
    }
  }

  private getDefaultError(statusCode: HttpStatus): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Too Many Requests';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal Server Error';
      default:
        return 'Error';
    }
  }
}
