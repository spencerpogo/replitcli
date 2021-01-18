const fs = require("fs").promises;
const { createReadStream } = require("fs");
const path = require("path");

const { createCommand } = require("commander");
const getStream = require("get-stream");

const logs = require("../logs");
const utils = require("../utils");
const { getClient } = require("../connect");
const chalk = require("chalk");

const PREFIX = "repl:";

const realLogStatus = (line) => process.stderr.write(line + "\n");
const noOp = () => {};

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

const performCP = async (conn, src, dest, logStatus) => {
  if (src.isRepl && dest.isRepl) {
    // Use cp to copy in-repl.
    logStatus("Executing cp in repl...");
    const chan = await conn.channel("exec");
    await chan.request({ exec: { args: ["cp", src.path, dest.path] } });
  } else if (!src.isRepl && dest.isRepl) {
    let toCopy = [{ srcPath: src.path, destPath: dest.path }];
    let isTopLevel = true;

    while (toCopy.length) {
      const { srcPath, destPath } = toCopy.shift();
      // Stat the provided source to determine whether it is a file or directory.
      // If it is -, make a fake stat result that acts as a file
      const stat =
        srcPath === "-"
          ? {
              isDirectory: () => false,
              isFile: () => true,
            }
          : await fs.stat(srcPath);
      // If its a directory, push all of its files into the queue
      if (stat.isDirectory()) {
        const files = await fs.readdir(srcPath);
        // Repl.it uses linux, so use path.posix to join
        // Push the files into the queue.
        toCopy = toCopy.concat(
          files.map((f) => ({
            srcPath: path.join(srcPath, f),
            destPath: path.posix.join(destPath, f),
          }))
        );
      } else if (!stat.isFile) {
        // Only warn if the user-provided file is not copyable. If we found it while
        //  traversing recursively, silently ignore
        if (isTopLevel) {
          logs.fatal("Cannot copy a path that is neither a file nor directory");
        }
        logs.debug(
          `Ignoring non-directory non-file ${JSON.stringify(srcPath)}`
        );
      } else {
        // Read a local file and copy it into the repl.
        logStatus(
          `Reading ${
            srcPath === "-" ? "stdin" : "local file " + JSON.stringify(srcPath)
          }...`
        );
        const srcBuffer = await getStream.buffer(
          srcPath === "-" ? process.stdin : createReadStream(srcPath)
        );
        const cleanDest = cleanReplPath(destPath);
        logStatus(
          `Writing ${srcBuffer.length} bytes to remote file ${JSON.stringify(
            cleanDest
          )}...`
        );
        const filesChan = await conn.channel("files");
        await filesChan.request({
          write: {
            path: cleanDest,
            content: srcBuffer.toString("base64"),
          },
        });
      }
      isTopLevel = false;
    }
  } else if (src.isRepl && !dest.isRepl) {
    // Read from the repl
    logStatus(`Reading remote file ${JSON.stringify(src.path)}...`);
    const filesChan = await conn.channel("files");
    const { file } = await filesChan.request({
      read: { path: cleanReplPath(src.path) },
    });
    if (!file) {
      logs.fatal(`Remote file ${JSON.stringify(src.path)} doesn't exist`);
    }
    logStatus(
      `Writing ${file.content.length} bytes to ${
        dest.path === "-" ? "stdout" : "local path " + JSON.stringify(dest.path)
      }...`
    );
    if (dest.path === "-") {
      process.stdout.write(file.content);
    } else {
      await fs.writeFile(dest.path, file.content);
    }
  } else {
    logs.fatal("Unknown configuration");
  }
};

async function main(passedSources, { repl, quiet }) {
  if (passedSources.length < 2) {
    logs.fatal("Need at least one source and one destination");
  }

  // Parse src / dest
  const passedDest = passedSources.pop();
  const sources = passedSources.map((src) => parsePathArg(src));
  const dest = parsePathArg(passedDest);

  // Check for error *before* connecting
  if (!sources.some((src) => src.isRepl) && !dest.isRepl) {
    logs.fatal(
      "You specified all local paths. " +
        "Use " +
        chalk.green("repl:") +
        " before a path to indicate it is on the repl. "
    );
  }

  const replId = await utils.getRepl(repl);
  const conn = await getClient(replId);

  const logStatus = quiet ? noOp : realLogStatus;

  try {
    // If theres only one source, its a direct copy
    if (sources.length == 1) {
      await performCP(conn, sources[0], dest, logStatus);
    } else {
      // Otherwise, dest should be a directory as multiple files will be written into it
      for (const src of sources) {
        await performCP(
          conn,
          src,
          {
            ...dest,
            path: path.posix.join(dest.path, src.path),
          },
          logStatus
        );
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    if (dest.isRepl) {
      logStatus("Persisting file snapshot...");
      await conn.snapshot();
    }
    logStatus("Disconnecting...");
    utils.cleanup();
  }
}

module.exports = createCommand()
  .storeOptionsAsProperties(false)
  .name("cp")
  .description(
    "Copies a file from a repl to your computer or vice versa. " +
      "Prepend a path with " +
      chalk.green("repl:") +
      " to indicate it is on the repl."
  )
  .option("--repl <repl>", "The repl to copy to")
  .option("-q, --quiet", "Don't print status messages to stderr")
  .arguments("[files...]")
  .action(main);
