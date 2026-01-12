/**
 * Zwift Log Parser
 * Main entry point for parsing Zwift activity log files
 */

import * as fs from "fs";
import * as path from "path";
import * as asciichart from "asciichart";
import chalk from "chalk";

type FPSEntry = {
  timestamp: string;
  fps: number;
  value1: number;
  value2: number;
  value3: number;
};

type LogMetadata = {
  logTime?: string;
  gameVersion?: string;
  device?: string;
  launcherVersion?: string;
  config?: string;
  gpu?: string;
  gpuDriver?: string;
  cpu?: string;
  ram?: string;
  resolution?: string;
  shadowResolution?: string;
  graphicsProfile?: string;
};

type RouteSession = {
  name: string;
  world?: string;
  startTime?: string;
  endTime?: string;
  distanceCm?: number;
  elevationCm?: number;
};

type WorldSession = {
  name: string;
  activities: RouteSession[];
};

class ZwiftLogParser {
  parseMetadata(content: string): LogMetadata {
    const metadata: LogMetadata = {};

    // Extract Log Time
    const logTimeMatch = content.match(/\[[\d:]+\] Log Time: ([\d:]+ [\d-]+)/);
    if (logTimeMatch) {
      metadata.logTime = logTimeMatch[1];
    }

    // Extract Game Version
    const gameVersionMatch = content.match(/\[[\d:]+\] Game Version: ([^\n]+)/);
    if (gameVersionMatch) {
      metadata.gameVersion = gameVersionMatch[1].trim();
    }

    // Extract Config
    const configMatch = content.match(/\[[\d:]+\] Config:\s+([^\n]+)/);
    if (configMatch) {
      metadata.config = configMatch[1].trim();
    }

    // Extract Device
    const deviceMatch = content.match(/\[[\d:]+\] Device:\s+([^\n]+)/);
    if (deviceMatch) {
      metadata.device = deviceMatch[1].trim();
    }

    // Extract Launcher Version
    const launcherMatch = content.match(
      /\[[\d:]+\] Launcher Version\s*:\s*([^\n]+)/
    );
    if (launcherMatch) {
      metadata.launcherVersion = launcherMatch[1].trim();
    }

    // Extract GPU info
    const gpuMatch = content.match(/Graphics Renderer: ([^\n]+)/);
    if (gpuMatch) {
      metadata.gpu = gpuMatch[1].trim();
    }

    // Extract GPU Driver version
    const driverMatch = content.match(/GL_version = ([^\n]+)/);
    if (driverMatch) {
      metadata.gpuDriver = driverMatch[1].trim();
    }

    // Extract CPU
    const cpuMatch = content.match(/CPU: ([^\n]+)/);
    if (cpuMatch) {
      metadata.cpu = cpuMatch[1].trim();
    }

    // Extract RAM
    const ramMatch = content.match(/RAM: ([^\n]+)/);
    if (ramMatch) {
      metadata.ram = ramMatch[1].trim();
    }

    // Extract Resolution
    const resolutionMatch = content.match(
      /Changed resolution to (\d+) x (\d+)/
    );
    if (resolutionMatch) {
      metadata.resolution = `${resolutionMatch[1]}x${resolutionMatch[2]}`;
    }

    // Extract Shadow Resolution
    const shadowResMatch = content.match(
      /Changed shadow resolution to (\d+) x (\d+)/
    );
    if (shadowResMatch) {
      metadata.shadowResolution = `${shadowResMatch[1]}x${shadowResMatch[2]}`;
    }

    // Extract Graphics Profile
    const profileMatch = content.match(/Using (\w+) graphics profile/);
    if (profileMatch) {
      metadata.graphicsProfile = profileMatch[1].trim();
    }

    return metadata;
  }

  parseFPSLines(content: string): FPSEntry[] {
    const entries: FPSEntry[] = [];
    const fpsRegex =
      /^\[(\d{2}:\d{2}:\d{2})\] FPS ([\d.]+), (-?\d+), (-?\d+), (-?\d+)/gm;

    let match;
    while ((match = fpsRegex.exec(content)) !== null) {
      entries.push({
        timestamp: match[1],
        fps: parseFloat(match[2]),
        value1: parseInt(match[3], 10),
        value2: parseInt(match[4], 10),
        value3: parseInt(match[5], 10),
      });
    }

    return entries;
  }

  parseFile(filePath: string): {
    metadata: LogMetadata;
    fps: FPSEntry[];
    routes: RouteSession[];
  } {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return {
        metadata: this.parseMetadata(content),
        fps: this.parseFPSLines(content),
        routes: this.parseRouteSessions(content),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to read file: ${error.message}`);
      }
      throw error;
    }
  }

  readFile(filePath: string): string {
    return fs.readFileSync(filePath, "utf-8");
  }

  downsampleData(data: number[], targetWidth: number): number[] {
    if (data.length <= targetWidth) {
      return data;
    }

    const bucketSize = Math.ceil(data.length / targetWidth);
    const downsampled: number[] = [];

    for (let i = 0; i < data.length; i += bucketSize) {
      const bucket = data.slice(i, i + bucketSize);
      const avg = bucket.reduce((a, b) => a + b, 0) / bucket.length;
      downsampled.push(avg);
    }

    return downsampled;
  }

  parseRouteSessions(content: string): RouteSession[] {
    // First, build a map of world IDs to world names
    const worldIdMap = new Map<number, string>();

    // Find all world load events and corresponding SaveActivity world names
    const worldLoadRegex =
      /GameLoadLevel: Creating New Activity \{worldId: (\d+)\}/g;
    const saveActivityWorldRegex =
      /SaveActivity calling.*with \{name: Zwift - ([^,\n]+)/g;

    const worldLoads: Array<{ index: number; worldId: number }> = [];
    let match;
    while ((match = worldLoadRegex.exec(content)) !== null) {
      worldLoads.push({ index: match.index, worldId: parseInt(match[1], 10) });
    }

    // For each world load, find the next SaveActivity to get the world name
    const saveActivities: Array<{ index: number; worldName: string }> = [];
    while ((match = saveActivityWorldRegex.exec(content)) !== null) {
      saveActivities.push({ index: match.index, worldName: match[1].trim() });
    }

    // Map world IDs to names by finding the closest SaveActivity after each world load
    for (const worldLoad of worldLoads) {
      const nextSaveActivity = saveActivities.find(
        (sa) => sa.index > worldLoad.index
      );
      if (nextSaveActivity) {
        // Extract just the world name (last part after "in")
        const worldMatch = nextSaveActivity.worldName.match(/in\s+(.+)$/);
        if (worldMatch) {
          worldIdMap.set(worldLoad.worldId, worldMatch[1].trim());
        } else {
          // Sometimes it's just the world name
          worldIdMap.set(worldLoad.worldId, nextSaveActivity.worldName);
        }
      }
    }

    // Track which world is active at each point by parsing world loads in order
    let currentWorldId = 0;
    const worldIdChanges: Array<{ index: number; worldId: number }> = [];
    worldLoadRegex.lastIndex = 0;
    while ((match = worldLoadRegex.exec(content)) !== null) {
      currentWorldId = parseInt(match[1], 10);
      worldIdChanges.push({ index: match.index, worldId: currentWorldId });
    }

    // Helper to find which world is active at a given index
    const getWorldAtIndex = (index: number): string => {
      for (let i = worldIdChanges.length - 1; i >= 0; i--) {
        if (worldIdChanges[i].index <= index) {
          return worldIdMap.get(worldIdChanges[i].worldId) || "Unknown";
        }
      }
      return "Unknown";
    };

    // Find activity sessions using event starts and event finishes
    const activityRegex =
      /\[([\d:]+)\].*Starting (?:Group Event|Free Ride|Ride)\..*/g;
    const activities: Array<{ time: string; index: number; endTime?: string }> =
      [];

    while ((match = activityRegex.exec(content)) !== null) {
      activities.push({ time: match[1], index: match.index });
    }

    // Find event finish times for group events
    const eventFinishRegex = /\[([\d:]+)\].*EVENT FINISHED/g;
    const eventFinishes: Array<{ time: string; index: number }> = [];
    while ((match = eventFinishRegex.exec(content)) !== null) {
      eventFinishes.push({ time: match[1], index: match.index });
    }

    // Extract route names for each activity session
    const sessions: RouteSession[] = [];

    for (let i = 0; i < activities.length; i++) {
      const actStart = activities[i].index;
      const actEnd =
        i + 1 < activities.length ? activities[i + 1].index : content.length;
      const activitySection = content.substring(actStart, actEnd);

      // Check if this is a group event
      const isGroupEvent = activitySection.includes("Starting Group Event");

      // Find the main route for this activity (last route change or name from event)
      const routeMatches = Array.from(
        activitySection.matchAll(/Setting Route:\s+(.+?)(?:\n|$)/g)
      );
      const eventNameMatch = activitySection.match(
        /Player received a paddock slot.*?"([^"]+)" group event/
      );

      let routeName = "Unknown";
      if (routeMatches.length > 0) {
        // Use the last route change in this activity
        routeName = routeMatches[routeMatches.length - 1][1].trim();
      } else if (eventNameMatch) {
        routeName = eventNameMatch[1].trim();
      }

      // Find the LAST route stats in this activity section
      const allStatsMatches = Array.from(
        activitySection.matchAll(
          /Route stats: ([\d.]+)cm long with [\d.]+cm leadin and ([\d.]+)cm ascent/g
        )
      );

      const session: RouteSession = {
        name: routeName,
        world: getWorldAtIndex(actStart),
        startTime: activities[i].time,
      };

      if (allStatsMatches.length > 0) {
        // Use the last stats found in this activity
        const lastStatsMatch = allStatsMatches[allStatsMatches.length - 1];
        session.distanceCm = parseFloat(lastStatsMatch[1]);
        session.elevationCm = parseFloat(lastStatsMatch[2]);
      }

      // Find the end time
      if (isGroupEvent) {
        // For group events, use the event finish time if available
        const eventFinish = eventFinishes.find((ef, idx) => {
          // Check if this finish comes after the activity start
          return (
            ef.index > actStart &&
            (idx === eventFinishes.length - 1 ||
              eventFinishes[idx + 1].index > actEnd)
          );
        });
        if (eventFinish) {
          session.endTime = eventFinish.time;
        } else if (i + 1 < activities.length) {
          // Use the timestamp from the next activity
          session.endTime = activities[i + 1].time;
        }
      } else {
        // For free rides, use next activity start or last FPS entry
        if (i + 1 < activities.length) {
          // Use the timestamp from the next activity
          session.endTime = activities[i + 1].time;
        } else {
          // Use last FPS entry for the last activity
          const lastFpsMatch = content.match(/\[([\d:]+)\] FPS [\d.]+/gm);
          if (lastFpsMatch) {
            const lastTime =
              lastFpsMatch[lastFpsMatch.length - 1].match(/\[([\d:]+)\]/);
            if (lastTime) {
              session.endTime = lastTime[1];
            }
          }
        }
      }

      sessions.push(session);
    }

    // Filter out sessions with zero duration or very short durations (less than 1 minute)
    // But keep all sessions for now - we'll filter based on data availability later
    const filteredSessions = sessions;

    return filteredSessions;
  }

  calculateDurationSeconds(
    startTime: string | undefined,
    endTime: string | undefined
  ): number {
    if (!startTime || !endTime) return 0;

    const [startHour, startMin, startSec] = startTime.split(":").map(Number);
    const [endHour, endMin, endSec] = endTime.split(":").map(Number);

    const startTotalSecs = startHour * 3600 + startMin * 60 + startSec;
    const endTotalSecs = endHour * 3600 + endMin * 60 + endSec;

    let durationSecs = endTotalSecs - startTotalSecs;
    if (durationSecs < 0) {
      durationSecs += 24 * 3600; // Handle day boundary
    }
    return durationSecs;
  }

  formatDistance(cm: number): string {
    const meters = cm / 100;
    const km = meters / 1000;
    if (km >= 1) {
      return `${km.toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
  }

  formatElevation(cm: number): string {
    const meters = cm / 100;
    return `${meters.toFixed(0)} m`;
  }

  calculateDuration(
    startTime: string | undefined,
    endTime: string | undefined
  ): string {
    if (!startTime || !endTime) return "unknown";

    const [startHour, startMin, startSec] = startTime.split(":").map(Number);
    const [endHour, endMin, endSec] = endTime.split(":").map(Number);

    const startTotalSecs = startHour * 3600 + startMin * 60 + startSec;
    const endTotalSecs = endHour * 3600 + endMin * 60 + endSec;

    let diffSecs = endTotalSecs - startTotalSecs;
    if (diffSecs < 0) {
      // Handle day boundary
      diffSecs += 24 * 3600;
    }

    const hours = Math.floor(diffSecs / 3600);
    const minutes = Math.floor((diffSecs % 3600) / 60);
    const seconds = diffSecs % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  timeToSeconds(timeStr: string): number {
    const [hour, min, sec] = timeStr.split(":").map(Number);
    return hour * 3600 + min * 60 + sec;
  }

  isTimeInRange(
    timestamp: string,
    startTime: string | undefined,
    endTime: string | undefined
  ): boolean {
    if (!startTime || !endTime) return false;

    const tsSeconds = this.timeToSeconds(timestamp);
    const startSeconds = this.timeToSeconds(startTime);
    const endSeconds = this.timeToSeconds(endTime);

    // Handle day boundary - if start > end, activity spans midnight
    if (startSeconds > endSeconds) {
      return tsSeconds >= startSeconds || tsSeconds <= endSeconds;
    }
    return tsSeconds >= startSeconds && tsSeconds <= endSeconds;
  }

  calculateFpsStats(fpsValues: number[]): {
    avg: number;
    min: number;
    max: number;
  } {
    if (fpsValues.length === 0) {
      return { avg: 0, min: 0, max: 0 };
    }
    const avg = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
    const min = Math.min(...fpsValues);
    const max = Math.max(...fpsValues);
    return { avg, min, max };
  }

  parseWorlds(content: string, routes: RouteSession[]): WorldSession[] {
    // Find all SaveActivity messages - these contain the complete activity info
    const saveActivityRegex =
      /\[[\d:]+\].*SaveActivity calling.*with \{name: Zwift - ([^\n,]+)/g;
    const worldActivities = new Map<
      string,
      { activityNames: string[]; firstIndex: number }
    >();
    const worldOrder: string[] = [];

    let match;
    while ((match = saveActivityRegex.exec(content)) !== null) {
      let activityName = match[1].trim();

      // Extract world from activity name
      const worldMatch = activityName.match(/in (.+)$/);
      const worldName = worldMatch ? worldMatch[1].trim() : "Unknown World";

      // Only track activities that are actual completed rides (not in-progress saves)
      // Completed activities have routes or event names with specific patterns
      // Must have " in " (world indicator) and be a meaningful activity (not just "Makuri Islands")
      if (activityName.includes(" in ") && activityName !== worldName) {
        if (!worldActivities.has(worldName)) {
          worldActivities.set(worldName, {
            activityNames: [],
            firstIndex: match.index,
          });
          worldOrder.push(worldName);
        }

        const worldData = worldActivities.get(worldName)!;
        // Only add if not already present (avoid duplicates from multiple saves)
        if (!worldData.activityNames.includes(activityName)) {
          worldData.activityNames.push(activityName);
        }
      }
    }

    // Build world sessions
    const worldSessions: WorldSession[] = worldOrder.map((worldName) => {
      const worldData = worldActivities.get(worldName)!;

      // Find activities for this world
      const worldRoutes: RouteSession[] = [];
      const addedRoutes = new Set<string>(); // Track unique routes we've added

      for (const activityName of worldData.activityNames) {
        // Extract route name from activity (prefer "on RouteName in World" pattern)
        let routeName = "Unknown";
        const routeMatch = activityName.match(/\s+on\s+(.+?)\s+in\s+/);
        if (routeMatch) {
          routeName = routeMatch[1].trim();
        } else {
          // For simple route names like "Chasing the Sun in Makuri Islands"
          // Extract just the route part (before " in")
          const simpleRouteMatch = activityName.match(/^(.+?)\s+in\s+/);
          if (simpleRouteMatch) {
            routeName = simpleRouteMatch[1].trim();
          } else {
            // Fallback to event name extraction
            const eventMatch = activityName.match(/^([^:]+)(?::|\s|$)/);
            if (eventMatch) {
              routeName = eventMatch[1].trim();
            }
          }
        }

        // Try to find route stats for this activity
        let distanceCm: number | undefined;
        let elevationCm: number | undefined;
        let startTime: string | undefined;
        let endTime: string | undefined;

        // First try to find in parsed routes by name or activity
        const matchedRoute = routes.find(
          (r) =>
            r.name.toLowerCase() === routeName.toLowerCase() ||
            activityName.includes(r.name)
        );

        if (matchedRoute) {
          distanceCm = matchedRoute.distanceCm;
          elevationCm = matchedRoute.elevationCm;
          startTime = matchedRoute.startTime;
          endTime = matchedRoute.endTime;
        } else {
          // Try to find stats in the log for this specific route
          const escapedRouteName = routeName.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );
          const routeStatsMatch = content.match(
            new RegExp(
              `Setting Route:\\s+${escapedRouteName}.*?Route stats: ([\\d.]+)cm long.*?and ([\\d.]+)cm ascent`,
              "s"
            )
          );
          if (routeStatsMatch) {
            distanceCm = parseFloat(routeStatsMatch[1]);
            elevationCm = parseFloat(routeStatsMatch[2]);
          }
        }

        // Add to world routes (don't deduplicate - each activity is separate)
        worldRoutes.push({
          name: routeName,
          distanceCm,
          elevationCm,
          startTime,
          endTime,
        });
      }

      return {
        name: worldName,
        activities: worldRoutes,
      };
    });

    return worldSessions;
  }
}

const main = async (): Promise<void> => {
  // Read version from package.json if available (work in ESM by using process.cwd())
  let appVersion = "dev";
  try {
    const pkgPath = path.resolve(process.cwd(), "package.json");
    const pkgContent = fs.readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(pkgContent);
    if (pkg && pkg.version) {
      appVersion = pkg.version;
    }
  } catch {
    // ignore errors and fall back to default
  }

  console.log(chalk.cyan.bold(`\n🚴 Zwift Log Parser v${appVersion}\n`));

  const parser = new ZwiftLogParser();

  const logPath = process.argv[2] || "./sample.log";

  try {
    const { metadata, fps: entries, routes } = parser.parseFile(logPath);

    // Parse worlds and group activities
    const worlds = parser.parseWorlds(parser.readFile(logPath), routes);

    // Display metadata
    console.log(
      chalk.cyan("═══════════════════════════════════════════════════")
    );
    console.log(chalk.cyan.bold("  Session Information"));
    console.log(
      chalk.cyan("═══════════════════════════════════════════════════")
    );
    if (metadata.logTime)
      console.log(
        chalk.white(`  Log Date/Time:  ${chalk.cyan(metadata.logTime)}`)
      );
    if (metadata.gameVersion)
      console.log(
        chalk.white(`  Game Version:   ${chalk.cyan(metadata.gameVersion)}`)
      );
    if (metadata.device)
      console.log(
        chalk.white(`  Device:         ${chalk.cyan(metadata.device)}`)
      );
    if (metadata.config)
      console.log(
        chalk.white(`  Config:         ${chalk.cyan(metadata.config)}`)
      );
    if (metadata.launcherVersion)
      console.log(
        chalk.white(`  Launcher:       ${chalk.cyan(metadata.launcherVersion)}`)
      );
    // console.log(
    //   chalk.cyan("═══════════════════════════════════════════════════")
    // );

    console.log(
      chalk.green("\n═══════════════════════════════════════════════════")
    );
    console.log(chalk.green.bold("  System Information"));
    console.log(
      chalk.green("═══════════════════════════════════════════════════")
    );
    if (metadata.gpu)
      console.log(
        chalk.white(`  GPU:            ${chalk.yellow(metadata.gpu)}`)
      );
    if (metadata.gpuDriver)
      console.log(
        chalk.white(`  Driver:         ${chalk.yellow(metadata.gpuDriver)}`)
      );
    if (metadata.cpu)
      console.log(
        chalk.white(`  CPU:            ${chalk.yellow(metadata.cpu)}`)
      );
    if (metadata.ram)
      console.log(
        chalk.white(`  RAM:            ${chalk.yellow(metadata.ram)}`)
      );
    if (metadata.resolution)
      console.log(
        chalk.white(`  Resolution:     ${chalk.yellow(metadata.resolution)}`)
      );
    if (metadata.shadowResolution)
      console.log(
        chalk.white(
          `  Shadow Res:     ${chalk.yellow(metadata.shadowResolution)}`
        )
      );
    if (metadata.graphicsProfile)
      console.log(
        chalk.white(
          `  Graphics:       ${chalk.yellow(metadata.graphicsProfile)}`
        )
      );
    // console.log(
    //   chalk.green("═══════════════════════════════════════════════════")
    // );

    // Display worlds with activities
    if (worlds.length > 0) {
      console.log(
        chalk.yellow("\n═══════════════════════════════════════════════════")
      );
      console.log(chalk.yellow.bold("  Worlds"));
      console.log(
        chalk.yellow("═══════════════════════════════════════════════════")
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
      //   console.log(
      //     chalk.yellow("═══════════════════════════════════════════════════")
      //   );
    }

    if (entries.length === 0) {
      console.log(chalk.red("No FPS entries found in log file."));
      process.exit(0);
    }

    // Extract FPS values for graphing
    const fpsValues = entries.map((e) => e.fps);

    // Calculate FPS statistics
    const fpsStats = parser.calculateFpsStats(fpsValues);
    const avgFps = fpsStats.avg;
    const minFps = fpsStats.min;
    const maxFps = fpsStats.max;

    // console.log(chalk.magenta(`\nFound ${entries.length} FPS entries\n`));

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
        chalk.cyan("\n═══════════════════════════════════════════════════")
      );
      console.log(chalk.cyan.bold("  Overall FPS Over Time"));
      console.log(
        chalk.cyan("═══════════════════════════════════════════════════")
      );
      console.log(chalk.cyan(chart));

      console.log(
        chalk.magenta("\n═══════════════════════════════════════════════════")
      );
      console.log(chalk.magenta.bold("  Overall FPS Statistics"));
      console.log(
        chalk.magenta("═══════════════════════════════════════════════════")
      );
      console.log(
        chalk.white(`  Average:      ${chalk.green(avgFps.toFixed(2))}`)
      );
      console.log(
        chalk.white(`  Min:          ${chalk.red(minFps.toFixed(2))}`)
      );
      console.log(
        chalk.white(`  Max:          ${chalk.green(maxFps.toFixed(2))}`)
      );
      console.log("");
    }

    // Display per-world FPS statistics and graphs
    if (worlds.length > 0) {
      console.log(
        chalk.blue("\n═══════════════════════════════════════════════════")
      );
      console.log(chalk.blue.bold("  FPS Analysis"));
      console.log(
        chalk.blue("═══════════════════════════════════════════════════\n")
      );

      // Build a map of which world was active at each timestamp in the log
      const worldIdChanges: Array<{ index: number; worldId: number }> = [];
      const worldLoadRegex =
        /GameLoadLevel: Creating New Activity \{worldId: (\d+)\}/g;
      let match;
      while ((match = worldLoadRegex.exec(parser.readFile(logPath))) !== null) {
        worldIdChanges.push({
          index: match.index,
          worldId: parseInt(match[1], 10),
        });
      }

      // Build world ID to name map
      const worldIdMap = new Map<number, string>();
      worlds.forEach((world) => {
        // Find the world ID by searching backwards through the log for this world name
        const content = parser.readFile(logPath);
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
      const content = parser.readFile(logPath);
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
            const lineStart = content.lastIndexOf("\n", fpsEntry.index) + 1;
            const lineEnd = content.indexOf("\n", fpsEntry.index);
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
              worldStats.avg.toFixed(2)
            )} | Min: ${chalk.red(
              worldStats.min.toFixed(2)
            )} | Max: ${chalk.green(worldStats.max.toFixed(2))}`
          )
        );
        console.log("");
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red.bold("Error: ") + chalk.red(error.message));
    }
    process.exit(1);
  }
};

main();
