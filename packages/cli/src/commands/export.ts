import { Command } from 'commander';
import { patternToMidi, Pattern, Track, Instrument, Step } from '@notater/core';
import fs from 'fs/promises';
import path from 'path';

/**
 * Helper to create a demo pattern for testing export
 */
function createDemoPattern(): Pattern {
  const instrument: Instrument = {
    id: 'demo-synth',
    name: 'Demo Synth',
    type: 'synth',
    source: 'basic',
    volume: 0,
    pan: 0,
    muted: false,
    solo: false,
    color: '#d946ef',
    effects: []
  };

  const steps: Record<number, Step> = {};
  // Create a simple kick pattern: 0, 4, 8, 12
  [0, 4, 8, 12].forEach((index, i) => {
    steps[index] = {
      id: `step-${i}`,
      index,
      type: 'on',
      velocity: 0.8,
      duration: 0.25,
      microTiming: 0
    };
  });

  const track: Track = {
    id: 'demo-track',
    instrument,
    steps,
    length: 16
  };

  return {
    id: 'demo-pattern',
    name: 'Demo Pattern',
    tracks: [track],
    bars: 1
  };
}

export const exportCommand = new Command('export')
  .description('Export a pattern to MIDI')
  .argument('<output>', 'Output file path (e.g., output.mid)')
  .option('-d, --demo', 'Export a demo pattern instead of loading from project')
  .action(async (output: string, options: { demo?: boolean }) => {
    try {
      let pattern: Pattern;

      if (options.demo) {
        console.log('📝 Creating demo pattern...');
        pattern = createDemoPattern();
      } else {
        // Try to load from project.json in current directory
        const projectPath = path.join(process.cwd(), 'project.json');
        try {
          const projectData = await fs.readFile(projectPath, 'utf-8');
          const project = JSON.parse(projectData);
          
          if (!project.patterns || project.patterns.length === 0) {
            console.log('⚠️  No patterns found in project. Use --demo to export a demo pattern.');
            return;
          }
          
          pattern = project.patterns[0];
          console.log(`📁 Loaded pattern "${pattern.name}" from project.json`);
        } catch {
          console.log('⚠️  No project.json found in current directory.');
          console.log('   Use --demo to export a demo pattern, or run from a project directory.');
          return;
        }
      }

      console.log('🎵 Converting to MIDI...');
      const midiData = patternToMidi(pattern);
      
      const outputPath = output.endsWith('.mid') ? output : `${output}.mid`;
      await fs.writeFile(outputPath, midiData);
      
      console.log(`✅ Exported to ${outputPath} (${midiData.length} bytes)`);
    } catch (error) {
      console.error('❌ Export failed:', error);
      process.exit(1);
    }
  });
