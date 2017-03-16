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
    throw new Error("File uses non 64-bit addressing.");
  }

  superBlockObject.endOfBlock = start + SUPERBLOCK_V0_SIZE;

  superBlockObject.offsetToDataObjects = function() {
    var symbolTable = SymbolTable(bytes, this.endOfBlock, true);
    this._rootSymbolTable = symbolTable;
    return this._rootSymbolTable.groupOffset;
  }

  return superBlockObject;

}


/**
 * A SymbolTable loader.
 * rootGroup - is this the rootgroup? - boolean
 */
function SymbolTable (bytes, start, rootGroup) {

  var symTableObj = {};

  var node;

  if (rootGroup) {
    node = {
      'symbols': 1
    }
  } else {
    node = unpackStruct(SYMBOL_TABLE_NODE, bytes, start)
  }

  var entries = [];
  for (var i = 0; i < node['symbols']; i++) {
    entries.push(unpackStruct(SYMBOL_TABLE_ENTRY, bytes, start));
  }

  if (rootGroup) symTableObj.groupOffset = entries[0]['object_header_address']; 

  symTableObj.entries = entries;
  symTableObj._contents = node;

  return symTableObj;

}

