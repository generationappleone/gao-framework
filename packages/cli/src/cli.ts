#!/usr/bin/env bun
import { Command } from 'commander';

import { newCommand } from './commands/new.js';
import { generateCommand } from './commands/generate.js';
import { generateViewCommand } from './commands/generate-view.js';
import { devCommand } from './commands/dev.js';
import { buildCommand } from './commands/build.js';
import { migrateCommand } from './commands/migrate.js';
import { seedCommand } from './commands/seed.js';

export const program = new Command();

program
    .name('gao')
    .description('GAO Framework CLI - Rapid Development Tooling')
    .version('0.1.0');

program.addCommand(newCommand);
program.addCommand(generateCommand);
program.addCommand(generateViewCommand);
program.addCommand(devCommand);
program.addCommand(buildCommand);
program.addCommand(migrateCommand);
program.addCommand(seedCommand);

if (require.main === module) {
    program.parse(process.argv);
}
