import { Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  async proxyRequest(req: Request, res: Response, target: string) {
    const proxy = createProxyMiddleware({
      target: `http://${target}`,
      changeOrigin: true,
      pathRewrite: (path, req) => {
        // Remove the service prefix from the path
        const serviceName = path.split('/')[1];
        return path.replace(`/${serviceName}`, '');
      },
      onProxyReq: (proxyReq, req, res) => {
        this.logger.log(`Proxying ${req.method} ${req.url} to ${target}`);
        
        // Forward user information if available
        if (req.user) {
          proxyReq.setHeader('X-User-Id', (req.user as any).sub);
          proxyReq.setHeader('X-User-Email', (req.user as any).email);
          proxyReq.setHeader('X-User-Roles', JSON.stringify((req.user as any).roles || []));
        }
      },
      onError: (err, req, res) => {
        this.logger.error(`Proxy error for ${req.url}: ${err.message}`);
        res.status(503).json({
          error: 'Service Unavailable',
          message: 'The requested service is currently unavailable',
        });
      },
    });

    return proxy(req, res, (err) => {
      if (err) {
        this.logger.error(`Proxy middleware error: ${err.message}`);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'An error occurred while processing your request',
        });
      }
    });
  }
}
