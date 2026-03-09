# Project Architecture & Design Notes

## Overview
This is a NestJS-based backend system for candidate management, assessment summary generation, and workspace isolation. The architecture follows a modular design pattern with clear separation of concerns across authentication, candidates, documents, LLM integration, and async task processing.

---

## Design Decisions

### 1. **Multi-Tenant Architecture**
Every candidate, document, and summary includes a `workspaceId` for data isolation. Service layer validates workspace access.

### 2. **Modular Architecture**
Feature-based modules: CandidatesModule, WorkspacesModule, LlmModule, QueueModule with clear dependency management.

### 3. **Pluggable LLM Providers**
Abstract LLM functionality behind an interface. Switch between GeminiSummarizationProvider (production) and FakeSummarizationProvider (testing) via `GEMINI_API_KEY` env var.

### 4. **Async Task Queue**
QueueService + SummarizationWorker handle long-running summary generation asynchronously with status tracking (pending → completed/failed).

### 5. **Fake Authentication**
FakeAuthGuard extracts user context from request headers for rapid development. Replace with JWT in production.

### 6. **Document Storage**
Store raw text in database for processing. Optional `storageKey` field for external storage integration (S3, GCS, etc.).

---

## Schema Decisions

### Core Entities

**`candidate_documents` Table**
- UUID primary key, `candidate_id`, `workspace_id` (varchar 64 for multi-tenant)
- `documentType`, `fileName`, `storageKey` (nullable), `rawText`, `uploadedAt`

**`candidate_summaries` Table**
- UUID primary key, `candidate_id`, `workspace_id`
- `status` ('pending' | 'completed' | 'failed')
- `score`, `strengths`, `concerns` (JSONB), `summary`, `recommendedDecision`
- `createdAt`, `updatedAt` timestamps

**Design Rationale**:
- UUID for distributed ID generation
- JSONB for flexible structured data and future indexing
- Nullable summary fields prevent blocking on incomplete async operations
- Workspace + candidate composite queries optimize common operations

---

## Areas for Future Enhancement

The following areas are identified for future improvements:
- **Testing**: Add comprehensive unit, integration, and E2E tests (target 80%+ coverage)
- **Authentication**: Replace FakeAuthGuard with JWT-based authentication
- **Authorization**: Implement RBAC (WORKSPACE_ADMIN, RECRUITER, VIEWER roles)
- **Observability**: Add structured logging, metrics (Prometheus), and tracing
- **Performance**: Database optimization, caching (Redis), pagination
- **Security**: CORS, rate limiting, data encryption, audit trails

---

## API Endpoints Overview

- **Postman Collection**: [Alpha Backend API Documentation](https://documenter.getpostman.com/view/52564759/2sBXcLhHrC)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | No | Health check |
| POST | `/candidates` | Yes | Create candidate |
| GET | `/candidates` | Yes | List candidates |
| POST | `/candidates/:id/documents` | Yes | Upload document |
| POST | `/candidates/:id/summaries/generate` | Yes | Queue summary generation |
| GET | `/candidates/:id/summaries` | Yes | List summaries |
| GET | `/candidates/:id/summaries/:id` | Yes | Get summary |
| POST | `/workspaces` | Yes | Create workspace |
| GET | `/workspaces` | No | List workspaces |
| GET | `/workspaces/:id` | No | Get workspace |
| DELETE | `/workspaces/:id` | No | Delete workspace |

---

## Development Notes

- **Database**: PostgreSQL with TypeORM migrations
- **Language**: TypeScript
- **Framework**: NestJS with dependency injection
- **Task Queue**: In-memory (upgrade to Bull/RabbitMQ for production)
- **LLM Integration**: Google Gemini or Fake provider
- **Authentication**: FakeAuthGuard (extract user/workspace from headers)

---