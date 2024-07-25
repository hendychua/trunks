import { TestType, BranchContext } from './types';

export function validateTestType(value: string): TestType {
  if (!Object.values(TestType).includes(value as TestType)) {
    console.error(
      `Invalid test type. Valid options: ${Object.values(TestType).join(
        ', ',
      )}.`,
    );
    process.exit(1);
  }
  return value as TestType;
}

export function validateBranchContext(
  value: string | undefined,
): BranchContext | undefined {
  if (!value) {
    return undefined;
  }

  const [baseBranch, workingBranch] = value.split('..');
  if (!baseBranch || !workingBranch) {
    console.error(
      'Invalid branch context. Please provide a context in the format <baseBranch>..<workingBranch>',
    );
    process.exit(1);
  }
  return {
    baseBranch,
    workingBranch,
  };
}
