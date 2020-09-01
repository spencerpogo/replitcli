const { createCommand } = require("commander");
const open = require("open");

const logs = require("../logs");
const config = require("../config");
const { getRepl } = require("../utils");
const { getClient } = require("../connect");

async function main(passedRepl) {
  const replId = getRepl();
  const conn = await getClient(replId);
}

module.exports = createCommand()
  .storeOptionsAsProperties(false)
  .passCommandToAction(false)
  .name("auth")
  .arguments("[repl]")
  .action(main);
