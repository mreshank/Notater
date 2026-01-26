import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';

export const newCommand = new Command('new')
  .description('Create a new Notater project')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'What is the name of your project?',
        default: 'my-beat'
      },
      {
        type: 'list',
        name: 'genre',
        message: 'Select a vibe:',
        choices: ['Lofi', 'Trap', 'House', 'Techno', 'Blank']
      }
    ]);

    const projectDir = path.join(process.cwd(), answers.projectName);
    
    // Create directory
    await fs.mkdir(projectDir, { recursive: true });

    // Create project.json
    const projectConfig = {
      name: answers.projectName,
      version: '1.0.0',
      genre: answers.genre, 
      bpm: answers.genre === 'Trap' ? 140 : 120, // Simple logic
      patterns: []
    };

    await fs.writeFile(
      path.join(projectDir, 'project.json'), 
      JSON.stringify(projectConfig, null, 2)
    );

    console.log(`\n✨ Project ${answers.projectName} created successfully!`);
    console.log(`   cd ${answers.projectName}`);
    console.log(`   notater play (coming soon)\n`);
  });
