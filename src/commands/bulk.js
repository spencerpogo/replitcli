const { createCommand } = require("commander");
const connect = require("../connect");
const utils = require("../utils");
const logs = require("../logs");
const { program } = require("../../index");

function splitArgs(args) {
  let r = [];
  let current = [];

  args.forEach((i) => {
    if (i === "\\--") {
      current.push("--");
    } else if (i === "--") {
      r.push(current);
      current = [];
    } else {
      current.push(i);
    }
  });
  if (current.length) {
    r.push(current);
  }
  return r;
}

async function main() {
  const { rawArgs } = module.exports.parent;
  const args = rawArgs.slice(rawArgs.indexOf("bulk") + 1);
  const cmds = splitArgs(args);
  logs.debug(
    `Bulk: split ${JSON.stringify(args)} into ${JSON.stringify(cmds)}`
  );

  let cmdIndex = -1;
  const clients = new Map();

  const realGetClient = connect._getClient;
  connect._getClient = async (replId) => {
    if (clients.has(replId)) {
      return clients.get(replId);
    }
    const client = await realGetClient(replId);
    clients.set(replId, client);
    return client;
  };

  const nextCmd = (code) => {
    if (typeof code === "number" && code != 0) {
      process.exit(code);
    }

    cmdIndex++;
    if (cmdIndex >= cmds.length) {
      process.exit(code);
    }
    const cmd = cmds[cmdIndex];
    logs.debug(`[BULK] Running ${JSON.stringify(cmd)}`);
    const oldCmdIndex = cmdIndex;
    program.parseAsync(["node", "replit.js"].concat(cmd)).then(() => {
      // Don't skip commands
      if (cmdIndex === oldCmdIndex) nextCmd();
    });
  };

  utils.exit = (code) => nextCmd(code);
  utils.cleanup = () => nextCmd(0);
  program.exitOverride((err) => {
    throw err;
  });

  nextCmd();
}

module.exports = createCommand()
  .storeOptionsAsProperties(false)
  .name("bulk")
  .description("Run multiple commands without re-opening the connection")
  .arguments("<args...>")
  .allowUnknownOption()
  .action(main);
