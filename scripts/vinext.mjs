import { spawn } from "node:child_process";

const command = process.argv[2];
const allowed = new Set(["dev", "build", "start"]);

if (!allowed.has(command)) {
  console.error(`Unsupported Vinext command: ${command || "(missing)"}`);
  process.exit(1);
}

const env = {
  ...process.env,
  WRANGLER_LOG_PATH: ".wrangler/wrangler.log",
};

const isWindows = process.platform === "win32";
const bin = isWindows ? "npx" : "npx";
const child = spawn(bin, ["vinext", command], {
  stdio: "inherit",
  env,
  shell: isWindows,
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
