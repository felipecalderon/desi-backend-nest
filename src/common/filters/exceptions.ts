import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AbstractHttpAdapter } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';
import { FastifyReply, FastifyRequest } from 'fastify';

interface IErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  data: undefined;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapter: AbstractHttpAdapter) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();

    const reply = ctx.getResponse<FastifyReply>();
    const req = ctx.getRequest<FastifyRequest>();

    let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal Server Error';
    let error: string = 'InternalServerError';

    if (exception instanceof QueryFailedError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      error = exception.name || 'QueryFailedError';
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
        error = exception.name.replace(/Exception$/, '');
      } else {
        const httpResponse = response as Record<string, string>;
        message = httpResponse.message ?? 'An HTTP error occurred.';
        error = httpResponse.error ?? exception.name.replace(/Exception$/, '');
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error(`Unhandled Exception at ${req.url}:`, exception);
    }

    const errorResponse: IErrorResponse = {
      statusCode: status,
      message: message,
      error: error,
      data: undefined,
    };

    this.httpAdapter.reply(reply, errorResponse, status);
  }
}
