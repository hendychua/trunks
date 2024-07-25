import { Command } from 'commander';
import { handleGenerateTests } from './commands/gen';
import {
  validateTestType,
  validateBranchContext,
} from './commands/gen/helpers';
import { TestType } from './commands/gen/types';
import { LLMProvider, validateLLMProvider } from './llm';

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
  .requiredOption(
    '-l, --llm-provider <llmProvider>',
    `The LLM provider to use. Valid options: ${Object.values(LLMProvider).join(
      ', ',
    )}.`,
    validateLLMProvider,
  )
  .action(async (options) => await handleGenerateTests(options));

program.parse();
