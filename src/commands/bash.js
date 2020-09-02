const { createCommand } = require("commander");

const { listenForResize, listenToStdin } = require("../tty");
const { getClient } = require("../connect");
const { getRepl } = require("../utils");

const main = async (repl) => {
  // TODO: -c that runs a single command and exits when it detects the prompt
  const replId = await getRepl();
  const client = await getClient(replId);
  const chan = client.channel("shell");

  const quit = () => {
    client.close();
    process.exit();
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
  chan.on("command", (data) => {
    if (data.output) {
      process.stdout.write(data.output);
    }
  });
};

module.exports = createCommand()
  .name("bash")
  .storeOptionsAsProperties(false)
  .passCommandToAction(false)
  .arguments("[repl]")
  .action(main);
