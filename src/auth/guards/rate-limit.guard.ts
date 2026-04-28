import { ArgumentsHost, ExceptionFilter, Catch } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(_: ThrottlerException, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();

    res.status(429).json({
      statusCode: 429,
      message: 'Too many requests. Please slow down.',
      error: 'RATE_LIMIT_EXCEEDED',
    });
  }
}
