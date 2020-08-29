const os = require("os");
const path = require("path");

const { createCommand } = require("commander");

const { version } = require("./package");
const addCommands = require("./src/commands");
const { enableDebug, debug } = require("./src/logs");
const { setConfigFile } = require("./src/config")

// fail fast, avoid warnings
process.on("unhandledRejection", (err) => {
  throw err;
});

const defaultConfig = path.join(os.homedir(), ".replitcli.json");

const program = createCommand();
program
  .storeOptionsAsProperties(false)
  .passCommandToAction(false)
  .version(version || "0.1.0")
  .option("-d, --debug", "Enable debug logging")
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
