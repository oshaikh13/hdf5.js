var HDF5 = HDF5 || {};

HDF5.STATES = {
  SUPERBLOCK: [0, 8],
  ROOTGROUP: 1
};

HDF5.File = function(file) {
  
  /**
   * Since we slice the file, we need an
   * attached file reader.
   */
  this._reader = new FileReader();
  this._reader.onerror = this.onError;
  this._reader.onloadend = this.onLoad;

  this._state = HDF5.STATES.SUPERBLOCK;


  // start reading this file
  var format_signature = file.slice(0,8);
  this._reader.readAsArrayBuffer(blob);

};

/**
 * The onError callback.
 */
HDF5.File.prototype.onError = function(e) {

  throw new Error(e.target.error.code);

};

/**
 * The onLoad callback (really the onLoadEnd).
 */
HDF5.File.prototype.onLoad = function(e) {

  if (e.target.readyState == FileReader.DONE) {

    // we read an array buffer
    bytes_buffer = e.target.result;
    
  }

};


