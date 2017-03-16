function unpackStruct (structure, buffer, loc) {

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