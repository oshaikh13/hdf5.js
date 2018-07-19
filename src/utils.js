const utils = {};

utils.structSize = (struct) => {
  var size = 0;
  for (var key in struct) {
    size += struct[key];
  }
  return size;
}

utils.unpackStruct = (structure, buffer, loc) => {

  var structValues = {};

  for (var key in structure) {
    var numBytes = structure[key];
    structValues[key] = [];
    var endByte = loc + numBytes;
    for (loc; loc < endByte; loc++) {
      structValues[key].push(buffer[loc]);
    }
  }

  return structValues;

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