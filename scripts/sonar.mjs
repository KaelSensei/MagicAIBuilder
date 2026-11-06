import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = resolve(fileURLToPath(new URL(".", import.meta.url)));
const tokenFile = resolve(scriptDirectory, "../.env.sonar");

function readSonarToken() {
  if (process.env.SONAR_TOKEN) return process.env.SONAR_TOKEN;

  try {
    const line = readFileSync(tokenFile, "utf8")
      .split(/\r?\n/)
      .find((entry) => entry.trim().startsWith("SONAR_TOKEN="));
    const value = line?.split("=", 2)[1]?.trim().replace(/^['"]|['"]$/g, "");
    return value && value !== "your_token_here" ? value : undefined;
  } catch {
    return undefined;
  }
}

function runPnpm(args, environment = process.env) {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], {
    env: environment,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(`Failed to start pnpm: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) process.exit(result.status ?? 1);
}

const sonarToken = readSonarToken();

if (!sonarToken) {
  console.error(".env.sonar is missing SONAR_TOKEN.");
  process.exit(1);
}

console.log("Regenerating coverage report...");
runPnpm(["test:coverage"]);

console.log("Running SonarCloud analysis...");
runPnpm(
  ["--package=sonarqube-scanner@4.4.0", "dlx", "sonar-scanner", "-Dsonar.host.url=https://sonarcloud.io"],
  { ...process.env, SONAR_TOKEN: sonarToken }
);

console.log("Done - check https://sonarcloud.io/project/overview?id=KaelSensei_MagicAIBuilder");
