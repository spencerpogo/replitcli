const { createCommand } = require("commander");
const chalk = require("chalk");

const config = require("../config");
const { parseRepl } = require("../utils");
const { findLocalDir } = require("../config");
const logs = require("../logs");

async function setLocal(passedRepl, dir) {
  const replId = await parseRepl(passedRepl);

  let { localDirs } = await config.getConfig();
  localDirs = { ...localDirs, [dir]: replId };
  config.update({ localDirs });

  console.log(
    chalk.green(
      `The repl for ${dir} has been set in config file ${config.getConfigFile()}`
    )
  );
}

async function main(passedRepl, { dir }) {
  if (passedRepl) {
    await setLocal(passedRepl, dir);
  } else {
    const repl = await findLocalDir();
    if (repl) {
      console.log(`The repl for this directory is:
${repl}

URLs for the repl:
https://repl.it/replid/${repl}
https://${repl}.id.repl.co/__repl

Hosted URL:
https://${repl}.id.repl.co/`);
    } else {
      logs.fatal("No repl set for this directory.");
    }
  }
}

module.exports = createCommand()
  .storeOptionsAsProperties(false)
  .name("local")
  .description("Set the local repl for the a directory")
  .option(
    "-d, --dir <directory>",
    "The directory to set for. Defaults to the current directory",
    process.cwd()
  )
  .arguments("[repl]")
  .action(main);
