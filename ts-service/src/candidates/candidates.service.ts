import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthUser } from '../auth/auth.types';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { QueueService } from '../queue/queue.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(SampleCandidate)
    private readonly candidateRepository: Repository<SampleCandidate>,
    @InjectRepository(CandidateDocument)
    private readonly documentRepository: Repository<CandidateDocument>,
    @InjectRepository(CandidateSummary)
    private readonly summaryRepository: Repository<CandidateSummary>,
    private readonly queueService: QueueService,
  ) {}

  private async validateCandidateAccess(user: AuthUser, candidateId: string): Promise<SampleCandidate> {
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    if (candidate.workspaceId !== user.workspaceId) {
      throw new ForbiddenException('You do not have access to this candidate');
    }

    return candidate;
  }

  async createCandidate(user: AuthUser, dto: CreateCandidateDto) {
    const candidateId = crypto.randomUUID();

    const candidate = this.candidateRepository.create({
      id: candidateId,
      workspaceId: user.workspaceId,
      fullName: dto.fullName,
      email: dto.email,
    });

    try {
      return await this.candidateRepository.save(candidate);
    } catch (error: any) {
      if (
        error.name === 'QueryFailedError' &&
        error.message.includes('foreign key constraint') &&
        error.message.includes('workspace_id')
      ) {
        throw new NotFoundException(
          `Workspace with ID ${user.workspaceId} not found`,
        );
      }
      throw error;
    }
  }

  async listCandidates(user: AuthUser) {
    let query: {
      workspaceId?: string;
    } = {};

    if (user.workspaceId) {
      query.workspaceId = user.workspaceId;
    }

    return this.candidateRepository.find({
      where: query,
      order: { createdAt: 'DESC' },
    });
  }

  async uploadDocument(user: AuthUser, candidateId: string, dto: UploadDocumentDto) {
    await this.validateCandidateAccess(user, candidateId);

    const document = this.documentRepository.create({
      ...dto,
      candidateId,
      workspaceId: user.workspaceId,
    });

    return this.documentRepository.save(document);
  }

  async generateSummary(user: AuthUser, candidateId: string) {
    await this.validateCandidateAccess(user, candidateId);

    const summary = this.summaryRepository.create({
      candidateId,
      workspaceId: user.workspaceId,
      status: 'pending',
    });

    const savedSummary = await this.summaryRepository.save(summary);

    this.queueService.enqueue('summarize-candidate', {
      summaryId: savedSummary.id,
      candidateId,
      workspaceId: user.workspaceId,
    });

    return savedSummary;
  }

  async listSummaries(user: AuthUser, candidateId: string) {
    await this.validateCandidateAccess(user, candidateId);

    return this.summaryRepository.find({
      where: { candidateId, workspaceId: user.workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  async getSummary(user: AuthUser, candidateId: string, summaryId: string) {
    await this.validateCandidateAccess(user, candidateId);

    const summary = await this.summaryRepository.findOne({
      where: { id: summaryId, candidateId, workspaceId: user.workspaceId },
    });

    if (!summary) {
      throw new NotFoundException(`Summary with ID ${summaryId} not found`);
    }

    return summary;
  }
}
