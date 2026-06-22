import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Employee Management System',
      uptime: process.uptime(),
    };
  }

  getVersion() {
    return {
      version: '1.0.0',
      apiVersion: 'v1',
      name: 'Employee Management System API',
    };
  }
}
