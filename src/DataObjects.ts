import utils from './utils';
import consts from './consts';
import struct from 'python-struct';
import { Buffer } from 'buffer/';
import lowLevel from './lowLevel';
import BTree from './BTree';
import { FileObj, DataObj } from './interfaces';


var DataObjects = (fileObj: FileObj, offset: number, onReadyCallback) => {
  
  const dataObj = <DataObj>{};

  const setUpObject = (msgData: Uint8Array, unpackedHeaderObj: Map<string, any>, msgs: Array<Map<string, any>>) => {
      dataObj.msgs = msgs;
      dataObj.msg_data = msgData;

      // this is the offset passed initially to DataObjects
      dataObj.offset = offset;
      dataObj._globl_heaps = {};
      dataObj.header = unpackedHeaderObj;

      // cached attributes
      dataObj._filter_pipeline = null;
      dataObj._chunk_params_set = false;
      dataObj._chunks = null;
      dataObj._chunk_dims = null;
      dataObj._chunk_address = null;

      onReadyCallback();
  }

  // TODO: arg version is currently unused.
  // Implement dataobj version x, y, z, etc.
  const readObjectHeader = (version: number) => {
    utils.fileChunkReader(fileObj._file, 
                          [offset, offset + utils.structSize(consts.OBJECT_HEADER_V1)],
    (e) => {
    
      const dataObjHeaderBytes = Buffer.from(e.target.result);  

      // the start loc is 0 because we're reading from the start of a slice

      if (version === 1) {

        const unpackedHeaderObj = 
          utils.unpackStruct(consts.OBJECT_HEADER_V1, dataObjHeaderBytes, 0);
  
        utils.fileChunkReader(fileObj._file, 
          [offset + utils.structSize(consts.OBJECT_HEADER_V1), 
           offset + utils.structSize(consts.OBJECT_HEADER_V1) + unpackedHeaderObj.get("object_header_size") - 1],
        (e) => {
          const msgData = Buffer.from(e.target.result);
          dataObj.parseV1Objects(msgData, unpackedHeaderObj, (msgs) => {
            setUpObject(msgData, unpackedHeaderObj, msgs)
          });
        });

      }


    });
  }

  // read the first byte at the offset to see the version of the dataobject
  utils.fileChunkReader(fileObj._file, [offset, offset], (e) => {
    var loadedFile = e.target.result;
    const version = Buffer.from(loadedFile)[0];
    // RIGHT NOW, WE DEAL WITH ONLY V1s
    readObjectHeader(version); 
  });

  // method definitions

  dataObj.parseV1Objects = function (msgBytes: Uint8Array, unpackedHeaderObj: Map<string, any>, callback) {

    var offset = 0;
    var msgs = [];
    var completed = 0;
    for (var i = 0; i < unpackedHeaderObj.get("total_header_messages"); i++) {
      const currentMsg = utils.unpackStruct(consts.HEADER_MSG_INFO_V1, msgBytes, offset);
      currentMsg.set("offset_to_message", offset + 8);
      if (currentMsg.get("type") === consts.OBJECT_CONTINUATION_MSG_TYPE) {
        var unpacked = struct.unpack('<QQ', msgBytes, offset + 8);
        throw new Error("unimplemented");
      } else {
        msgs.push(currentMsg);
        offset += 8 + currentMsg.size;
      }
    }

    callback(msgs);

  }

  dataObj.findMessageTypes = (msgType) => {
    return dataObj.msgs.filter(msg => msg.get("type") === msgType)
  }

  dataObj.getLinks = () => {
    const symTableMessages = dataObj.findMessageTypes(consts.SYMBOL_TABLE_MSG_TYPE)
    if (symTableMessages.length) {
      dataObj._getSymbolTableLinks(symTableMessages, (links) => {
        console.log(links);
      });
    }
  }

  dataObj._getSymbolTableLinks = (symTableMessages: Array<any>, callback) => {
    
    let heap;
    let bTree;

    if (symTableMessages.length != 1) {} /* throw something */;
    if (symTableMessages[0].get("size") != 16) {} /* throw something */;

    const symbolTableMessage = utils.unpackStruct(consts.SYMBOL_TABLE_MSG, dataObj.msg_data,
      symTableMessages[0].get("offset_to_message"));

    const updateSymTables = (heap, bTree) => {

      if (!heap || !bTree) return;

      const symbolTableAddresses = bTree.symbolTableAddresses();

      let links = {};
      let completed = 0;
      let totalSymTables = symbolTableAddresses.length;

      symbolTableAddresses.forEach((addr) => {
        lowLevel.SymbolTable(fileObj, addr, false, (symTable) => {
          symTable.assignName(heap);

          // stage 3 proposal for object destructuring isn't supported :(
          links = Object.assign(symTable.getLinks(), links);
          
          if (++completed === totalSymTables) callback(links);
        });
      })
      
    }

    lowLevel.Heap(fileObj, symbolTableMessage.get("heap_address").toInt(), (heapObj) => {
      heap = heapObj;
      updateSymTables(heap, bTree);
    });

    BTree(fileObj, symbolTableMessage.get("btree_address").toInt(), (bTreeObj) => {
      bTree = bTreeObj;
      updateSymTables(heap, bTree);
    });
    
  }

  return dataObj;
}

export default DataObjects;