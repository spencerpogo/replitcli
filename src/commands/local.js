const { createCommand } = require("commander");
const chalk = require("chalk");

const config = require("../config");
const { parseRepl } = require("../utils");

async function main(passedRepl, { dir }) {
  const replId = await parseRepl(passedRepl);

  let { localDirs } = config.getConfig();
  localDirs = { ...localDirs, [dir]: replId };
  config.update({ localDirs });

  console.log(
    chalk.green(
      `The repl for ${dir} has been set in config file ${config.getConfigFile()}`
    )
  );
}

module.exports = createCommand()
  .storeOptionsAsProperties(false)
  .passCommandToAction(false)
  .name("local")
  .description("Set the local repl for the a directory")
  .option(
    "-d, --dir <directory>",
    "The directory to set for. Defaults to the current directory",
    process.cwd()
  )
  .arguments("<repl>")
  .action(main);
