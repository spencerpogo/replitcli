const { EventEmitter } = require("events");

const listenForResize = (cb) => {
  if (!process.stdout.isTTY) {
    process.stderr.write(
      "[WARN] STDOUT is not a TTY. The feature you are using should tell repl.it the " +
        "terminal size. The terminal size will be able to be set through a global " +
        "option soon™"
    );
    return;
  }
  const onResize = () => cb(process.stdout.rows, process.stdout.columns);
  process.stdout.on("resize", onResize);
  onResize();
};

const listenToStdin = () => {
  class KeyEmitter extends EventEmitter {}
  const emitter = new KeyEmitter();

  const { stdin } = process;
  if (stdin.isTTY) {
    stdin.setRawMode(true);
  }
  stdin.resume();
  stdin.setEncoding("utf8");

  const specialKeys = {
    "\x03": "^C",
    "\x04": "^D",
  };

  let currentLine = "";
  stdin.on("data", (data) => {
    if (!data) return;
    data
      .toString()
      .split("")
      .forEach((key) => {
        // ctrl-c ( end of text )
        if (specialKeys[key]) {
          emitter.emit(specialKeys[key]);
          return;
        }

        // end of line
        if (key == "\r") {
          emitter.emit("line", currentLine);
          currentLine = "";
        } else {
          currentLine += key;
        }
        emitter.emit("key", key);
      });
  });

  return emitter;
};

module.exports = {
  listenForResize,
  listenToStdin,
};
