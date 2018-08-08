import struct from 'python-struct';
import utils from './utils';
import { Buffer } from 'buffer/'

export class MemMappedArray {
  file: File;
  dtype: string;
  offset: any;
  shape: Array<number>;

  constructor (file: File, dtype: string, shape: Array<number>, offset) {
    this.file = file;
    this.dtype = dtype;
    this.shape = shape;
    this.offset = offset;
  }

  get (...args: Array<any>) {

    let memoryLocationStart = this.offset.toInt();
    const callback = args.pop();
    for (var i = 0; i < args.length - 1; i++) {
      memoryLocationStart += struct.sizeOf(this.dtype) * this.shape[i + 1] * i;
    }
    memoryLocationStart += args[args.length - 1] * struct.sizeOf(this.dtype);

    const memoryLocationEnd = memoryLocationStart + struct.sizeOf(this.dtype) - 1;

    utils.fileChunkReader(this.file, [memoryLocationStart, memoryLocationEnd], (e) => {
      const buffer = Buffer.from(e.target.result);
      const unpackedValue = struct.unpack(this.dtype, buffer, 0)[0];
      callback(unpackedValue, ...args);
    })

  }

  toArray (callback) {

    const totalElements = this.shape.reduce((prev, curr) => prev * curr, 1);
    let completed = 0;
    let dataArray = [];

    const setDataArray = (indicies, value, array = []) => {

      let currentPtr = array;

      for (let i = 0; i < indicies.length - 1; i++) {
        if (!currentPtr[indicies[i]]) currentPtr[indicies[i]] = [];
        currentPtr = currentPtr[indicies[i]];
      }

      currentPtr[indicies[indicies.length - 1]] = value;
      
      return array;

    }

    const recursiveArrayIterator = (currentShapeIdx: number, builtIdx: Array<number>) => {
      for (var i = 0; i < this.shape[currentShapeIdx]; i++) {

        let query = [...builtIdx];
        query[query.length - 1] = i;

        if (this.shape[currentShapeIdx + 1]) {
          recursiveArrayIterator(currentShapeIdx + 1, query.concat([0]));
        }

        this.get(...query, (x, ...query) => {
          setDataArray(query, x, dataArray);
          if (++completed === totalElements) callback(dataArray);
        })

      }
    }

    recursiveArrayIterator(0, [0]);

  }
}