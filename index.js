#!/usr/bin/env node
const os = require("os");
const path = require("path");
const fs = require("fs");

const { createCommand } = require("commander");

const { version } = require("./package");
const addCommands = require("./src/commands");
const { enableDebug, fatal } = require("./src/logs");
const { setConfigFile, getConfigFile } = require("./src/config");
const { setShowConnecting } = require("./src/connect");

// fail fast, avoid warnings
process.on("unhandledRejection", (err) => {
  throw err;
});

function tryStat(path) {
  try {
    let result = fs.statSync(path);
    return result;
  } catch (e) {
    if (e && e.code === "ENOENT") return null; // not found
    throw e;
  }
}

const HOME = os.homedir();
// possible config directories, highest precedence first
const configDirectories = [
  process.env.REPLIT_CONFIG_DIR,
  process.env.XDG_CONFIG_HOME,
  path.join(HOME, ".config"),
  HOME,
];

const getConfigDir = () => {
  for (const dir of configDirectories) {
    // Only check directory, because file might not exist yet
    const stat = dir && tryStat(dir);
    if (stat && stat.isDirectory()) {
      return dir;
    }
  }
  fatal(
    "Can't find a valid config directory. Set REPLIT_CONFIG_DIR environment " +
      "variable to specify a valid directory to store config file in."
  );
};

const configFilename = ".replitcli.json";

const defaultConfig = path.join(getConfigDir(), configFilename);

const program = createCommand()
  .storeOptionsAsProperties(false)
  .version(version || "0.1.0")
  .option("--debug", "Enable debug logging")
  .option(
    "-c, --config <filename>",
    "Location of configuration file",
    defaultConfig
  )
  .option("-hc, --hide-connecting", "Don't show 'Crosis connecting' message")
  .action(() => program.help()); // show help and exit if no subcommand provided

module.exports.program = program;

program.on("option:debug", () => {
  const debugOption = program.opts().debug;
  if (debugOption) {
    enableDebug();
  }
});

// option:config is only fired when a value is provided,
//  default must be set manually
setConfigFile(defaultConfig);

program.on("option:config", () => {
  setConfigFile(program.opts().config);
});

program.on("option:hide-connecting", () => setShowConnecting(false));

addCommands(program);

async function main() {
  await program.parseAsync(process.argv);
}

if (require.main === module) {
  main();
}
