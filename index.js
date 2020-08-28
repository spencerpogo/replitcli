const { Command } = require("commander");
const { version } = require("./package");

const program = new Command();

program
  .version(version)
  .storeOptionsAsProperties(false)
  .passCommandToAction(false);

// If no subcommands are specified, print help and exit
program.action(() => program.help());

async function main() {
  await program.parseAsync(process.argv);
}

main();
