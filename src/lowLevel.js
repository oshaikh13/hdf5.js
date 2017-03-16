// Low level API's for HDF5 reader
                  // UINT   8
function SuperBlock (bytes, start, end) {

  var superBlockObject = {};

  superBlockObject.contents = unpackStruct(SUPERBLOCK_V0, bytes, start);

  return superBlockObject;

}