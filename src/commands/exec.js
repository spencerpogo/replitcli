const { createCommand } = require("commander");
const { getRepl } = require("../utils");
const { getClient } = require("../connect");
const utils = require("../utils");
const logs = require("../logs");
const dotenv = require("dotenv");

const main = async (program, args, { repl, env, snapshot }) => {
  const replId = await getRepl(repl);
  const conn = await getClient(replId);

  const chan = await conn.channel("exec");
  chan.onCommand((data) => {
    if (data && data.output) {
      process.stdout.write(data.output);
    }
  });
  await chan.request({ exec: { args: [program, ...args], env } });

  if (snapshot) {
    await conn.snapshot();
  }
  utils.cleanup();
};

// Parses value as a key=val environment variable, and returns the object environment
//  with key set to val. Throws an error through logs.fatal if invalid
const envParser = (value, environment) => {
  const parts = dotenv.parse(value);
  return { ...environment, ...parts };
};

module.exports = createCommand()
  .storeOptionsAsProperties(false)
  .name("exec")
  .description("Execute a command in the repl and wait for it to finish")
  .option("-r, --repl <repl>", "The repl to connect to")
  .option(
    "--env <values...>",
    "A list of environment variables to set, in the form key=val. will be merged " +
      "with any existing environment, and take precedence.",
    envParser,
    {}
  )
  .option(
    "--snapshot",
    "Takes a files snapshot after running the command to preserve written files"
  )
  .arguments("<program> [arguments...]")
  .action(main);
