import DataObjects from './DataObjects';
import lowLevel from './lowLevel';
import { DataObj, SuperBlock } from './interfaces';
import { Reference } from './utils';
import posix from 'path';

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

  get(y: string | Reference, callback) {
    if (y instanceof Reference) {
      this._dereference(y);
    }

    const path : string = posix.normalize(y);
    if (path === '.') callback(this);
    if (path.startsWith('/')) this.get(path.slice(1), (value) => { callback(value) });

    let nextObj, additionalObj;
    if (posix.dirname(path) != '.') {
      [nextObj, additionalObj] = path.split(/_(.+)/)
    } else {
      additionalObj = ".";
      nextObj = path;
    }

    if (!this._links[nextObj]) {
      throw new Error(nextObj + " not found in group.");
    }

    const objName = posix.join(this.name, nextObj);
    const dataObjs = DataObjects(this.parent, this._links[nextObj].toInt(), () => {
      if (dataObjs.isDataset()) {
        if (additionalObj != '.') throw new Error(objName + " is a dataset, not a group");
        new Dataset(objName, dataObjs, this.parent).get({}, () => {});
      } else {
        const newGroup = new Group();
        newGroup.setupGroup(objName, dataObjs, this.parent, () => {
          newGroup.get(additionalObj, (value) => {
            callback(value)
          })
        });
      }
    });

  }

  visitItems (callback) : object {
    // throw new Error("unimplemented");
    let rootNameLength = this.name.length;

    if (!this.name.endsWith('/')) {
      rootNameLength++;
    }

    return null;
  }

  attrs (callback) {
    if (this._attrs == null) {
      this._dataObjects.getAttributes((attrs) => {
        this._attrs = attrs;
        callback(attrs);
      });
      
    } else callback(this._attrs);
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

class Dataset {
  parent: HDF5File;
  name: string;
  file: File;

  _dataObjects: DataObj;
  _attrs: null | object;
  _astype: null | object;

  constructor(name: string, dataObjects: DataObj, parent: HDF5File) {
    this.name = name;
    this._dataObjects = dataObjects;
    this.parent = parent;
    this.file = parent._file;
  }

  get (args, callback) {
    const data = this._dataObjects.getData();
  }
}

export default HDF5File;
