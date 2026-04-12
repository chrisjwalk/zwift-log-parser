import { ZwiftLogParser, pickFile } from '@zwift-log-parser/core';
import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { render } from 'ink';
import React from 'react';
import { App } from './App.js';

const main = async (): Promise<void> => {
  let appVersion = 'dev';
  try {
    const pkgPath = path.resolve(import.meta.dirname, '../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    if (pkg?.version) appVersion = pkg.version;
  } catch {
    // fall back to 'dev'
  }

  const program = new Command();

  program
    .name('zwift-log-parser')
    .description('Parse and analyze Zwift activity log files with FPS metrics and route information')
    .version(appVersion)
    .argument('[logfile]', 'path to Zwift log file to parse')
    .option('--no-fps', 'skip FPS analysis and graphs')
    .option('--no-routes', 'skip route/activity information')
    .option('--no-metadata', 'skip session and system metadata')
    .option('--json', 'output results as JSON instead of formatted text')
    .showHelpAfterError(true)
    .configureOutput({
      outputError: (str, write) => {
        write(chalk.red.bold('\n✗ ') + chalk.red(str.trim()) + '\n');
      },
    });

  program.parse();

  const options = program.opts<{
    fps: boolean;
    routes: boolean;
    metadata: boolean;
    json: boolean;
  }>();
  let logfile = program.args[0];

  if (!logfile) {
    const selectedFile = await pickFile({
      message: 'Select a Zwift log file',
      fileExtensions: ['.log', '.txt'],
      defaultPath: './logs/Log.txt',
    });

    if (!selectedFile) {
      console.log(chalk.yellow('\nOperation cancelled.'));
      process.exit(0);
    }

    logfile = selectedFile;
  }

  if (!fs.existsSync(logfile)) {
    console.error(chalk.red.bold('✗ Error: ') + chalk.red(`File not found: ${logfile}`));
    console.error(chalk.yellow('\n💡 Tip: Please provide a valid path to a Zwift log file.'));
    console.error(chalk.dim('Example: zwift-log-parser /path/to/Log.txt\n'));
    process.exit(1);
  }

  // JSON output — no Ink needed
  if (options.json) {
    const parser = new ZwiftLogParser();
    const { metadata, fps: entries, routes } = parser.parseFile(logfile);
    const worlds = parser.parseWorlds(parser.readFile(logfile), routes);

    const processedRoutes = routes.map(({ distanceCm: _dc, elevationCm: _ec, ...rest }) => ({
      ...rest,
      durationSeconds: parser.calculateDurationSeconds(rest.startTime, rest.endTime),
      duration: parser.calculateDuration(rest.startTime, rest.endTime),
    }));

    const processedWorlds = worlds.map((world) => ({
      name: world.name,
      activities: world.activities.map(
        ({ distanceCm: _dc, elevationCm: _ec, ...rest }) => ({
          ...rest,
          durationSeconds: parser.calculateDurationSeconds(rest.startTime, rest.endTime),
          duration: parser.calculateDuration(rest.startTime, rest.endTime),
        }),
      ),
    }));

    console.log(
      JSON.stringify(
        {
          metadata: options.metadata ? metadata : undefined,
          routes: options.routes ? processedRoutes : undefined,
          worlds: options.routes ? processedWorlds : undefined,
          fps: options.fps
            ? {
                entries: entries.length,
                stats: parser.calculateFpsStats(entries.map((e) => e.fps)),
              }
            : undefined,
        },
        null,
        2,
      ),
    );
    return;
  }

  const { waitUntilExit } = render(
    React.createElement(App, {
      logfile,
      options: { fps: options.fps, routes: options.routes, metadata: options.metadata },
      version: appVersion,
    }),
  );

  await waitUntilExit();
};

main().catch((err) => {
  console.error(chalk.red.bold('Error: ') + chalk.red(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
