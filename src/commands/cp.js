const fs = require("fs").promises;

const { createCommand } = require("commander");

const logs = require("../logs");
const { getRepl } = require("../utils");
const { getClient } = require("../connect");
const chalk = require("chalk");

const PREFIX = "repl:";

function parsePathArg(arg) {
  if (arg.startsWith(PREFIX)) {
    return {
      path: arg.slice(PREFIX.length),
      isRepl: true,
    };
  } else {
    return {
      path: arg,
      isRepl: false,
    };
  }
}

function cleanReplPath(p) {
  // From http://protodoc.turbio.repl.co/services#gcsfiles
  // > Paths should ALWAYS be relative without any leading ./ or /. Paths should NEVER
  // > have a trailing / even when refering to a directory.To refer to a file or
  // > directory inside the project use the path with no leading or trailing characters
  // > (e.g. "dir/myfile.txt" or "mydir").To refer to the working directory (aka
  // > projects root) use "".

  return p
    .replace(/^\.\//g, "") // Strip leading "./"
    .replace(/\/$/g, ""); // Strip trailing "/"
}

async function main(passedSrc, passedDest, passedRepl) {
  // Parse src / dest
  const src = parsePathArg(passedSrc);
  const dest = parsePathArg(passedDest);

  // Check for error *before* connecting
  if (!src.isRepl && !dest.isRepl) {
    logs.fatal(
      "You specified two local paths. " +
        "Use " +
        chalk.green("repl:") +
        " before a path to indicate it is on the repl. "
    );
  }

  const replId = await getRepl(passedRepl);
  const conn = await getClient(replId);

  try {
    if (src.isRepl && dest.isRepl) {
      // Use cp to copy in-repl.
      logs.debug("Executing cp in repl...");
      const chan = conn.channel("exec");
      await chan.request({ exec: { args: ["cp", src.path, dest.path] } });
      logs.debug("Done");
    } else if (!src.isRepl && dest.isRepl) {
      // Read a local file and copy it into the repl.
      logs.debug(`Reading local file ${JSON.stringify(src.path)}...`);
      // TODO: Stat and recursive copy
      const srcBuffer = await fs.readFile(src.path);
      const cleanDest = cleanReplPath(dest.path);
      logs.debug(`Writing remote file ${JSON.stringify(cleanDest)}...`);
      await conn.channel("files").request({
        write: {
          path: cleanDest,
          content: srcBuffer.toString("base64"),
        },
      });
    } else if (src.isRepl && !dest.isRepl) {
      // Read from the repl
      logs.debug("Reading remote file...");
      const { file } = await conn.channel("files").request({
        read: { path: cleanReplPath(src.path) },
      });
      logs.debug("Writing local file");
      await fs.writeFile(dest.path, file.content);
    } else {
      logs.fatal("Unknown configuration");
    }
  } catch (e) {
    console.error(e);
  } finally {
    try {
      client.close();
    } catch (e) {}
    // For some reason, process hangs if we don't include this.
    process.exit(0);
  }
}

module.exports = createCommand()
  .storeOptionsAsProperties(false)
  .passCommandToAction(false)
  .name("cp")
  .description(
    "Copies a file from a repl to your computer or vice versa. " +
      "Prepend a path with " +
      chalk.green("repl:") +
      " to indicate it is on the repl."
  )
  .arguments("<src> <dest> [repl]")
  .action(main);
