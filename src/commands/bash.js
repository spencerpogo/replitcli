const { createCommand } = require("commander");

const { listenForResize, listenToStdin } = require("../tty");
const { getClient } = require("../connect");
const utils = require("../utils");
const chalk = require("chalk");

const main = async (passedRepl) => {
  // TODO: -c that runs a single command and exits when it detects the prompt
  const replId = await utils.getRepl(passedRepl);
  const client = await getClient(replId);
  const chan = await client.channel("shell");

  process.stdout.write(
    chalk.gray("TIP: Press ^C or type 'exit' to quit at any time\n")
  );

  const quit = () => {
    keys.removeAllListeners();
    process.stdin.pause();
    utils.cleanup();
  };

  // Listen for keys
  const keys = listenToStdin();

  keys.on("^C", () => {
    console.log("^C");
    quit();
  });

  keys.on("line", (line) => {
    if (line === "exit") {
      console.log("");
      quit();
    }
  });

  keys.on("key", (k) => chan.send({ input: k }));

  listenForResize((rows, cols) => chan.send({ resizeTerm: { rows, cols } }));
  chan.onCommand((data) => {
    if (data.output) {
      process.stdout.write(data.output);
    }
  });
};

module.exports = createCommand()
  .storeOptionsAsProperties(false)
  .name("bash")
  .description("Open a bash shell in the repl")
  .arguments("[repl]")
  .action(main);
