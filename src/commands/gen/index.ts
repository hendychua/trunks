import { CoreTool, generateText } from 'ai';
import { BranchContext, TestGenerationInput } from './types';
import * as fs from 'fs';
import * as path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import { buildTestGenerationPrompt } from './prompts';
import { getLanguageModel } from '../../llm';
import * as fastGlob from 'fast-glob';
import { countTokens } from '@anthropic-ai/tokenizer';
import { z } from 'zod';

type FileContent = {
  file: string;
  content: string;
};

const testGenerationFunction = {
  name: 'testGenerationFunction',
  description: 'Generate test cases',
  parameters: z
    .object({
      changes: z
        .array(
          z.object({
            file: z
              .string()
              .describe('The path of the file to be changed/removed/added.'),
            content: z
              .string()
              .describe('The content of the file to be changed/removed/added.'),
          }),
        )
        .describe('The list of changes to be made to the codebase.'),
    })
    .required({
      changes: true,
    }),
};

export async function handleGenerateTests(options: TestGenerationInput) {
  const llm = getLanguageModel(options.llmProvider);

  const ignoreFiles = new Set([
    'readme.md',
    'package.json',
    'tsconfig.build.json',
    'tsconfig.json',
    'yarn.lock',
  ]);

  const differentOutputDir = !!(
    options.outputDir && options.outputDir !== options.inputDir
  );

  const inputRelevantFileContents = (
    await getContextRelevantFiles(options.inputDir, ignoreFiles)
  ).map((file) => readFileContents(options.inputDir, file));
  const inputContent = inputRelevantFileContents
    .map(fileContentToPromptFormat)
    .join('\n');

  const outputRelevantFileContents = (
    differentOutputDir
      ? await getContextRelevantFiles(options.outputDir!, ignoreFiles)
      : undefined
  )?.map((file) => readFileContents(options.outputDir!, file));
  const outputContent = outputRelevantFileContents
    ?.map(fileContentToPromptFormat)
    ?.join('\n');

  const diffContent = options.branchContext
    ? await getDiffContent(options.inputDir, options.branchContext)
    : undefined;

  const inputCodebase = `<input_codebase>${inputContent}</input_codebase>`;
  const outputCodebase = outputContent
    ? `<output_codebase>${outputContent}</output_codebase>`
    : '';
  const diffPart = diffContent ? `<diff>${diffContent}</diff>` : '';

  const system = `${inputCodebase}\n${outputCodebase}\n${diffPart}`;

  const userMessage = buildTestGenerationPrompt({
    testType: options.type,
    differentOutputDir,
    changesInBranchOnly: options.branchContext ? true : false,
  });

  // const estimatedNumTokens = countTokens(`${system}\n${userMessage}`);
  // console.log(
  //   `Estimated number of tokens using Anthropic's tokenizer: ${estimatedNumTokens}`,
  // );

  const tools: Record<string, CoreTool> = {};
  tools[testGenerationFunction.name] = testGenerationFunction;

  const generateTextResult = await generateText({
    model: llm,
    system,
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
    tools,
    toolChoice: 'required',
  });

  const results:
    | {
        changes: {
          file: string;
          content: string;
        }[];
      }
    | undefined = generateTextResult.toolCalls.find(
    (tc) => tc.toolName === testGenerationFunction.name,
  )?.args;

  const outDir = options.outputDir || options.inputDir;
  writeFiles(outDir, results?.changes || []);
}

export function writeFiles(outDir: string, changes: FileContent[]) {
  for (const change of changes) {
    fs.writeFileSync(path.join(outDir, change.file), change.content, 'utf8');
  }
}

async function getDiffContent(
  dir: string,
  branchContext: BranchContext,
): Promise<string> {
  const git = simpleGit();
  git.cwd(dir);
  return await git.diff([
    `${branchContext.baseBranch}..${branchContext.workingBranch}`,
  ]);
}

/**
 * Ignores files that have been gitignored.
 */
function getContextRelevantFiles(
  dir: string,
  ignoreFiles: Set<string>,
): Promise<string[]> {
  const git = simpleGit();
  git.cwd(dir);
  return listRelevantFiles(git, dir, ignoreFiles);
}

function readFileContents(
  projectDir: string,
  fullFilePath: string,
): FileContent {
  const content = fs.readFileSync(fullFilePath, 'utf8');
  const relativePath = path.relative(projectDir, fullFilePath);
  return {
    file: relativePath,
    content,
  };
}

function fileContentToPromptFormat(fileContent: FileContent): string {
  return `<file>
  <relativePath>${fileContent.file}</relativePath>
  <content>${fileContent.content}</content>
</file>`;
}

async function listRelevantFiles(
  git: SimpleGit,
  dir: string,
  ignoreFiles: Set<string>,
): Promise<string[]> {
  const files: string[] = [];

  const globbedFiles = await fastGlob(path.join(dir, '**', '*'), {
    absolute: true,
    ignore: ['**/node_modules/**', '**/.git/**'],
  });

  for (const filePath of globbedFiles) {
    if (
      (await isFileIgnored(git, filePath)) ||
      ignoreFiles.has(path.basename(filePath).toLowerCase())
    ) {
      continue;
    }
    files.push(filePath);
  }
  return files;
}

async function isFileIgnored(git: SimpleGit, filePath: string) {
  const result = await git.checkIgnore(filePath);
  return result.length > 0;
}
