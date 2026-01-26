import { Command } from 'commander';
import { newCommand } from './commands/new.js';
import { exportCommand } from './commands/export.js';

const program = new Command();

program
  .name('notater')
  .description('CLI for Notater Music Ecosystem')
  .version('0.1.0');

program.addCommand(newCommand);
program.addCommand(exportCommand);

program.parse(process.argv);
