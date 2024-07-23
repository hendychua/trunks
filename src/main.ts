import { Command } from 'commander';

enum TestType {
  postman = 'postman',
  unit = 'unit',
}

type BranchContext = {
  baseBranch: string;
  workingBranch: string;
};

function validateTestType(value: string): TestType {
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

function validateBranchContext(
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

type TestGenerationInput = {
  inputDir: string;
  outputDir?: string;
  type: TestType;
  branchContext?: BranchContext;
};

function handleGenerateTests(options: TestGenerationInput) {
  console.log(options);
}

const program = new Command();

program
  .name('trunks')
  .description('A CLI tool to generate tests')
  .version('0.0.1');

program
  .command('gen')
  .description('Generate tests')
  .requiredOption(
    '-i, --input-dir <input>',
    'The codebase to generate tests for',
  )
  .option(
    '-o, --output-dir <output>',
    '(Optional) The output directory to write the tests. Will also be used as part of context to send to the LLM. If not present, will default to the input directory.',
  )
  .requiredOption(
    '-t, --type <type>',
    `The type of tests to generate. Valid options: ${Object.values(
      TestType,
    ).join(', ')}.`,
    validateTestType,
  )
  .option(
    '-b, --branch-context <branchContext>',
    '(Optional) The working branch context to send to the LLM',
    validateBranchContext,
  )
  .action((options) => handleGenerateTests(options));

program.parse();
