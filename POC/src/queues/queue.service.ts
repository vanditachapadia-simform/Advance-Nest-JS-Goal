import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE } from '../shared/constants';

/**
 * Producer facade over the BullMQ queues. Controllers/services enqueue work
 * here; the heavy lifting runs out-of-band in the processors. Jobs carry an
 * `attempts` + exponential backoff policy so transient failures self-heal.
 */
@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(QUEUE.EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QUEUE.REPORT) private readonly reportQueue: Queue,
    @InjectQueue(QUEUE.DOCUMENT) private readonly documentQueue: Queue,
  ) {}

  private readonly defaultOpts = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  };

  // ---- Email jobs ----
  enqueueWelcomeEmail(data: { email: string; firstName: string }) {
    return this.emailQueue.add('welcome', data, this.defaultOpts);
  }

  enqueueShipmentUpdateEmail(data: { email: string; shipmentNumber: string; status: string }) {
    return this.emailQueue.add('shipment-update', data, this.defaultOpts);
  }

  enqueueDeliveryNotificationEmail(data: { email: string; shipmentNumber: string }) {
    return this.emailQueue.add('delivery-notification', data, this.defaultOpts);
  }

  // ---- Report jobs ----
  enqueuePdfReport(data: { reportId: string; type: string; filters?: Record<string, unknown> }) {
    return this.reportQueue.add('generate-pdf', data, this.defaultOpts);
  }

  enqueueExcelReport(data: { reportId: string; type: string }) {
    return this.reportQueue.add('generate-excel', data, this.defaultOpts);
  }

  enqueueDashboardReport(data: { reportId: string }) {
    return this.reportQueue.add('generate-dashboard', data, this.defaultOpts);
  }

  // ---- Document jobs ----
  enqueueDocumentProcessing(data: { documentId: string }) {
    return this.documentQueue.add('process', data, this.defaultOpts);
  }
}
