import utils from './utils';
import consts from './consts';
import { Buffer } from 'buffer/';
import DataObjects from './DataObjects';
import lowLevel from './lowLevel';

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

export default HDF5;
