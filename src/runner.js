module.exports = {
  run(task) {
    task()
      .then(() => process.exit())
      .catch(err => console.log(err.stack));

    function stop() {
      process.exit(1);
    }

    // Register handlers for manually stopping the script,
    // allowing graceful shutdowns / teardowns
    process.on('SIGTERM', stop.bind(this));
    process.on('SIGINT', stop.bind(this));
  },
};
