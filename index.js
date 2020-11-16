#!/usr/bin/env node
const os = require("os");
const path = require("path");
const fs = require("fs");

const { createCommand } = require("commander");

const { version } = require("./package");
const addCommands = require("./src/commands");
const { enableDebug, debug } = require("./src/logs");
const { setConfigFile } = require("./src/config");

// fail fast, avoid warnings
process.on("unhandledRejection", (err) => {
  throw err;
});

function isDir(path) {
  try {
    let result = fs.statSync(path);
    return result.isDirectory();
  } catch (e) {
    if (e && e.code === "ENOENT") return false; // not found
    throw e;
  }
}

const configFilename = ".replitcli.json";
const dotConfigPath = path.join(os.homedir(), ".config");

// if the .config directory exists, use it, otherwise default to the user's home directory
const defaultConfig = isDir(dotConfigPath)
  ? path.join(dotConfigPath, configFilename)
  : path.join(os.homedir(), configFilename);

const program = createCommand();
program
  .storeOptionsAsProperties(false)
  .passCommandToAction(false)
  .version(version || "0.1.0")
  .option("--debug", "Enable debug logging")
  .option(
    "-c, --config <filename>",
    "Location of configuration file",
    defaultConfig
  )
  .action(() => program.help()); // show help and exit if no subcommand provided

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

addCommands(program);

async function main() {
  await program.parseAsync(process.argv);
}

main();
