
function structSize (struct) {
  var size = 0;
  for (var key in struct) {
    size += struct[key];
  }
  return size;
}

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
