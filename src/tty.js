const tty = require("tty");

const logs = require("./logs");

const listenForResize = (cb) => {
  if (!process.stdout.isTTY) {
    process.stderr.write(
      "[WARN] STDOUT is not a TTY. The feature you are using should tell repl.it the terminal size. The terminal size will be able to be set through a global option soon™"
    );
    return;
  }
  const onResize = () => cb(process.stdout.rows, process.stdout.columns);
  process.stdout.on("resize", onResize);
  onResize();
};

module.exports = {
  listenForResize,
};
