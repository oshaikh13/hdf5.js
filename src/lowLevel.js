// Low level API's for HDF5 reader
                  // UINT   8
function SuperBlock (bytes, start) {

  var superBlockObject = {};

  superBlockObject.contents = unpackStruct(SUPERBLOCK_V0, bytes, start);

  for (var i = 0; i < VALID_FORMAT_SIGNATURE.length; i++) {
    if (VALID_FORMAT_SIGNATURE[i] != superBlockObject.contents['format_signature'][i])
      throw new Error("Invalid HDF5 file provided!");
  }

  if (superBlockObject.contents['offset_size'] != 8 || superBlockObject.contents['length_size'] != 8) {
    throw new Error("File uses none 64-bit addressing.");
  }

  return superBlockObject;

}