
export interface FileObj {
  _file: File;
  SuperBlock: SuperBlock;
}

export interface BTree {
  rootNode: Map<string, any>;
  allNodes: object;
  symbolTableAddresses: Function;
}

export interface DataObj {
  msgs: Array<Map<string, any>>;
  msg_data: Uint8Array;

  // this is the offset passed initially to DataObjects
  offset: number;
  _globl_heaps: object;
  header: object;

  // cached attributes
  _filter_pipeline: object;
  _chunk_params_set: boolean;
  _chunks: object;
  _chunk_dims: object;
  _chunk_address: object;

  parseV1Objects: Function;
  findMessageTypes: Function;
  getLinks: Function;
  _getSymbolTableLinks: Function;

}

export interface SuperBlock {
  contents: Map<string, any>;
  endOfBlock: number;
  _rootSymbolTable: SymbolTable;
}

export interface SymbolTable {
  groupOffset?: number;
  entries: Array<Map<string, any>>;
  _contents: object;
  assignName: Function;
  getLinks: Function;
}

export interface Heap {
  data: Uint8Array;
  _contents: Map<string, any>;
  getObjectName: Function;
}

export interface HDF5 {
  File: Function
}