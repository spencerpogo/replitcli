const { createCommand } = require("commander");

const logs = require("../logs");
const config = require("../config");
const { getRepl } = require("../utils");

async function main(passedRepl) {
  const replId = await getRepl();
}

module.exports = createCommand()
  .storeOptionsAsProperties(false)
  .passCommandToAction(false)
  .name("local")
  .arguments("<repl>")
  .action(main);
