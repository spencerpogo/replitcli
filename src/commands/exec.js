const { createCommand } = require("commander");
const { getRepl } = require("../utils");
const { getClient } = require("../connect");

const main = async (program, args, { repl }) => {
  const replId = await getRepl(repl);
  const conn = await getClient(replId);

  const chan = conn.channel("exec");
  chan.on("command", (data) => {
    if (data && data.output) {
      process.stdout.write(data.output);
    }
  });
  await chan.request({ exec: { args: [program, ...args] } });

  // Required cleanup code
  try {
    conn.close();
  } catch (e) {}
  process.exit(0);
};

module.exports = createCommand()
  .name("exec")
  .storeOptionsAsProperties(false)
  .passCommandToAction(false)
  .option("-r, --repl <repl>", "The repl to connect to")
  .arguments("<program> [arguments...]")
  .action(main);
