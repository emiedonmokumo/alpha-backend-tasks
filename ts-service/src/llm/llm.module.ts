import { Module } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { FakeSummarizationProvider } from './fake-summarization.provider';
import { GeminiSummarizationProvider } from './gemini-summarization.provider';
import { SUMMARIZATION_PROVIDER } from './summarization-provider.interface';

@Module({
  providers: [
    FakeSummarizationProvider,
    GeminiSummarizationProvider,
    {
      provide: SUMMARIZATION_PROVIDER,
      inject: [ConfigService, GeminiSummarizationProvider, FakeSummarizationProvider],
      useFactory: (configService: ConfigService, gemini: GeminiSummarizationProvider, fake: FakeSummarizationProvider) => {
        return configService.get('GEMINI_API_KEY') ? gemini : fake;
      },
    },
  ],
  exports: [SUMMARIZATION_PROVIDER],
})
export class LlmModule {}
