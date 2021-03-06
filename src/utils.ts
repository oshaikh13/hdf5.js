import struct from 'python-struct';

const utils = {

  structSize: (structure: Map<string, string>) : number => {

    const fmt = '<' + Array.from(structure.values()).join("");
    return struct.sizeOf(fmt);

  },

  unpackStruct: (structure: Map<string, string>, buffer: Uint8Array, loc: number) : Map<string, any> => {

    const fmt = '<' + Array.from(structure.values()).join("");
    const values = struct.unpack(fmt, buffer, loc, true);

    //@ts-ignore
    return new Map (Array.from(structure.keys()).map((elem, index) => [elem, values[index]]));
  
  },

  fileChunkReader: (file: File, intervals: [number, number], callback) : void => {
    const fileReader = new FileReader();
  
    /*utils.fileReader*/fileReader.onloadend = (e) => {
      if (e.target.readyState == FileReader.DONE) {
        callback(e);
      }
    }
  
    const selectedBlob = file.slice(intervals[0], intervals[1] + 1);
  
    // utils.fileReader.readAsArrayBuffer(selectedBlob);
    fileReader.readAsArrayBuffer(selectedBlob);
    
  },

  paddedSize: (size: number, paddingMultiple = 8) : number => {
    return Math.floor(Math.ceil(size / paddingMultiple) * paddingMultiple);
  }
};

export class Reference {
  addressOfReference: number;
  constructor(addressOfReference: number) { this.addressOfReference = addressOfReference };
  isEmpty () : boolean {
    return !!this.addressOfReference;
  }
}

export default utils;