const readline = require('readline');
const fs = require('fs');
const moment = require('moment');
const Graph = require('./Graph');
const Value = require('./Value');

moment.defaultFormat = 'YYYY-MM-DDTHH:mm:ss';

function openReadline(filepath, onLine, onClose) {
  const lineReader = readline.createInterface({
    input: fs.createReadStream(filepath),
  });

  lineReader.on('line', onLine);
  lineReader.on('close', onClose);
}

function populateExtraData(graph) {
  return new Promise((resolve) => {
    openReadline(
      graph.filepath,
      (line) => {
        const fields = line.split(/\s+/);
        graph.evaluatePoint(fields);
      },
      () => resolve(graph)
    );
  });
}

function populateGraph(graph) {
  return new Promise((resolve) => {
    openReadline(
      graph.filepath,
      (line) => {
        const fields = line.split(/\s+/);
        graph.addPoint(fields);
      },
      () => {
        graph.finalizeData();
        resolve(graph);
      }
    );
  });
}

function outputData(data) {
  if (data.graphs.length === 0) return;

  const typeX = data.graphs[0].valueTypes[0];
  const stepX = data.graphs[0].steps[0];

  for (let x = 0; x < data.resolutionX; x += 1) {
    const valueX = data.minX + (stepX * x);
    const labelX = Value.toString(valueX, typeX);

    let y = 0;
    let loopMore;

    do {
      process.stdout.write(labelX);

      loopMore = false;

      // eslint-disable-next-line no-loop-func
      data.graphs.forEach((graph) => {
        graph.dataSets.forEach((dataSet, i) => {
          if (dataSet[x].length <= y) {
            process.stdout.write(' ');
            return true;
          }

          if (dataSet[x].length > y + 1) {
            loopMore = true;
          }

          process.stdout.write(` ${
            Value.toString(dataSet[x][y], graph.valueTypes[i + 1])
          }`);

          return true;
        });
      });

      y += 1;

      process.stdout.write('\n');
    } while (loopMore);
  }
}

module.exports = function mlg(data) {
  if (data.graphs.length === 0) return Promise.resolve();

  data.graphs = data.graphs.map(graph =>
    new Graph(graph.filepath, graph.type)
  );

  const extraDataTasks = data.graphs.map(graph =>
    populateExtraData(graph)
  );

  return Promise.all(extraDataTasks)
    .then((graphs) => {
      data.minX = graphs[0].minPoint[0];
      data.maxX = graphs[0].maxPoint[0];

      graphs.forEach((graph) => {
        const minX = graph.minPoint[0];
        if (minX < data.minX) {
          data.minX = minX;
        }

        const maxX = graph.maxPoint[0];
        if (maxX > data.maxX) {
          data.maxX = maxX;
        }
      });

      graphs.forEach((graph) => {
        graph.minPoint[0] = data.minX;
        graph.maxPoint[0] = data.maxX;
        graph.calculateSteps(data.resolutionX, data.resolutionY);
      });

      const graphTasks = graphs.map(graph =>
        populateGraph(graph)
      );

      return Promise.all(graphTasks);
    })
    .then((graphs) => {
      data.graphs = graphs;
      return outputData(data);
    });
};
