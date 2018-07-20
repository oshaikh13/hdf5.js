const utils = require('./utils.js');
const consts = require('./consts.js');
const struct = require('python-struct');
const Buffer = require('buffer/').Buffer;

var DataObjects = (fileObj, offset) => {
  const dataObj = {};

  // TODO: arg version is currently unused.
  // Implement dataobj version x, y, z, etc.
  const readObjectHeader = (version) => {
    utils.fileChunkReader(fileObj._file, 
                          [offset, offset + consts.OBJECT_HEADER_V1_SIZE],
    (e) => {
    
      const dataObjHeaderBytes = new Uint8Array(e.target.result);  

      // the start loc is 0 because we're reading from the start of a slice
      const unpackedHeaderObj = 
        utils.unpackStruct(consts.OBJECT_HEADER_V1, dataObjHeaderBytes, 0);
    

      utils.fileChunkReader(fileObj._file, 
        [offset + consts.OBJECT_HEADER_V1_SIZE, 
         offset + consts.OBJECT_HEADER_V1_SIZE + unpackedHeaderObj.object_header_size[0]],
      (e) => {
        
        utils.parseV1Objects(new Uint8Array(e.target.result), unpackedHeaderObj, () => {

        });
      });
  

      // dataObj.msgs = unpackedDataObj.msgs;
      // dataObj.msg_data = unpackedDataObj.msg_data;
      // dataObj.offset = offset;
      // dataObj._globl_heaps = {};
      // dataObj.header = unpackedDataObj.header;

      // // cached attributes
      // dataObj._filter_pipeline = null;
      // dataObj._chunk_params_set = false;
      // dataObj._chunks = null;
      // dataObj._chunk_dims = null;
      // dataObj._chunk_address = null;

      // debugger;

    });
  }

  // read the first byte at the offset to see the version of the dataobject
  utils.fileChunkReader(fileObj._file, [offset, offset], (e) => {
    if (e.target.readyState == FileReader.DONE) {

      var loadedFile = e.target.result;
      const version = new Uint8Array(loadedFile)[0];
      // RIGHT NOW, WE DEAL WITH ONLY V1s
      readObjectHeader(version);

    }
  });

  utils.parseV1Objects = function (msgBytes, unpackedHeaderObj, callback) {
    var offset = 0;
    var msgs = [];
    var completed = 0;
    for (var i = 0; i < unpackedHeaderObj.total_header_messages[0]; i++) {
      const currentMsg = utils.unpackStruct(consts.HEADER_MSG_INFO_V1, msgBytes, offset);
      currentMsg.offset_to_message = offset + 8;
      if (currentMsg.type[1] === consts.OBJECT_CONTINUATION_MSG_TYPE) {
        var unpacked = struct.unpack('<QQ', Buffer.from(msgBytes.buffer), offset + 8);
        throw new Error("unimplemented");
      } else {

      }
    }

  }

  return dataObj;
}

module.exports = DataObjects;