var HDF5 = HDF5 || {};

HDF5.STATES = {
  SUPERBLOCK: [0, 512, 'readSuperblock'],
  ROOTGROUP: [100,200, 'readRootGroup']
};

HDF5.VERBOSE = true;

HDF5.File = function(file) {
  
  this._file = file;

  /**
   * Since we slice the file, we need an
   * attached file reader.
   */
  this._reader = new FileReader();
  this._reader.onerror = this.onError.bind(this);
  this._reader.onloadend = this.onLoad.bind(this);

  this._state = parseInt(HDF5.STATES.SUPERBLOCK);


  // // start reading this file
  // var format_signature = file.slice(0,8);
  // this._reader.readAsArrayBuffer(blob);

  this.readNext();

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
    var bytes_buffer = e.target.result;

    // and execute the callback by passing the buffer
    var current_state = this._state;
    var callback = this.getState(current_state)[2];
    eval('this.'+callback+'(bytes_buffer);'); // DANGER

    // and read the next one..
    this._state += 1;
    this.readNext();

  }

};

HDF5.File.prototype.getState = function(which) {

  return HDF5.STATES[Object.keys(HDF5.STATES)[which]];

};

HDF5.File.prototype.readNext = function() {

  var current_state = this._state;

  // grab start and end bytes
  var start_byte = this.getState(current_state)[0];
  var end_byte = this.getState(current_state)[1];

  var blob = this._file.slice(start_byte, end_byte);
  this._reader.readAsArrayBuffer(blob);

};

/*
 * Specs
 */
HDF5.File.prototype.readSuperblock = function(buffer) {

  var bytes = new Uint8Array(buffer);

  // check if this is a valid HDF5 file
  var hdf5magic = [137, 72, 68, 70, 13, 10, 26, 10];

  var valid = true;

  for (var i=0; i<8; ++i) {

    if (bytes[i] != hdf5magic[i]) {
      valid = false;
    }

  }

  if (valid) {

    console.log('Valid HDF5 file.');

  } else {

    throw new Error('Invalid HDF5 file.');

  }

  // now let's read all the other things
  var version_number = bytes[9];
  var version_number_files_free_space_storage = bytes[10];
  var version_number_root_group_symbol_table_entry = bytes[11];
  // skip 1 - bytes[12]
  console.log(bytes[12])
  var version_number_shared_header_message_format = bytes[13];
  var size_of_offsets = bytes[14];
  var size_of_lengths = bytes[15];
  // skip 1 - bytes[13]
  var group_leaf_node_k = [bytes[16], bytes[17]];
  var group_internal_node_k = [bytes[18], bytes[19]];

  if (HDF5.VERBOSE) {
    console.log('Version Number of the Superblock', version_number);
    console.log('Version Number of the Files Free Space Information', version_number_files_free_space_storage);
    console.log('Version Number of the Root Group Symbol Table Entry', version_number_root_group_symbol_table_entry);
    console.log('Version Number of the Shared Header Message Format', version_number_shared_header_message_format);
    console.log('Size of Offsets', size_of_offsets);
    console.log('Size of Lengths', size_of_lengths);
    console.log('Group Leaf Node K', group_leaf_node_k);
    console.log('Group Internal Node K', group_internal_node_k);

  }

};


