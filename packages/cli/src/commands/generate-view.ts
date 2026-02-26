import { Command } from 'commander';
import chalk from 'chalk';

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateViewCommand = new Command('generate-view')
    .description('Generate view template component')
    .argument('<name>', 'Name of the view component')
    .option('-l, --layout <layoutName>', 'Specifies a layout for the view')
    .action(async (name, options) => {
        console.log(chalk.bold.blue(`🚀 Generating view: ${name}`));

        const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
        const camelName = name.charAt(0).toLowerCase() + name.slice(1);

        const destDir = path.join(process.cwd(), 'src', 'views');
        const sourcePath = path.resolve(__dirname, '../../src/templates/view.ts.hbs');
        const destPath = path.join(destDir, `${camelName}.view.ts`);

        let layoutUse = '';
        if (options.layout) {
            console.log(chalk.cyan(`   Using layout: ${options.layout}`));
            layoutUse = options.layout;
        }

        try {
            await fs.mkdir(destDir, { recursive: true });

            const templateContent = await fs.readFile(sourcePath, 'utf-8');
            const compiledTemplate = Handlebars.compile(templateContent);

            const result = compiledTemplate({
                name: pascalName,
                componentPath: `views/${camelName}`,
                layout: layoutUse
            });

            await fs.writeFile(destPath, result, 'utf-8');

            console.log(chalk.green(`✅ View ${pascalName} generated successfully at ${destPath}`));
        } catch (error) {
            console.error(chalk.red(`❌ Error generating view:`), error);
            process.exit(1);
        }
    });
