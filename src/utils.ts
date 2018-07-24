import struct from 'python-struct';

interface utils {
  structSize: object;
  unpackStruct: object;
  fileChunkReader: object;
}

const utils = {

  structSize: (structure: Map<any, any>) => {

    const fmt = '<' + Array.from(structure.values()).join("");
    return struct.sizeOf(fmt);

  },

  unpackStruct: (structure: Map<any, any>, buffer: Uint8Array, loc: number) : Map<any, any> => {

    const fmt = '<' + Array.from(structure.values()).join("");
    const values = struct.unpack(fmt, buffer, loc, true);

    //@ts-ignore
    return new Map (Array.from(structure.keys()).map((elem, index) => [elem, values[index]]));
  
  },

  fileChunkReader: (file, intervals: [number, number], callback) : void => {
    const fileReader = new FileReader();
  
    /*utils.fileReader*/fileReader.onloadend = (e) => {
      if (e.target.readyState == FileReader.DONE) {
        callback(e);
      }
    }
  
    const selectedBlob = file.slice(intervals[0], intervals[1] + 1);
  
    // utils.fileReader.readAsArrayBuffer(selectedBlob);
    fileReader.readAsArrayBuffer(selectedBlob);
    
  }

};

export default utils;