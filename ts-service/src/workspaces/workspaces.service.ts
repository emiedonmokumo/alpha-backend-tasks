import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthUser } from '../auth/auth.types';
import { SampleWorkspace } from '../entities/sample-workspace.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(SampleWorkspace)
    private readonly workspaceRepository: Repository<SampleWorkspace>,
  ) {}

  async createWorkspace(user: AuthUser, dto: CreateWorkspaceDto) {
    let workspace = await this.workspaceRepository.findOne({
      where: { id: user.workspaceId },
    });

    if (workspace) {
      throw new ConflictException(
        `Workspace with ID ${user.workspaceId} already exists`,
      );
    }

    workspace = this.workspaceRepository.create({
      id: user.workspaceId,
      name: dto.name,
    });

    return this.workspaceRepository.save(workspace);
  }

  async getWorkspaces() {
    return this.workspaceRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getWorkspace(id: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }

    return workspace;
  }

  async deleteWorkspace(id: string) {
    const workspace = await this.getWorkspace(id);
    await this.workspaceRepository.remove(workspace);
    return { success: true };
  }
}
