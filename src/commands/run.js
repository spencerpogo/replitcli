const { createCommand } = require("commander");
const open = require("open");

const logs = require("../logs");
const { getRepl } = require("../utils");
const { getClient } = require("../connect");

async function main(passedRepl) {
  const replId = await getRepl(passedRepl);
  const conn = await getClient(replId);
  // TODO: some way to determine whether to use interp2/run2
  const chan = conn.channel("shellrun2");
  logs.debug("Running...");
  await conn.run();
  chan.on("command", (data) => {
    if (data.output) {
      process.stdout.write(data.output);
    }
  });
}

module.exports = createCommand()
  .storeOptionsAsProperties(false)
  .passCommandToAction(false)
  .name("run")
  .arguments("[repl]")
  .action(main);
