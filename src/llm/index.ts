import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModel } from 'ai';
import { LLM_API_KEY, LLM_BASE_URL, LLM_MODEL } from '../config';

export enum LLMProvider {
  OPENAI = 'openai',
  OPENAI_COMPATIBLE = 'openai-compatible',
  ANTHROPIC = 'anthropic',
}

export function validateLLMProvider(provider: string): LLMProvider {
  if (!Object.values(LLMProvider).includes(provider as LLMProvider)) {
    throw new Error(`Invalid LLM provider: ${provider}`);
  }
  return provider as LLMProvider;
}

export function getLanguageModel(llmProvider: LLMProvider): LanguageModel {
  if (!LLM_MODEL) {
    throw new Error('LLM_MODEL environment variable is required');
  }

  const providerConfig = {
    apiKey: LLM_API_KEY,
    baseURL: LLM_BASE_URL,
  };

  switch (llmProvider) {
    case LLMProvider.OPENAI:
    case LLMProvider.OPENAI_COMPATIBLE:
      return createOpenAI(providerConfig)(LLM_MODEL);
    case LLMProvider.ANTHROPIC:
      return createAnthropic(providerConfig)(LLM_MODEL);
    default:
      throw new Error(`Unknown LLM type: ${llmProvider}`);
  }
}
