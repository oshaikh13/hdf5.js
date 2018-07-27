import utils from './utils';
import consts from './consts';
import { Buffer } from 'buffer/';
import { SuperBlock, SymbolTable, Heap } from './interfaces';
import FileObj from './highLevel';

// Low level API's for HDF5 reader
                  // UINT   8
const lowLevel = {

  SuperBlock: (fileObj: FileObj, offset: number, callback) : SuperBlock => {

    var superBlockObject = <SuperBlock>{};

    utils.fileChunkReader(fileObj._file, [offset + 8, offset + 8], (e) => {

      const versionHint = Buffer.from(e.target.result)[0];
      console.log ("SUPERBLOCK V" + versionHint);

      utils.fileChunkReader(fileObj._file, [offset, offset + utils.structSize(consts.SUPERBLOCK_V0) - 1], (e) => {

        const superBlockBuffer = Buffer.from(e.target.result);
        superBlockObject.contents = utils.unpackStruct(consts.SUPERBLOCK_V0, superBlockBuffer, offset);
  
        if (consts.VALID_FORMAT_SIGNATURE != superBlockObject.contents.get('format_signature')) {
          throw new Error("Invalid HDF5 file provided!");
        }
      
        if (superBlockObject.contents.get('offset_size') != 8 || superBlockObject.contents.get('length_size') != 8) {
          throw new Error("File uses non 64-bit addressing.");
        }
      
        superBlockObject.endOfBlock = offset + utils.structSize(consts.SUPERBLOCK_V0);
        superBlockObject._rootSymbolTable = lowLevel.SymbolTable(fileObj, 
          superBlockObject.endOfBlock, true, () => {
            callback(superBlockObject);  
        });
  
      }); 

    });



    return superBlockObject;
  },

  /**
   * A SymbolTable loader.
   * rootGroup - is this the rootgroup? - boolean
   *
   */
  SymbolTable: (fileObj: FileObj, offset: number, rootGroup: boolean, callback) : SymbolTable => {

    var symTableObj = <SymbolTable>{};
  
    const readSymTableNode = (offset: number, rootgroup: boolean, callback) => {
      if (rootgroup) {
        // No header, one entry
        callback(new Map([
          ['symbols', 1]
        ]), offset);
  
      } else {
        utils.fileChunkReader(fileObj._file, [offset, offset + utils.structSize(consts.SYMBOL_TABLE_NODE) - 1], (e) => {
          const node = utils.unpackStruct(consts.SYMBOL_TABLE_NODE, Buffer.from(e.target.result), 0);
          const nextOffset = offset + utils.structSize(consts.SYMBOL_TABLE_NODE);
          callback(node, nextOffset);
        });
      }
    }
  
  
    readSymTableNode(offset, rootGroup, (node: Map<string, any>, nextOffset: number) => {
      // nextOffset targets positions for the upcoming symbol table entries
      const endOffset = nextOffset + (utils.structSize(consts.SYMBOL_TABLE_ENTRY) * node.get('symbols')) - 1;
  
      utils.fileChunkReader(fileObj._file, [nextOffset, endOffset], (e) => {
        const nodeEntryBuffer = Buffer.from(e.target.result);
        let readFrom = 0;
        let entries = [];
        for (var i = 0; i < node.get('symbols'); i++) {
          entries.push(utils.unpackStruct(consts.SYMBOL_TABLE_ENTRY, nodeEntryBuffer, readFrom));
          readFrom += utils.structSize(consts.SYMBOL_TABLE_ENTRY);
        }
      
        if (rootGroup) symTableObj.groupOffset = entries[0].get('object_header_address').toInt(); 
      
        symTableObj.entries = entries;
        symTableObj._contents = node;
        callback(symTableObj);
  
      });
    });
  
    symTableObj.assignName = (heap: Heap) => {
      symTableObj.entries.forEach((entry) => {
        const offset = entry.get("link_name_offset");
        const linkName = heap.getObjectName(offset).toString();
        entry.set("link_name", linkName);
      })
    }
  
    symTableObj.getLinks = () => symTableObj.entries.reduce((a, b) : object => {
      a[b.get("link_name")] = b.get("object_header_address");
      return a;
    }, {});
  
    return symTableObj;
  
  },

  Heap: (fileObj: FileObj, offset: number, onReady): Heap => {

    const heapObj = <Heap>{};
  
    utils.fileChunkReader(fileObj._file, [offset, offset + utils.structSize(consts.LOCAL_HEAP) - 1], (e) => {
      const fileBuffer = Buffer.from(e.target.result);
      const localHeap = utils.unpackStruct(consts.LOCAL_HEAP, fileBuffer, 0);
      if (localHeap.get("signature") != "HEAP") {}; /* throw something */
      if (localHeap.get("version") != 0) {}; /* throw something */
      const dataSegmentAddress = localHeap.get("address_of_data_segment");
  
      utils.fileChunkReader(fileObj._file, [dataSegmentAddress.toInt(), 
                                            dataSegmentAddress.toInt() + localHeap.get("data_segment_size").toInt() - 1], (e) => {
        const heapDataBuffer = Buffer.from(e.target.result);
        heapObj._contents = localHeap;
        heapObj.data = heapDataBuffer;
        onReady(heapObj);
      })
      
    })
  
    heapObj.getObjectName = (offset: number) : Uint8Array => {
      const end = heapObj.data.indexOf(0, offset);
      return heapObj.data.slice(offset, end);
    }
  
    return heapObj;
  }

}

export default lowLevel;