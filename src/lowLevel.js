// Low level API's for HDF5 reader
                  // UINT   8
function SuperBlock (bytes, offset) {

  var superBlockObject = {};

  var values = unpackStruct(SUPERBLOCK_V0, bytes, offset)

  return superBlockObject;

}