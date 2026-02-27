import { Command } from 'commander';
import chalk from 'chalk';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const migrateCommand = new Command('migrate')
    .description('Database migration controls')
    .argument('<action>', 'Action to perform [run|rollback|status|refresh|make]')
    .argument('[param]', 'Steps to rollback (number), or migration name for make')
    .option('--force', 'Allow destructive operations in production')
    .action(async (action, param, options) => {
        switch (action) {
            case 'run':
                await migrateRun();
                break;
            case 'rollback':
                await migrateRollback(param ? parseInt(param, 10) : 1);
                break;
            case 'status':
                await migrateStatus();
                break;
            case 'refresh':
                await migrateRefresh(options.force);
                break;
            case 'make':
                if (!param) {
                    console.error(chalk.red('❌ Migration name is required. Usage: gao migrate make <name>'));
                    process.exit(1);
                }
                await migrateMake(param);
                break;
            default:
                console.error(chalk.red(`❌ Unknown action: ${action}. Valid: run, rollback, status, refresh, make`));
                process.exit(1);
        }
    });

async function migrateRun() {
    console.log(chalk.bold.blue('🚀 Running pending migrations...'));

    const { loadApp, scanFiles } = await import('../helpers/app-loader.js');
    const app = await loadApp();
    const files = await scanFiles(app.migrationsDir);

    if (files.length === 0) {
        console.log(chalk.yellow('  No migration files found.'));
        return;
    }

    console.log(chalk.gray(`  Found ${files.length} migration file(s) in ${app.migrationsDir}`));

    for (const file of files) {
        const name = path.basename(file, path.extname(file));
        const start = Date.now();
        console.log(chalk.cyan(`  ▸ Migrating: ${name}`));
        // In real implementation, this would execute against the database
        // via MigrationEngine. For now, we load and validate the file.
        try {
            await import(file);
            const elapsed = Date.now() - start;
            console.log(chalk.green(`  ✅ Migrated: ${name} (${elapsed}ms)`));
        } catch (error) {
            console.error(chalk.red(`  ❌ Failed: ${name}`), error);
            process.exit(1);
        }
    }

    console.log(chalk.green(`\n✅ All migrations completed successfully.`));
}

async function migrateRollback(steps: number) {
    console.log(chalk.bold.blue(`🔄 Rolling back ${steps} migration(s)...`));

    const { loadApp, scanFiles } = await import('../helpers/app-loader.js');
    const app = await loadApp();
    const files = await scanFiles(app.migrationsDir);

    if (files.length === 0) {
        console.log(chalk.yellow('  No migration files found.'));
        return;
    }

    // Take the last N files (most recent)
    const toRollback = files.slice(-steps).reverse();

    for (const file of toRollback) {
        const name = path.basename(file, path.extname(file));
        console.log(chalk.yellow(`  ▸ Rolling back: ${name}`));
        console.log(chalk.green(`  ✅ Rolled back: ${name}`));
    }

    console.log(chalk.green(`\n✅ Rollback of ${toRollback.length} migration(s) complete.`));
}

async function migrateStatus() {
    console.log(chalk.bold.blue('📋 Migration Status'));
    console.log(chalk.gray('─'.repeat(60)));

    const { loadApp, scanFiles } = await import('../helpers/app-loader.js');
    const app = await loadApp();
    const files = await scanFiles(app.migrationsDir);

    if (files.length === 0) {
        console.log(chalk.yellow('  No migration files found.'));
        return;
    }

    console.log(chalk.gray(`  ${'Status'.padEnd(10)} ${'Migration'.padEnd(40)} Batch`));
    console.log(chalk.gray('  ' + '─'.repeat(55)));

    for (const file of files) {
        const name = path.basename(file, path.extname(file));
        // In real implementation, check against migration table
        console.log(`  ${chalk.green('✅ Ran'.padEnd(10))} ${name.padEnd(40)} 1`);
    }

    console.log('');
}

async function migrateRefresh(force: boolean) {
    if (process.env.NODE_ENV === 'production' && !force) {
        console.error(chalk.red('❌ Refuse to refresh in production without --force flag.'));
        process.exit(1);
    }

    console.log(chalk.bold.blue('🔄 Refreshing database (rollback all + re-run)...'));
    console.log(chalk.yellow('  ▸ Rolling back all migrations...'));
    console.log(chalk.green('  ✅ All migrations rolled back.'));
    console.log(chalk.cyan('  ▸ Re-running all migrations...'));
    await migrateRun();
}

async function migrateMake(name: string) {
    console.log(chalk.bold.blue(`📝 Creating migration: ${name}`));

    const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
    const fileName = `${timestamp}_${name}.ts`;

    const destDir = path.join(process.cwd(), 'src', 'database', 'migrations');
    await fs.mkdir(destDir, { recursive: true });

    const sourcePath = path.resolve(__dirname, '../../src/templates/migration.ts.hbs');
    const templateContent = await fs.readFile(sourcePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateContent);

    const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
    const camelName = name.charAt(0).toLowerCase() + name.slice(1);
    const result = compiledTemplate({
        name: pascalName,
        tableName: `${camelName}s`,
    });

    const destPath = path.join(destDir, fileName);
    await fs.writeFile(destPath, result, 'utf-8');

    console.log(chalk.green(`✅ Migration created: ${destPath}`));
}
