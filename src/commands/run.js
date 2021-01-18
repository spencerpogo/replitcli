const { createCommand } = require("commander");

const logs = require("../logs");
const { getRepl } = require("../utils");
const { getClient } = require("../connect");

async function main(passedRepl, { stop, restart }) {
  const shouldStop = stop || restart;
  const shouldRun = !stop || restart;

  if (!shouldStop && !shouldRun) {
    // Don't do anything
    return;
  }

  const replId = await getRepl(passedRepl);
  const conn = await getClient(replId);

  // TODO: some way to determine whether to use interp2/run2
  const chan = await conn.channel("shellrun2");

  chan.onCommand((data) => {
    if (data.output) {
      const out = data.output.replace(//gm, "❯");
      process.stdout.write(out);
    }
  });

  if (shouldStop) {
    logs.debug("Stopping...");
    chan.send({ clear: {} });
    await new Promise((resolve) => {
      const res = () => {
        chan.off("command", onCommand);
        resolve();
      };

      chan.onCommand((data) => {
        if (data && data.state === 0) {
          logs.debug("Resolving");
          res();
        }
      });
    });
  }
  if (shouldRun) {
    logs.debug("Running...");
    await conn.run();
  }
}

module.exports = createCommand()
  .storeOptionsAsProperties(false)
  .name("run")
  .description("Runs, stops, or restarts the repl.")
  .option("--stop", "Stops the repl")
  .option("--restart", "Restarts the repl")
  .arguments("[repl]")
  .action(main);
