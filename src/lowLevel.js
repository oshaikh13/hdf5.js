const utils = require('./utils.js');
const consts = require('./consts.js');

// Low level API's for HDF5 reader
                  // UINT   8
const lowLevel = {};
lowLevel.SuperBlock = (bytes, start) => {

  var superBlockObject = {};

  superBlockObject.contents = utils.unpackStruct(consts.SUPERBLOCK_V0, bytes, start);
  
  if (consts.VALID_FORMAT_SIGNATURE != superBlockObject.contents.get('format_signature')) {
    throw new Error("Invalid HDF5 file provided!");
  }

  if (superBlockObject.contents.get('offset_size') != 8 || superBlockObject.contents.get('length_size') != 8) {
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
    node = new Map([
      ['symbols', 1]
    ])
  } else {
    node = utils.unpackStruct(consts.SYMBOL_TABLE_NODE, bytes, start);
  }

  var entries = [];
  for (var i = 0; i < node.get('symbols'); i++) {
    entries.push(utils.unpackStruct(consts.SYMBOL_TABLE_ENTRY, bytes, start));
  }

  if (rootGroup) symTableObj.groupOffset = entries[0].get('object_header_address'); 

  symTableObj.entries = entries;
  symTableObj._contents = node;

  return symTableObj;

}

lowLevel.Heap = (fileObj, offset, onReady) => {

  const heapObj = {};

  utils.fileChunkReader(fileObj._file, [offset, offset + utils.structSize(consts.LOCAL_HEAP) - 1], (e) => {
    const fileBuffer = Buffer.from(e.target.result);
    const localHeap = utils.unpackStruct(consts.LOCAL_HEAP, fileBuffer, 0);
    if (localHeap.get("signature") != "HEAP"); /* throw something */
    if (localHeap.get("version") != 0); /* throw something */
    const dataSegmentAddress = localHeap.get("address_of_data_segment");

    utils.fileChunkReader(fileObj._file, [dataSegmentAddress.toInt(), 
                                          dataSegmentAddress.toInt() + localHeap.get("data_segment_size").toInt() - 1], (e) => {
      const heapDataBuffer = Buffer.from(e.target.result);
      heapObj._contents = localHeap;
      heapObj.data = heapDataBuffer;
      onReady(heapObj);
    })
    
  })

  return heapObj;
}

module.exports = lowLevel;