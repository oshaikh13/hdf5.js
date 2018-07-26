import DataObjects from './DataObjects';
import lowLevel from './lowLevel';
import { DataObj, SuperBlock } from './interfaces';


class Group {
  parent: HDF5File;
  file: File;
  name: string;

  _links: object;
  _dataObjects: DataObj;
  attrs: object;

  setupGroup(name: string, dataObjects: DataObj, parent: HDF5File) {
    this.name = name;
    this._dataObjects = dataObjects;
    this.parent = parent;
    this.file = parent._file;

    this._links = dataObjects.getLinks();
  }
}

class HDF5File extends Group {
  SuperBlock: SuperBlock;
  _file: File;

  constructor(file: File) {
    super();
    this._file = file;
    this.SuperBlock = lowLevel.SuperBlock(this, 0, (superBlock: SuperBlock) => {
      const dataObjects = DataObjects(this, superBlock._rootSymbolTable.groupOffset, (err) => {
        this.setupGroup('/', dataObjects, this);
      });
    });
  }
}

export default HDF5File;
