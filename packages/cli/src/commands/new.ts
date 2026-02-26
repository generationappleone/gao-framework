import { Command } from 'commander';
import chalk from 'chalk';

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const newCommand = new Command('new')
    .description('Scaffold a new GAO Framework project')
    .argument('<project-name>', 'Name of the project to create')
    .action(async (projectName) => {
        console.log(chalk.bold.blue(`🚀 Creating new GAO project: ${projectName}`));

        const targetDir = path.resolve(process.cwd(), projectName);

        try {
            await fs.mkdir(targetDir, { recursive: true });
            await fs.mkdir(path.join(targetDir, 'src', 'controllers'), { recursive: true });
            await fs.mkdir(path.join(targetDir, 'src', 'models'), { recursive: true });
            await fs.mkdir(path.join(targetDir, 'src', 'services'), { recursive: true });

            const templateDir = path.resolve(__dirname, '../../src/templates/project');

            const filesToProcess = [
                { src: 'package.json.hbs', dest: 'package.json' },
                { src: 'gao.config.ts.hbs', dest: 'gao.config.ts' },
                { src: 'tsconfig.json.hbs', dest: 'tsconfig.json' },
                { src: 'main.ts.hbs', dest: 'src/main.ts' },
            ];

            for (const file of filesToProcess) {
                const sourcePath = path.join(templateDir, file.src);
                const destPath = path.join(targetDir, file.dest);

                const templateContent = await fs.readFile(sourcePath, 'utf-8');
                const compiledTemplate = Handlebars.compile(templateContent);
                const result = compiledTemplate({ projectName });

                await fs.writeFile(destPath, result, 'utf-8');
            }

            console.log(chalk.green(`\n✅ Project ${projectName} created successfully.`));
            console.log(chalk.cyan(`\nNext steps:`));
            console.log(`  cd ${projectName}`);
            console.log(`  bun install  # or pnpm install`);
            console.log(`  gao dev      # start development server\n`);

        } catch (error) {
            console.error(chalk.red(`❌ Error creating project:`), error);
            process.exit(1);
        }
    });
