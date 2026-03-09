import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SUMMARIZATION_PROVIDER, SummarizationProvider } from '../llm/summarization-provider.interface';
import { QueueService, EnqueuedJob } from './queue.service';

export interface SummarizationJobPayload {
  summaryId: string;
  candidateId: string;
  workspaceId: string;
}

@Injectable()
export class SummarizationWorker implements OnModuleInit {
  private readonly logger = new Logger(SummarizationWorker.name);
  private isProcessing = false;

  constructor(
    private readonly queueService: QueueService,
    @InjectRepository(CandidateDocument)
    private readonly documentRepository: Repository<CandidateDocument>,
    @InjectRepository(CandidateSummary)
    private readonly summaryRepository: Repository<CandidateSummary>,
    @Inject(SUMMARIZATION_PROVIDER)
    private readonly summarizationProvider: SummarizationProvider,
  ) {}

  onModuleInit() {
    this.logger.log('Summarization worker initialized. Starting polling loop...');
    this.startPolling();
  }

  private startPolling() {
    setInterval(async () => {
      if (this.isProcessing) return;
      await this.processNextJob();
    }, 5000); // Poll every 5 seconds
  }

  private async processNextJob() {
    const jobs = this.queueService.getQueuedJobs();
    const job = jobs.find((j) => j.name === 'summarize-candidate');

    if (!job) return;

    this.isProcessing = true;
    const payload = job.payload as SummarizationJobPayload;
    this.logger.log(`Processing job ${job.id} for candidate ${payload.candidateId}`);

    try {
      // Remove job from queue (simplistic as this is an in-memory starter)
      const jobIdx = (this.queueService as any).jobs.indexOf(job);
      if (jobIdx > -1) {
        (this.queueService as any).jobs.splice(jobIdx, 1);
      }

      const { summaryId, candidateId, workspaceId } = payload;

      // Fetch documents
      const documents = await this.documentRepository.find({
        where: { candidateId, workspaceId },
      });

      if (documents.length === 0) {
        throw new Error('No documents found for candidate');
      }

      // Call provider
      const result = await this.summarizationProvider.generateCandidateSummary({
        candidateId,
        documents: documents.map((d) => d.rawText),
      });

      // Update summary
      await this.summaryRepository.update(summaryId, {
        status: 'completed',
        score: result.score,
        strengths: result.strengths,
        concerns: result.concerns,
        summary: result.summary,
        recommendedDecision: result.recommendedDecision,
        provider: 'gemini-3-flash',
        promptVersion: '1.0',
      });

      this.logger.log(`Job ${job.id} completed successfully`);
    } catch (error: any) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`);
      
      const payload = job.payload as SummarizationJobPayload;
      const { summaryId } = payload;
      await this.summaryRepository.update(summaryId, {
        status: 'failed',
        errorMessage: error.message,
      });
    } finally {
      this.isProcessing = false;
    }
  }
}
