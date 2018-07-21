const Buffer = require('buffer/').Buffer;
const struct = require('python-struct');

const utils = {};

utils.structSize = (structure) => {
  const fmt = '<' + [...structure.values()].join("");
  return struct.sizeOf(fmt)
}

utils.unpackStruct = (structure, buffer, loc) => {

  const fmt = '<' + [...structure.values()].join("");
  const values = struct.unpack(fmt, buffer, loc);
  const mapped = new Map ([...structure.keys()].map((elem, index) => [elem, values[index]]));
  return mapped;

}

utils.fileReader = new FileReader();

utils.fileChunkReader = (file, intervals, callback) => {

  utils.fileReader.onloadend = (e) => {
    callback(e);
  }

  const selectedBlob = file.slice(intervals[0], intervals[1] + 1);
  utils.fileReader.readAsArrayBuffer(selectedBlob);
  
}

module.exports = utils;