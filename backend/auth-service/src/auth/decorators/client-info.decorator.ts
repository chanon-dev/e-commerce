import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetClientInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    // Get IP address (considering proxies)
    const ipAddress = 
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      '127.0.0.1';

    // Get user agent
    const userAgent = request.headers['user-agent'] || 'Unknown';

    // Get additional client info
    const acceptLanguage = request.headers['accept-language'] || '';
    const acceptEncoding = request.headers['accept-encoding'] || '';
    const referer = request.headers['referer'] || '';
    const origin = request.headers['origin'] || '';

    return {
      ipAddress,
      userAgent,
      acceptLanguage,
      acceptEncoding,
      referer,
      origin,
      headers: request.headers,
    };
  },
);

export const GetIpAddress = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      '127.0.0.1'
    );
  },
);

export const GetUserAgent = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['user-agent'] || 'Unknown';
  },
);
