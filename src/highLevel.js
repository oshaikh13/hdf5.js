
var HDF5 = {};

HDF5.File = function (file) {
  var fileObj = {};

  fileObj._file = file;
  fileObj.SuperBlock = null;

  const readSuperBlock = (file, size, callback) => {
    const superBlockReader = new FileReader();
    superBlockReader.onloadend = (e) => {
      if (e.target.readyState == FileReader.DONE) {

        // we read an array buffer
        var loadedFile = e.target.result;
        const superBlockBuffer = new Uint8Array(loadedFile);
  
        // and look at its superblock
        fileObj.SuperBlock = lowLevel.SuperBlock(superBlockBuffer, 0);
        callback(false);  
      }
    }

    const superBlockBlob = file.slice(0, size + 1);
    superBlockReader.readAsArrayBuffer(superBlockBlob);
  }

  readSuperBlock(file, consts.SUPERBLOCK_V0_SIZE + 
                       consts.SYMBOL_TABLE_ENTRY_SIZE, 
                       (err) => {
    if (err) throw new Error("crap");
    console.log(fileObj);
    // var dataObjects = DataObjects(fileObj._arrayBuffer, offset);
  }); 

  return fileObj;
}
