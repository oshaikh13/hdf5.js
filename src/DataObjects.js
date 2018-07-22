const utils = require('./utils.js');
const consts = require('./consts.js');
const struct = require('python-struct');
const Buffer = require('buffer/').Buffer;
const lowLevel = require('./lowLevel.js');
const BTree = require('./BTree.js');

var DataObjects = (fileObj, offset, onReadyCallback) => {
  const dataObj = {};

  const setUpObject = (msgData, unpackedHeaderObj, msgs) => {
      dataObj.msgs = msgs;
      dataObj.msg_data = msgData;

      // this is the offset passed initially to DataObjects
      dataObj.offset = offset;
      dataObj._globl_heaps = {};
      dataObj.header = unpackedHeaderObj;

      // cached attributes
      dataObj._filter_pipeline = null;
      dataObj._chunk_params_set = false;
      dataObj._chunks = null;
      dataObj._chunk_dims = null;
      dataObj._chunk_address = null;

      onReadyCallback();
  }

  // TODO: arg version is currently unused.
  // Implement dataobj version x, y, z, etc.
  const readObjectHeader = (version) => {
    utils.fileChunkReader(fileObj._file, 
                          [offset, offset + consts.OBJECT_HEADER_V1_SIZE],
    (e) => {
    
      const dataObjHeaderBytes = Buffer.from(e.target.result);  

      // the start loc is 0 because we're reading from the start of a slice

      if (version === 1) {

        const unpackedHeaderObj = 
          utils.unpackStruct(consts.OBJECT_HEADER_V1, dataObjHeaderBytes, 0);
  
        utils.fileChunkReader(fileObj._file, 
          [offset + consts.OBJECT_HEADER_V1_SIZE, 
           offset + consts.OBJECT_HEADER_V1_SIZE + unpackedHeaderObj.get("object_header_size") - 1],
        (e) => {
          const msgData = Buffer.from(e.target.result);
          utils.parseV1Objects(msgData, unpackedHeaderObj, (msgs) => {
            setUpObject(msgData, unpackedHeaderObj, msgs)
          });
        });

      }


    });
  }

  // read the first byte at the offset to see the version of the dataobject
  utils.fileChunkReader(fileObj._file, [offset, offset], (e) => {
    var loadedFile = e.target.result;
    const version = Buffer.from(loadedFile)[0];
    // RIGHT NOW, WE DEAL WITH ONLY V1s
    readObjectHeader(version); 
  });

  utils.parseV1Objects = function (msgBytes, unpackedHeaderObj, callback) {

    var offset = 0;
    var msgs = [];
    var completed = 0;
    for (var i = 0; i < unpackedHeaderObj.get("total_header_messages"); i++) {
      const currentMsg = utils.unpackStruct(consts.HEADER_MSG_INFO_V1, msgBytes, offset);
      currentMsg.set("offset_to_message", offset + 8);
      if (currentMsg.get("type") === consts.OBJECT_CONTINUATION_MSG_TYPE) {
        var unpacked = struct.unpack('<QQ', msgBytes, offset + 8);
        throw new Error("unimplemented");
      } else {
        msgs.push(currentMsg);
        offset += 8 + currentMsg.size;
      }
    }

    callback(msgs);

  }

  // method definitions

  dataObj.findMessageTypes = (msgType) => {
    return dataObj.msgs.filter(msg => msg.get("type") === msgType)
  }

  dataObj.getLinks = () => {
    const symTableMessages = dataObj.findMessageTypes(consts.SYMBOL_TABLE_MSG_TYPE)
    if (symTableMessages.length) {
      dataObj._getSymbolTableLinks(symTableMessages);
    }
  }

  dataObj._getSymbolTableLinks = (symTableMessages) => {
    if (symTableMessages.length != 1) /* throw something */;
    if (symTableMessages[0].get("size") != 16) /* throw something */;

    const symbolTableMessage = utils.unpackStruct(consts.SYMBOL_TABLE_MSG, dataObj.msg_data,
      symTableMessages[0].get("offset_to_message"));

    const heap = lowLevel.Heap(fileObj, symbolTableMessage.get("heap_address").toInt(), (heapObj) => {
      console.log(heapObj);
    });

    const bTree = BTree(fileObj, symbolTableMessage.get("btree_address").toInt(), (bTreeObj) => {
      console.log(bTreeObj);
    });
    
  }

  return dataObj;
}

module.exports = DataObjects;