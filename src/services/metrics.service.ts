import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly requestCounter: client.Counter;
  private readonly requestDuration: client.Histogram;

  constructor() {
    this.requestCounter = new client.Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'path', 'status_code'],
    });

    this.requestDuration = new client.Histogram({
      name: 'http_request_duration_ms',
      help: 'HTTP request duration in milliseconds',
      labelNames: ['method', 'path', 'status_code'],
      buckets: [10, 50, 100, 200, 500, 1000, 2000],
    });
  }

  recordRequest(path: string, statusCode: number, duration: number) {
    this.requestCounter.labels('GET', path, statusCode.toString()).inc();
    this.requestDuration
      .labels('GET', path, statusCode.toString())
      .observe(duration);
  }

  async getMetrics(): Promise<string> {
    return client.register.metrics();
  }
}
