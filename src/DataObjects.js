function DataObjects (fileObj, offset) {
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

      debugger;

      utils.fileChunkReader(fileObj._file, 
        [offset + consts.OBJECT_HEADER_V1_SIZE + 1, 
         offset + consts.OBJECT_HEADER_V1_SIZE + unpackedHeaderObj.object_header_size[0]],
      (e) => {
        const msgBytes = new Uint8Array(e.target.result);  
        var offset = 0;
        var msgs = [];
        debugger;
        for (var i = 0; i < unpackedHeaderObj.total_header_messages[0]; i++) {
          debugger;
          const currentMsg = utils.unpackStruct(consts.HEADER_MSG_INFO_V1, msgBytes, offset);
          currentMsg.offset_to_message = offset + 8;
          debugger;
        }
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

  utils.parseV1Objects = function () {

  }

  return dataObj;
}