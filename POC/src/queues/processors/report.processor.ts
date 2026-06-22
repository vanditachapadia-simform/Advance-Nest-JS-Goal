import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE } from '../../shared/constants';

/**
 * Consumes the `report` queue — long-running PDF/Excel/dashboard generation
 * that must never block an HTTP request. Reports `job.updateProgress` so a
 * client polling job status (or a WS subscriber) can show a progress bar.
 */
@Processor(QUEUE.REPORT, { concurrency: 2 })
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  async process(job: Job): Promise<{ reportId: string; format: string }> {
    this.logger.log(`Generating report ${job.data.reportId} via ${job.name}`);
    // Simulate multi-step generation with progress updates.
    for (const pct of [25, 50, 75, 100]) {
      await new Promise((r) => setTimeout(r, 100));
      await job.updateProgress(pct);
    }
    const format = job.name.replace('generate-', '');
    return { reportId: job.data.reportId, format };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Report job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Report job ${job.id} failed: ${err.message}`);
  }
}
