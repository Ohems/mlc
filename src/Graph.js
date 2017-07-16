const Value = require('./Value');

const TYPES = ['line_sum', 'line_avg', 'scatter'];

// Graph types
const LINE_SUM = 0;
const LINE_AVG = 1;
const SCATTER = 2;

class Graph {
  constructor(filepath, type) {
    this.filepath = filepath;
    this.graphType = type;

    this.dataSets = [];

    this.graphType = TYPES.indexOf(type);
    if (this.graphType < 0) {
      throw new Error(
        `Invalid graph type ${type}, must be one of [${TYPES.join(', ')}]!`
      );
    }
  }

  evaluatePoint(point) {
    if (point.length === 0 || point[0] === '') return;

    // Check if no Y value defined and default it to 1
    if (point.length < 2) {
      point.push(1);
    }

    if (this.dataSets.length === 0) {
      this.maxPoint = Array(point.length);
      this.minPoint = Array(point.length);

      this.steps = Array(point.length);

      this.valueTypes = point.map(value =>
        Value.findType(value)
      );

      this.dataSets = Array(point.length > 1 ? point.length - 1 : 0);
      if (this.dataSets.length === 0) {
        this.dataSets = Array(1);
      }
    } else if (this.maxPoint.length !== point.length) {
      throw new Error(
        `Invalid point, expected [${point.join(', ')}], to be of length ${this.maxPoint.length}!`
      );
    }

    point.forEach((value, i) => {
      const evaluatedValue = Value.parseValue(value, this.valueTypes[i]);

      if (!this.maxPoint[i] ||
          this.maxPoint[i] < evaluatedValue) {
        this.maxPoint[i] = evaluatedValue;
      }

      if (!this.minPoint[i] ||
          this.minPoint[i] > evaluatedValue) {
        this.minPoint[i] = evaluatedValue;
      }
    });
  }

  calculateSteps(resolutionX, resolutionY) {
    this.resolutionX = resolutionX;
    this.resolutionY = resolutionY;

    if (!resolutionX || resolutionX < 1) {
      throw new Error(
        `Invalid X resolution ${resolutionX}, must not be less than 1!`
      );
    }

    if (!resolutionY || resolutionY < 1) {
      throw new Error(
        `Invalid Y resolution ${resolutionY}, must not be less than 1!`
      );
    }

    for (let i = 0; i < this.steps.length; i += 1) {
      const diff = this.maxPoint[i] - this.minPoint[i];
      this.steps[i] = diff / (i === 0 ? resolutionX : resolutionY);
    }

    for (let i = 0; i < this.dataSets.length; i += 1) {
      let yFormat;

      switch (this.graphType) {
        case LINE_SUM: yFormat = 0; break;
        case LINE_AVG: yFormat = []; break;
        case SCATTER: {
          yFormat = Array(resolutionY).fill(null);
          break;
        }
        default: this._throwInvalidGraphTypeError();
      }

      this.dataSets[i] = new Array(resolutionX);
      for (let j = 0; j < resolutionX; j += 1) {
        this.dataSets[i][j] = typeof yFormat === 'number' ?
          yFormat : yFormat.slice(0);
      }
    }
  }

  addPoint(point) {
    if (point.length === 0 || point[0] === '') return;

    // Check if no Y value defined and default it to 1
    if (point.length < 2) {
      point.push(1);
    }

    point = point.map((value, i) =>
      Value.parseValue(value, this.valueTypes[i])
    );

    const diffs = point.map((value, i) =>
      value - this.minPoint[i]
    );

    const getStepCount = (value, step, maxCount) => {
      const count = Math.floor(value / step);
      return count > maxCount ? maxCount : count;
    };

    const xSteps = getStepCount(
      diffs[0],
      this.steps[0],
      this.resolutionX - 1
    );

    for (let i = 0; i < this.dataSets.length; i += 1) {
      switch (this.graphType) {
        case LINE_SUM: {
          this.dataSets[i][xSteps] += point[i + 1];
          break;
        }
        case LINE_AVG: {
          this.dataSets[i][xSteps].push(point[i + 1]);
          break;
        }
        case SCATTER: {
          const ySteps = getStepCount(
            diffs[i + 1],
            this.steps[i + 1],
            this.resolutionY - 1
          );

          if (this.dataSets[i][xSteps][ySteps] === null) {
            this.dataSets[i][xSteps][ySteps] = point[i + 1];
          }

          break;
        }
        default: this._throwInvalidGraphTypeError();
      }
    }
  }

  finalizeData() {
    this.dataSets = this.dataSets.map(dataSet =>
      dataSet.map((xSet) => {
        switch (this.graphType) {
          case LINE_SUM: {
            return [xSet];
          }
          case LINE_AVG: {
            if (xSet.length === 0) {
              return [0];
            }
            return [xSet.reduce((sum, n) => sum + n, 0) / xSet.length];
          }
          case SCATTER: {
            return xSet.filter(value => value !== null);
          }
          default: return this._throwInvalidGraphTypeError();
        }
      })
    );
  }

  _throwInvalidGraphTypeError() {
    throw new Error(`Invalid graph type ${this.graphType}`);
  }
}

module.exports = Graph;
