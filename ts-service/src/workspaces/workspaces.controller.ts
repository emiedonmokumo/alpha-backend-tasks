import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/auth-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { FakeAuthGuard } from '../auth/fake-auth.guard';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @UseGuards(FakeAuthGuard)
  createWorkspace(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.createWorkspace(user, dto);
  }

  @Get()
  getWorkspaces() {
    return this.workspacesService.getWorkspaces();
  }

  @Get(':id')
  getWorkspace(@Param('id') id: string) {
    return this.workspacesService.getWorkspace(id);
  }

  @Delete(':id')
  deleteWorkspace(@Param('id') id: string) {
    return this.workspacesService.deleteWorkspace(id);
  }
}
