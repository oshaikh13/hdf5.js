const utils = require('./utils.js');
const consts = require('./consts.js');

// Low level API's for HDF5 reader
                  // UINT   8
const lowLevel = {};
lowLevel.SuperBlock = (fileObj, offset, callback) => {

  var superBlockObject = {};

  utils.fileChunkReader(fileObj._file, [offset, offset + consts.SUPERBLOCK_V0_SIZE - 1], (e) => {

    const superBlockBuffer = Buffer.from(e.target.result);

    superBlockObject.contents = utils.unpackStruct(consts.SUPERBLOCK_V0, superBlockBuffer, offset);
  
    if (consts.VALID_FORMAT_SIGNATURE != superBlockObject.contents.get('format_signature')) {
      throw new Error("Invalid HDF5 file provided!");
    }
  
    if (superBlockObject.contents.get('offset_size') != 8 || superBlockObject.contents.get('length_size') != 8) {
      throw new Error("File uses non 64-bit addressing.");
    }
  
    superBlockObject.endOfBlock = offset + consts.SUPERBLOCK_V0_SIZE;
    superBlockObject._rootSymbolTable = lowLevel.SymbolTable(fileObj, 
      superBlockObject.endOfBlock, true, () => {
        callback(superBlockObject);  
    });

  });

  return superBlockObject;

}


/**
 * A SymbolTable loader.
 * rootGroup - is this the rootgroup? - boolean
 *
 */
lowLevel.SymbolTable  = (fileObj, offset, rootGroup, callback) => {

  var symTableObj = {};

  var node;

  const readSymTableNode = (offset, rootgroup, callback) => {
    if (rootgroup) {
      // No header, one entry
      callback(new Map([
        ['symbols', 1]
      ]), offset);

    } else {
      utils.fileChunkReader(fileObj._file, [offset, offset + utils.structSize(consts.SYMBOL_TABLE_NODE) - 1], (e) => {
        offset += utils.structSize(consts.SYMBOL_TABLE_NODE);
        callback(utils.unpackStruct(consts.SYMBOL_TABLE_NODE, Buffer.from(e.target.result), 0), offset);
      });
    }
  }


  readSymTableNode(offset, rootGroup, (node) => {
    const endOffset = offset + (utils.structSize(consts.SYMBOL_TABLE_ENTRY) * node.get('symbols')) - 1;

    utils.fileChunkReader(fileObj._file, [offset, endOffset], (e) => {
      
      const nodeEntryBuffer = Buffer.from(e.target.result);
      let readFrom = 0;
      let entries = [];
      for (var i = 0; i < node.get('symbols'); i++) {
        entries.push(utils.unpackStruct(consts.SYMBOL_TABLE_ENTRY, nodeEntryBuffer, readFrom));
        readFrom += utils.structSize(consts.SYMBOL_TABLE_ENTRY);
      }
    
      if (rootGroup) symTableObj.groupOffset = entries[0].get('object_header_address'); 
    
      symTableObj.entries = entries;
      symTableObj._contents = node;
      callback(symTableObj);

    });
  });

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