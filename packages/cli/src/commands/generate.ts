import { Command } from 'commander';
import chalk from 'chalk';

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateCommand = new Command('generate')
    .alias('g')
    .description('Generate scaffolding for controller, service, model, migration, or middleware')
    .argument('<type>', 'Type of file to generate (controller, service, model, middleware, migration)')
    .argument('<name>', 'Name of the generated class or file')
    .action(async (type, name) => {
        const validTypes = ['controller', 'service', 'model', 'middleware', 'migration'];

        if (!validTypes.includes(type)) {
            console.error(chalk.red(`❌ Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`));
            process.exit(1);
        }

        console.log(chalk.bold.blue(`🚀 Generating ${type}: ${name}`));

        const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
        const camelName = name.charAt(0).toLowerCase() + name.slice(1);

        let destDir = path.join(process.cwd(), 'src', `${type}s`);
        if (type === 'migration') destDir = path.join(process.cwd(), 'src', 'database', 'migrations');

        const sourcePath = path.resolve(__dirname, `../../src/templates/${type}.ts.hbs`);

        let outFileName = '';
        if (type === 'migration') {
            const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
            outFileName = `${timestamp}_${camelName}.ts`;
        } else {
            outFileName = `${camelName}.${type}.ts`;
        }

        const destPath = path.join(destDir, outFileName);

        try {
            await fs.mkdir(destDir, { recursive: true });

            const templateContent = await fs.readFile(sourcePath, 'utf-8');
            const compiledTemplate = Handlebars.compile(templateContent);

            const result = compiledTemplate({
                name: pascalName,
                routePath: `/${camelName}s`,
                tableName: `${camelName}s`
            });

            await fs.writeFile(destPath, result, 'utf-8');

            console.log(chalk.green(`✅ generated successfully: ${destPath}`));
        } catch (error) {
            console.error(chalk.red(`❌ Error generating ${type}:`), error);
            process.exit(1);
        }
    });
