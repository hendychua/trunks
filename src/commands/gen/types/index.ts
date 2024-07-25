import { LLMProvider } from 'src/llm';

export enum TestType {
  postman = 'postman',
  unit = 'unit',
}

export type BranchContext = {
  baseBranch: string;
  workingBranch: string;
};

export type TestGenerationInput = {
  inputDir: string;
  outputDir?: string;
  type: TestType;
  branchContext?: BranchContext;
  llmProvider: LLMProvider;
};
