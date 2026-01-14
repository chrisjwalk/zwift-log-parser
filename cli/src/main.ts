import { ZwiftLogParser } from '@zwift-log-parser/core';
import * as asciichart from 'asciichart';
import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

const main = async (): Promise<void> => {
  // Read version from package.json if available (work in ESM by using process.cwd())
  let appVersion = 'dev';
  try {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    const pkgContent = fs.readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);
    if (pkg && pkg.version) {
      appVersion = pkg.version;
    }
  } catch {
    // ignore errors and fall back to default
  }

  const program = new Command();

  program
    .name('zwift-log-parser')
    .description('Parse and analyze Zwift activity log files with FPS metrics and route information')
    .version(appVersion)
    .argument('<logfile>', 'path to Zwift log file to parse')
    .option('--no-fps', 'skip FPS analysis and graphs')
    .option('--no-routes', 'skip route/activity information')
    .option('--no-metadata', 'skip session and system metadata')
    .option('--json', 'output results as JSON instead of formatted text')
    .showHelpAfterError(true)
    .configureOutput({
      outputError: (str, write) => {
        // Customize error output
        write(chalk.red.bold('\n✗ ') + chalk.red(str.trim()) + '\n');
      }
    })
    .action(async (logfile: string, options) => {
      const parser = new ZwiftLogParser();

      try {
        // Check if file exists
        if (!fs.existsSync(logfile)) {
          console.error(chalk.red.bold('✗ Error: ') + chalk.red(`File not found: ${logfile}`));
          console.error(chalk.yellow('\n💡 Tip: Please provide a valid path to a Zwift log file.'));
          console.error(chalk.dim('Example: zwift-log-parser /path/to/Log.txt\n'));
          process.exit(1);
        }

        const { metadata, fps: entries, routes } = parser.parseFile(logfile);

        // Parse worlds and group activities
        const worlds = parser.parseWorlds(parser.readFile(logfile), routes);

        // JSON output mode
        if (options.json) {
          // Process routes to add duration and remove incorrect properties
          const processedRoutes = routes.map(route => {
            const { distanceCm, elevationCm, ...rest } = route;
            return {
              ...rest,
              durationSeconds: parser.calculateDurationSeconds(route.startTime, route.endTime),
              duration: parser.calculateDuration(route.startTime, route.endTime)
            };
          });

          // Process worlds to add duration to activities
          const processedWorlds = worlds.map(world => ({
            name: world.name,
            activities: world.activities.map(activity => {
              const { distanceCm, elevationCm, ...rest } = activity;
              return {
                ...rest,
                durationSeconds: parser.calculateDurationSeconds(activity.startTime, activity.endTime),
                duration: parser.calculateDuration(activity.startTime, activity.endTime)
              };
            })
          }));

          const output = {
            metadata: options.metadata ? metadata : undefined,
            routes: options.routes ? processedRoutes : undefined,
            worlds: options.routes ? processedWorlds : undefined,
            fps: options.fps ? {
              entries: entries.length,
              stats: parser.calculateFpsStats(entries.map(e => e.fps))
            } : undefined
          };
          console.log(JSON.stringify(output, null, 2));
          return;
        }

        // Display banner for non-JSON output
        console.log(chalk.cyan.bold(`\n🚴 Zwift Log Parser v${appVersion}\n`));

        // Display metadata
        if (options.metadata) {
          console.log(
            chalk.cyan('═══════════════════════════════════════════════════'),
          );
          console.log(chalk.cyan.bold('  Session Information'));
          console.log(
            chalk.cyan('═══════════════════════════════════════════════════'),
          );
          if (metadata.logTime)
            console.log(
              chalk.white(`  Log Date/Time:  ${chalk.cyan(metadata.logTime)}`),
            );
          if (metadata.gameVersion)
            console.log(
              chalk.white(`  Game Version:   ${chalk.cyan(metadata.gameVersion)}`),
            );
          if (metadata.device)
            console.log(
              chalk.white(`  Device:         ${chalk.cyan(metadata.device)}`),
            );
          if (metadata.config)
            console.log(
              chalk.white(`  Config:         ${chalk.cyan(metadata.config)}`),
            );
          if (metadata.launcherVersion)
            console.log(
              chalk.white(
                `  Launcher:       ${chalk.cyan(metadata.launcherVersion)}`,
              ),
            );

          console.log(
            chalk.green('\n═══════════════════════════════════════════════════'),
          );
          console.log(chalk.green.bold('  System Information'));
          console.log(
            chalk.green('═══════════════════════════════════════════════════'),
          );
          if (metadata.gpu)
            console.log(
              chalk.white(`  GPU:            ${chalk.yellow(metadata.gpu)}`),
            );
          if (metadata.gpuDriver)
            console.log(
              chalk.white(`  Driver:         ${chalk.yellow(metadata.gpuDriver)}`),
            );
          if (metadata.cpu)
            console.log(
              chalk.white(`  CPU:            ${chalk.yellow(metadata.cpu)}`),
            );
          if (metadata.ram)
            console.log(
              chalk.white(`  RAM:            ${chalk.yellow(metadata.ram)}`),
            );
          if (metadata.resolution)
            console.log(
              chalk.white(`  Resolution:     ${chalk.yellow(metadata.resolution)}`),
            );
          if (metadata.shadowResolution)
            console.log(
              chalk.white(
                `  Shadow Res:     ${chalk.yellow(metadata.shadowResolution)}`,
              ),
            );
          if (metadata.graphicsProfile)
            console.log(
              chalk.white(
                `  Graphics:       ${chalk.yellow(metadata.graphicsProfile)}`,
              ),
            );
        }

        // Display worlds with activities
        if (options.routes && worlds.length > 0) {
          console.log(
            chalk.yellow('\n═══════════════════════════════════════════════════'),
          );
          console.log(chalk.yellow.bold('  Worlds'));
          console.log(
            chalk.yellow('═══════════════════════════════════════════════════'),
          );
          for (const world of worlds) {
            console.log(`  ${chalk.white(world.name)}`);

            // Show activities in this world (deduplicated by name)
            if (world.activities.length > 0) {
              const activityNames = new Set<string>();
              for (const activity of world.activities) {
                if (!activityNames.has(activity.name)) {
                  activityNames.add(activity.name);
                  console.log(chalk.white(`  • ${chalk.magenta(activity.name)}`));
                }
              }
            }
          }
        }

        if (!options.fps) {
          // Skip FPS analysis if disabled
          return;
        }

        if (entries.length === 0) {
          console.log(chalk.yellow('\nNo FPS entries found in log file.'));
          return;
        }

        // Extract FPS values for graphing
        const fpsValues = entries.map((e) => e.fps);

        // Calculate FPS statistics
        const fpsStats = parser.calculateFpsStats(fpsValues);
        const avgFps = fpsStats.avg;
        const minFps = fpsStats.min;
        const maxFps = fpsStats.max;

        // Get terminal width and downsample data to fit
        const terminalWidth = process.stdout.columns || 80;
        const graphWidth = Math.min(terminalWidth - 10, 120); // Leave margin for axis labels
        const downsampledFps = parser.downsampleData(fpsValues, graphWidth);

        // Generate ASCII chart with downsampled data
        const chart = asciichart.plot([downsampledFps], {
          height: 20,
          min: Math.floor(minFps) - 5,
          max: Math.ceil(maxFps) + 5,
        });

        // Only show overall FPS if there are multiple worlds
        if (worlds.length > 1) {
          console.log(
            chalk.cyan('\n═══════════════════════════════════════════════════'),
          );
          console.log(chalk.cyan.bold('  Overall FPS Over Time'));
          console.log(
            chalk.cyan('═══════════════════════════════════════════════════'),
          );
          console.log(chalk.cyan(chart));

          console.log(
            chalk.magenta('\n═══════════════════════════════════════════════════'),
          );
          console.log(chalk.magenta.bold('  Overall FPS Statistics'));
          console.log(
            chalk.magenta('═══════════════════════════════════════════════════'),
          );
          console.log(
            chalk.white(`  Average:      ${chalk.green(avgFps.toFixed(2))}`),
          );
          console.log(
            chalk.white(`  Min:          ${chalk.red(minFps.toFixed(2))}`),
          );
          console.log(
            chalk.white(`  Max:          ${chalk.green(maxFps.toFixed(2))}`),
          );
          console.log('');
        }

        // Display per-world FPS statistics and graphs
        if (worlds.length > 0) {
          console.log(
            chalk.blue('\n═══════════════════════════════════════════════════'),
          );
          console.log(chalk.blue.bold('  FPS Analysis'));
          console.log(
            chalk.blue('═══════════════════════════════════════════════════\n'),
          );

          // Build a map of which world was active at each timestamp in the log
          const worldIdChanges: Array<{ index: number; worldId: number }> = [];
          const worldLoadRegex =
            /GameLoadLevel: Creating New Activity \{worldId: (\d+)\}/g;
          let match;
          while ((match = worldLoadRegex.exec(parser.readFile(logfile))) !== null) {
            worldIdChanges.push({
              index: match.index,
              worldId: parseInt(match[1], 10),
            });
          }

          // Build world ID to name map
          const worldIdMap = new Map<number, string>();
          worlds.forEach((world) => {
            // Find the world ID by searching backwards through the log for this world name
            const content = parser.readFile(logfile);
            const worldPattern = `Zwift - ${world.name}`;
            const idx = content.lastIndexOf(worldPattern);
            if (idx !== -1) {
              // Find the most recent GameLoadLevel before this SaveActivity
              for (let i = worldIdChanges.length - 1; i >= 0; i--) {
                if (worldIdChanges[i].index < idx) {
                  worldIdMap.set(worldIdChanges[i].worldId, world.name);
                  break;
                }
              }
            }
          });

          // Helper to find which world is active at a given log index
          const getWorldAtIndex = (index: number): string | undefined => {
            for (let i = worldIdChanges.length - 1; i >= 0; i--) {
              if (worldIdChanges[i].index <= index) {
                return worldIdMap.get(worldIdChanges[i].worldId);
              }
            }
            return undefined;
          };

          // Group FPS entries by world based on their timestamp position in the log
          const worldFpsMap = new Map<string, number[]>();

          // Build a reverse index of FPS entries' positions in the log
          const content = parser.readFile(logfile);
          const fpsRegex = /\[([\d:.]+)\] FPS ([\d.]+)/g;
          const fpsPositions: Array<{ index: number; fps: number }> = [];
          while ((match = fpsRegex.exec(content)) !== null) {
            fpsPositions.push({ index: match.index, fps: parseFloat(match[2]) });
          }

          // Assign each FPS entry to a world
          for (const fpsEntry of fpsPositions) {
            const world = getWorldAtIndex(fpsEntry.index);
            if (world) {
              if (!worldFpsMap.has(world)) {
                worldFpsMap.set(world, []);
              }
              worldFpsMap.get(world)!.push(fpsEntry.fps);
            }
          }

          // Display per-world stats
          for (const world of worlds) {
            const worldFps = worldFpsMap.get(world.name);

            if (!worldFps || worldFps.length === 0) {
              console.log(chalk.yellow(`  ${world.name} - No FPS data available`));
              continue;
            }

            // Calculate world duration from FPS entry positions
            let worldStartTime: string | undefined;
            let worldEndTime: string | undefined;

            for (const fpsEntry of fpsPositions) {
              const world_at_index = getWorldAtIndex(fpsEntry.index);
              if (world_at_index === world.name) {
                // Extract timestamp from the log at this position
                const lineStart = content.lastIndexOf('\n', fpsEntry.index) + 1;
                const lineEnd = content.indexOf('\n', fpsEntry.index);
                const line = content.substring(lineStart, lineEnd);
                const timeMatch = line.match(/\[([\d:]+)\]/);
                if (timeMatch) {
                  if (!worldStartTime) {
                    worldStartTime = timeMatch[1];
                  }
                  worldEndTime = timeMatch[1];
                }
              }
            }

            const worldStats = parser.calculateFpsStats(worldFps);
            const downsampledWorldFps = parser.downsampleData(worldFps, graphWidth);
            const worldChart = asciichart.plot([downsampledWorldFps], {
              height: 15,
              min: Math.floor(worldStats.min) - 5,
              max: Math.ceil(worldStats.max) + 5,
            });

            console.log(chalk.blue.bold(`  📍 ${world.name}\n`));
            console.log(chalk.blue(worldChart));

            const duration = parser.calculateDuration(worldStartTime, worldEndTime);
            console.log(
              chalk.white(
                `\n  Time: ${chalk.cyan(duration)} | Average: ${chalk.green(
                  worldStats.avg.toFixed(2),
                )} | Min: ${chalk.red(
                  worldStats.min.toFixed(2),
                )} | Max: ${chalk.green(worldStats.max.toFixed(2))}`,
              ),
            );
            console.log('');
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red.bold('Error: ') + chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  program.parse();
};

main();
