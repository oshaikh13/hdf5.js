import struct from 'python-struct';
import utils from './utils';
import { Buffer } from 'buffer/'

export class MemMappedArray {
  file: File;
  dtype: string;
  offset: any;
  shape: Array<number>;

  constructor (file: File, dtype: string, shape: Array<number>, offset) {
    if (shape.length === 1) shape.push(1);

    this.file = file;
    this.dtype = dtype;
    this.shape = shape;
    this.offset = offset;
  }

  get (i = 0, j = 0, callback) {
    let memoryLocationStart = this.offset.toInt();
    // resolve where we are from the offset
    if (i > 0) memoryLocationStart += struct.sizeOf(this.dtype) * this.shape[1] * i;
    memoryLocationStart += struct.sizeOf(this.dtype) * j;

    const memoryLocationEnd = memoryLocationStart + struct.sizeOf(this.dtype) - 1;

    utils.fileChunkReader(this.file, [memoryLocationStart, memoryLocationEnd], (e) => {
      const buffer = Buffer.from(e.target.result);
      callback(struct.unpack(this.dtype, buffer, 0)[0], i, j);
    })
    
  }

  // loads the whole thing in memory! careful
  toArray (callback) {
    const totalElements = this.shape[0] * this.shape[1];
    let completed = 0;
    let dataArray = [];
    for (var i = 0; i < this.shape[0]; i++) {
      for (var j = 0; j < this.shape[1]; j++) {
        this.get(i, j, (x, i, j) => { 
          if (!dataArray[i]) dataArray[i] = [];
          dataArray[i][j] = x;
          if (++completed == totalElements) callback(dataArray);
        });
      }
    }
  }
}