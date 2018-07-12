function DataObjects (fileObj, offset) {
  const dataObj = {};

  // TODO: arg version is currently unused.
  // Implement dataobj version x, y, z, etc.
  const readObjectHeader = (version) => {
    utils.fileChunkReader(fileObj._file, 
                          [offset, offset + utils.structSize(consts.OBJECT_HEADER_V1)],
    (e) => {
    
      var loadedFile = e.target.result;
      const dataObjHeaderBytes = new Uint8Array(loadedFile);  

      // the start loc is 0 because we're reading from the start of a slice
      dataObj._header = utils.unpackStruct(consts.OBJECT_HEADER_V1, dataObjHeaderBytes, 0);
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

  return dataObj;
}