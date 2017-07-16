#!/usr/bin/env node

const runner = require('./src/runner');
const mlg = require('./src/main');

let argv = process.argv.slice(2);

const data = {
  resolutionX: Number.parseInt(argv[0], 10),
  resolutionY: Number.parseInt(argv[1], 10),
  graphs: [],
};

argv = argv.slice(2);

while (argv.length > 0) {
  data.graphs.push({
    filepath: argv[0],
    type: argv[1],
  });

  argv = argv.slice(2);
}

// if (require.main === module) {

runner.run(() => mlg(data));
