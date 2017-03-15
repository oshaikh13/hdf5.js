function unpackStruct (structure, buffer, loc) {

  var structValues = {};

  for (var key in structure) {
    var numBytes = structure[key];
    structValues[key] = [];
    int endByte = loc + numBytes;
    for (loc; i < endByte; loc++) {
      structValues[key].push(buffer[loc]);
    }
  }

  return structValues;

}