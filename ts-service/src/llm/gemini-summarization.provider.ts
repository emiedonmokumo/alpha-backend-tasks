import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  CandidateSummaryInput,
  CandidateSummaryResult,
  SummarizationProvider,
} from './summarization-provider.interface';

@Injectable()
export class GeminiSummarizationProvider implements SummarizationProvider {
  private readonly logger = new Logger(GeminiSummarizationProvider.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';
  }

  async generateCandidateSummary(
    input: CandidateSummaryInput,
  ): Promise<CandidateSummaryResult> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const prompt = this.buildPrompt(input);

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error(`Gemini API error: ${JSON.stringify(errorData)}`);
        throw new Error(`Gemini API failed with status ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      return JSON.parse(text) as CandidateSummaryResult;
    } catch (error: any) {
      this.logger.error(`Failed to generate summary: ${error.message}`);
      throw error;
    }
  }

  private buildPrompt(input: CandidateSummaryInput): string {
    const documentsContent = input.documents.join('\n\n--- Document ---\n\n');
    
    return `
You are an expert recruiter assistant. Analyze the provided candidate documents and generate a structured summary.
Your output MUST be a valid JSON object matching this structure:
{
  "score": number (0-100),
  "strengths": string[],
  "concerns": string[],
  "summary": string,
  "recommendedDecision": "advance" | "hold" | "reject"
}

Candidate ID: ${input.candidateId}

Documents:
${documentsContent}
    `;
  }
}
