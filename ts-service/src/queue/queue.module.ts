import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { LlmModule } from '../llm/llm.module';
import { QueueService } from './queue.service';
import { SummarizationWorker } from './summarization.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([CandidateDocument, CandidateSummary]),
    LlmModule,
  ],
  providers: [QueueService, SummarizationWorker],
  exports: [QueueService],
})
export class QueueModule {}
