const lowLevel = require('./lowLevel.js');
const utils = require('./utils.js');
const consts = require('./consts.js');
const DataObjects = require('./DataObjects.js');
const Buffer = require('buffer/').Buffer;

var HDF5 = {};

var Group = (name, dataObjects, parent) => {
  var groupObj = {};
  groupObj.parent = parent;
  groupObj.file = parent._file;
  groupObj.name = name;

  groupObj._links = dataObjects.getLinks();
  groupObj._dataObjects = dataObjects;
  groupObj.attrs = null;
}

HDF5.File = function (file) {
  var fileObj = {};

  fileObj._file = file;
  fileObj.SuperBlock = null;

  const readSuperBlock = (file, size, callback) => {
    utils.fileChunkReader(file, [0, size], (e) => {
      if (e.target.readyState == FileReader.DONE) {
        const superBlockBuffer = Buffer.from(e.target.result);
        // look at its superblock
        fileObj.SuperBlock = lowLevel.SuperBlock(superBlockBuffer, 0);
        callback(false);  
      }
    });
  }

  readSuperBlock(file, consts.SUPERBLOCK_V0_SIZE + 
                       consts.SYMBOL_TABLE_ENTRY_SIZE, 
                       (err) => {
    if (err) throw new Error("crap");
    const dataObjects = DataObjects(fileObj, fileObj.SuperBlock._rootSymbolTable.groupOffset[0], (err) => {
      Group('/', dataObjects, fileObj);
    });
  }); 

  return fileObj;
}

module.exports = HDF5;
