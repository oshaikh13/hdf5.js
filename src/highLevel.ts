import DataObjects from './DataObjects';
import lowLevel from './lowLevel';
import { DataObj, SuperBlock } from './interfaces';
import { Reference } from './utils';

class Group {
  parent: HDF5File;
  file: File;
  name: string;

  _links: object;
  _dataObjects: DataObj;
  _attrs: object;

  setupGroup(name: string, dataObjects: DataObj, parent: HDF5File, callback) {
    this.name = name;
    this._dataObjects = dataObjects;
    this.parent = parent;
    this.file = parent._file;
    dataObjects.getLinks((links) => {
      this._links = links;
      console.log(links);
      callback();
    });
  }

  length() : number {
    return Object.keys(this._links).length;
  }

  toString () : string {
    return "<HDF5 group " + this.name + " (" + this.length() + " members)>"
  }

  *_iter () : IterableIterator<string> {
    for (var k in this._links) {
      yield k;
    }
  }

  _dereference (refr: Reference) : object {
    if (refr.isEmpty()) {
      throw new Error("Cannot dereference null");
    }
    const obj = this.parent._getObjectByAddress(refr.addressOfReference);
    if (obj == null) {
      throw new Error("Reference not found in file");
    }
    return obj;
  }

  get(y: any) {
    if (y instanceof Reference) {
      this._dereference(y);
    }
  }

  visitItems (callback) : object {
    // throw new Error("unimplemented");
    let rootNameLength = this.name.length;

    if (!this.name.endsWith('/')) {
      rootNameLength++;
    }

    return null;
  }

  attrs () : object {
    if (this._attrs == null) {
      this._attrs = this._dataObjects.getAttributes();
      return this._attrs;
    } else return this._attrs;
  }

}

class HDF5File extends Group {
  SuperBlock: SuperBlock;
  _file: File;

  constructor(file: File, callback) {
    super();
    this._file = file;
    this.SuperBlock = lowLevel.SuperBlock(this, 0, (superBlock: SuperBlock) => {
      const dataObjects = DataObjects(this, superBlock._rootSymbolTable.groupOffset, (err) => {
        this.setupGroup('/', dataObjects, this, () => {
          callback();
        });
      });
    });
  }



  _getObjectByAddress(objAddress: number) {
    if (this._dataObjects.offset === objAddress) return this;
    return this.visitItems((x, y) => y._dataObjects.offset === objAddress);
  }
}

export default HDF5File;
