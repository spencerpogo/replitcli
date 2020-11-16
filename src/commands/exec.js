const { createCommand } = require("commander");
const { getRepl } = require("../utils");
const { getClient } = require("../connect");
const dotenv = require("dotenv");

const main = async (program, args, { repl, env }) => {
  const replId = await getRepl(repl);
  const conn = await getClient(replId);

  const chan = conn.channel("exec");
  chan.on("command", (data) => {
    if (data && data.output) {
      process.stdout.write(data.output);
    }
  });
  await chan.request({ exec: { args: [program, ...args], env } });

  // Required cleanup code
  try {
    conn.close();
  } catch (e) {}
  process.exit(0);
};

// Parses value as a key=val environment variable, and returns the object environment
//  with key set to val. Throws an error through logs.fatal if invalid
const envParser = (value, environment) => {
  const parts = dotenv.parse(value);
  return { ...environment, ...parts };
};

module.exports = createCommand()
  .name("exec")
  .storeOptionsAsProperties(false)
  .passCommandToAction(false)
  .option("-r, --repl <repl>", "The repl to connect to")
  .option(
    "--env <values...>",
    "A list of environment variables to set, in the form key=val. will be merged " +
      "with any existing environment, and take precedence.",
    envParser,
    {}
  )
  .arguments("<program> [arguments...]")
  .action(main);
