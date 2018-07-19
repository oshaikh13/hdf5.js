const utils = require('./utils.js');
const consts = require('./consts.js');

// Low level API's for HDF5 reader
                  // UINT   8
const lowLevel = {};
lowLevel.SuperBlock = (bytes, start) => {

  var superBlockObject = {};

  superBlockObject.contents = utils.unpackStruct(consts.SUPERBLOCK_V0, bytes, start);
  for (var i = 0; i < consts.VALID_FORMAT_SIGNATURE.length; i++) {
    if (consts.VALID_FORMAT_SIGNATURE[i] != superBlockObject.contents['format_signature'][i])
      throw new Error("Invalid HDF5 file provided!");
  }

  if (superBlockObject.contents['offset_size'] != 8 || superBlockObject.contents['length_size'] != 8) {
    throw new Error("File uses non 64-bit addressing.");
  }

  superBlockObject.endOfBlock = start + consts.SUPERBLOCK_V0_SIZE;

  superBlockObject._rootSymbolTable = lowLevel.SymbolTable(bytes, 
    superBlockObject.endOfBlock, true);

  return superBlockObject;

}


/**
 * A SymbolTable loader.
 * rootGroup - is this the rootgroup? - boolean
 *
 */
lowLevel.SymbolTable  = (bytes, start, rootGroup) => {

  var symTableObj = {};

  var node;

  if (rootGroup) {
    node = {
      'symbols': 1
    }
  } else {
    node = utils.unpackStruct(consts.SYMBOL_TABLE_NODE, bytes, start);
  }

  var entries = [];
  for (var i = 0; i < node['symbols']; i++) {
    entries.push(utils.unpackStruct(consts.SYMBOL_TABLE_ENTRY, bytes, start));
  }

  if (rootGroup) symTableObj.groupOffset = entries[0]['object_header_address']; 

  symTableObj.entries = entries;
  symTableObj._contents = node;

  return symTableObj;

}

module.exports = lowLevel;