const { createCommand } = require("commander");
const open = require("open");

const logs = require("../logs");
const config = require("../config");
const { parseRepl } = require("../utils");

async function main(passedRepl) {
  if (passedRepl) {
    repl = parseRepl(passedRepl);
  } else {
    repl = config.getLocalRepl();
  }
}

module.exports = createCommand()
  .storeOptionsAsProperties(false)
  .passCommandToAction(false)
  .name("auth")
  .arguments("[repl]")
  .action(main);
