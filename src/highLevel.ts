import DataObjects from './DataObjects';
import lowLevel from './lowLevel';
import { FileObj, HDF5, DataObj, SuperBlock } from './interfaces';

const HDF5 = <HDF5>{};

var Group = (name: string, dataObjects: DataObj, parent: FileObj) => {

  var groupObj = {
    parent,
    file: parent._file,
    name,
  
    _links: dataObjects.getLinks(),
    _dataObjects: dataObjects,
    attrs: null
  };

  return groupObj;
}

HDF5.File = function (file: File) {

  const fileObj = <FileObj>{};
  fileObj._file = file;

  fileObj.SuperBlock = lowLevel.SuperBlock(fileObj, 0, (superBlock: SuperBlock) => {
    const dataObjects = DataObjects(fileObj, superBlock._rootSymbolTable.groupOffset, (err) => {
      Group('/', dataObjects, fileObj);
    });
  });

  return fileObj;
}

export default HDF5;
