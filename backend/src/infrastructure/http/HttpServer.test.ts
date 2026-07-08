import { requestLogger } from "../../common/logger/requestLogger";
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { Configuration } from '../config/Configuration';
import { HttpServer } from './HttpServer';

describe('HttpServer', () => {
  it('should return health status', async () => {
    const configuration = new Configuration();
    const httpServer = new HttpServer(configuration);

    const response = await request(httpServer.getApp())
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'UP',
      application: 'OpenValidator',
      version: '0.1.0',
    });
  });
});