module.exports = (program) => {
  ["auth"].forEach((cmd) => {
    program.addCommand(require("./" + cmd));
  });
};
