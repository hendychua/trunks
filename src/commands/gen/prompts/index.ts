import { TestType } from '../types';

export type BuildTestGenerationPromptInput = {
  testType: TestType;
  differentOutputDir: boolean;
  changesInBranchOnly: boolean;
};

export function buildTestGenerationPrompt(
  input: BuildTestGenerationPromptInput,
): string {
  const { testType, differentOutputDir, changesInBranchOnly } = input;
  let testTypeDetails: string;
  switch (testType) {
    case TestType.postman:
      testTypeDetails = 'API tests in the form of Postman collections';
      break;
    case TestType.unit:
      testTypeDetails = 'unit tests';
      break;
    default:
      throw new Error(`Invalid test type: ${testType}`);
  }

  return `Generate ${testTypeDetails} for the input codebase.
${
  differentOutputDir
    ? 'The output directory is different from the input directory. You are also provided with the contents in the output directory for context.'
    : ''
}
${
  changesInBranchOnly
    ? 'You are also provided with the diff between the current branch and base branch. Generate output for the changes in this diff only.'
    : ''
}
Rules:
1. You are allowed to create new files or modify existing files in the output codebase, or input codebase if there is no output codebase.
2. It must be proper code.
`;
}
