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

  return groupObj;
}

HDF5.File = function (file) {
  var fileObj = {};

  fileObj._file = file;
  fileObj.SuperBlock = null;

  fileObj.SuperBlock = lowLevel.SuperBlock(fileObj, 0, (superBlock) => {
    const dataObjects = DataObjects(fileObj, superBlock._rootSymbolTable.groupOffset.toInt(), (err) => {
      Group('/', dataObjects, fileObj);
    });
  });

  return fileObj;
}

module.exports = HDF5;
