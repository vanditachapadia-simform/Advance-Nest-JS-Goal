import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE } from '../../shared/constants';

/**
 * Consumes the `email` queue. In a real system each handler would call an SMTP
 * / SES provider; here we simulate the work and log the outcome. `concurrency`
 * lets multiple jobs process in parallel within one worker.
 */
@Processor(QUEUE.EMAIL, { concurrency: 5 })
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(job: Job): Promise<{ sent: boolean; jobName: string }> {
    switch (job.name) {
      case 'welcome':
        this.logger.log(`Sending welcome email to ${job.data.email}`);
        break;
      case 'shipment-update':
        this.logger.log(
          `Emailing shipment ${job.data.shipmentNumber} update (${job.data.status}) to ${job.data.email}`,
        );
        break;
      case 'delivery-notification':
        this.logger.log(
          `Emailing delivery notification for ${job.data.shipmentNumber} to ${job.data.email}`,
        );
        break;
      default:
        this.logger.warn(`Unknown email job: ${job.name}`);
    }
    // Simulate provider latency.
    await new Promise((r) => setTimeout(r, 50));
    return { sent: true, jobName: job.name };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Email job ${job.id} (${job.name}) failed: ${err.message}`);
  }
}
