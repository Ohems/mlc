const moment = require('moment');

const NUMBER = 0;
const MOMENT = 1;

module.exports = {
  NUMBER,
  MOMENT,

  findType(value) {
    if (typeof value === 'number') {
      return NUMBER;
    }

    if (typeof value === 'string') {
      // Test if number
      if (!Number.isNaN(value) && isFinite(value)) {
        return NUMBER;
      }

      // Test if moment timestamp
      const parsedMoment = moment(value);
      if (parsedMoment.isValid()) {
        return MOMENT;
      }
    }

    throw new Error('Invalid number format, only numbers and timestamps allowed!');
  },

  parseValue(value, type) {
    switch (type) {
      case NUMBER: {
        if (typeof value === 'number') {
          return value;
        }
        if (typeof value === 'string') {
          return parseFloat(value);
        }
        throw new Error(`Invalid value ${value}, expected a number!`);
      }
      case MOMENT: {
        return moment(value).valueOf();
      }
      default: throw new Error(`Invalid type ${type}!`);
    }
  },

  toString(value, type) {
    switch (type) {
      case MOMENT: return moment(value).format();
      default: return value.toString();
    }
  },
};
