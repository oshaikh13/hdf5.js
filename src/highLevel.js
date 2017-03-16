
var HDF5 = {};

HDF5.File = function (file) {
  var fileObj = {};

  fileObj._file = file;
  fileObj._reader = new FileReader();
  fileObj.SuperBlock = null;

  /**
   * The onError callback.
   */
  fileObj.onError = function(e) {

    throw new Error(e.target.error.code);

  };

  /**
   * The onLoad callback (really the onLoadEnd).
   */
  fileObj.onLoad = function(e) {

    if (e.target.readyState == FileReader.DONE) {

      // we read an array buffer
      var loadedFile = e.target.result;

      var byteBuffer = new Uint8Array(loadedFile);

      // and look at its superblock
      this.SuperBlock = SuperBlock(byteBuffer, 0, 512);

    }

  };

  fileObj._reader.onerror = fileObj.onError.bind(fileObj);
  fileObj._reader.onloadend = fileObj.onLoad.bind(fileObj);

  fileObj._reader.readAsArrayBuffer(fileObj._file);

  return fileObj;
}
