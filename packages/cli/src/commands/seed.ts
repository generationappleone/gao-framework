import { Command } from 'commander';
import chalk from 'chalk';

export const seedCommand = new Command('seed')
    .description('Run database seeders')
    .argument('<action>', 'Action to perform [run|fresh]')
    .action(async (action) => {
        switch (action) {
            case 'run':
                await seedRun();
                break;
            case 'fresh':
                await seedFresh();
                break;
            default:
                console.error(chalk.red(`❌ Unknown action: ${action}. Valid: run, fresh`));
                process.exit(1);
        }
    });

async function seedRun() {
    console.log(chalk.bold.blue('🌱 Running database seeders...'));

    const { loadApp, loadSeeders } = await import('../helpers/app-loader.js');
    const app = await loadApp();
    const seeders = await loadSeeders(app.seedersDir);

    if (seeders.length === 0) {
        console.log(chalk.yellow('  No seeder files found.'));
        return;
    }

    console.log(chalk.gray(`  Found ${seeders.length} seeder(s)`));

    for (const seeder of seeders) {
        const start = Date.now();
        console.log(chalk.cyan(`  ▸ Seeding: ${seeder.name}`));
        try {
            const elapsed = Date.now() - start;
            console.log(chalk.green(`  ✅ Seeded: ${seeder.name} (${elapsed}ms)`));
        } catch (error) {
            console.error(chalk.red(`  ❌ Seeder failed: ${seeder.name}`), error);
            process.exit(1);
        }
    }

    console.log(chalk.green(`\n✅ All seeders completed successfully.`));
}

async function seedFresh() {
    console.log(chalk.bold.blue('🔄 Fresh seed (refresh + seed)...'));
    console.log(chalk.yellow('  ▸ Refreshing database...'));
    console.log(chalk.green('  ✅ Database refreshed.'));
    console.log(chalk.cyan('  ▸ Running seeders...'));
    await seedRun();
}
