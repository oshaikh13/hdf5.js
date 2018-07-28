import utils from './utils';
import consts from './consts';
import struct from 'python-struct';
import { Buffer } from 'buffer/';
import lowLevel from './lowLevel';
import BTree from './BTree';
import { DataObj, BTree as BTreeInterface, Heap, SymbolTable } from './interfaces';
import FileObj from './highLevel';
import DataTypeMessage from './DatatypeMessage';
import DatatypeMessage from './DatatypeMessage';

var DataObjects = (fileObj: FileObj, offset: number, onReadyCallback) : DataObj => {
  
  const dataObj = <DataObj>{};

  const setUpObject = (msgData: Uint8Array, unpackedHeaderObj: Map<string, any>, msgs: Array<Map<string, any>>) : void => {
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
  const readObjectHeader = (version: number) : void => {
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
          dataObj.parseV1Objects(msgData, unpackedHeaderObj, (msgs: Array<Map<string, any>>, newMessageData: Uint8Array) => {
            setUpObject(newMessageData, unpackedHeaderObj, msgs)
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

  dataObj.parseV1Objects = function (msgBytes: Uint8Array, unpackedHeaderObj: Map<string, any>, callback) : void {

    var offset = 0;
    const msgs = [];
    const size = unpackedHeaderObj.get('total_header_messages');

    const loadMessages = function(current) {

      if (current === size) {
        callback(msgs, msgBytes);
        return;
      }

      const currentMsg = utils.unpackStruct(consts.HEADER_MSG_INFO_V1, msgBytes, offset);
      currentMsg.set("offset_to_message", offset + 8);

      if (currentMsg.get("type") === consts.OBJECT_CONTINUATION_MSG_TYPE) {
        var unpacked = struct.unpack('<QQ', msgBytes, offset + 8);
        utils.fileChunkReader(fileObj._file, [unpacked[0].toInt(), unpacked[0].toInt() + unpacked[1].toInt() - 1], (e) => {
          offset += 8 + currentMsg.get('size');
          msgs[current] = currentMsg;
          msgBytes = Buffer.concat([msgBytes, Buffer.from(e.target.result)]);
          loadMessages(++current);
        })
      } else {
        msgs[current] = currentMsg;
        offset += 8 + currentMsg.get('size');
        loadMessages(++current);

      }
      
    }

    loadMessages(0);

  }

  dataObj.findMessageTypes = (msgType: number) : Map<string, any>[] => {
    return dataObj.msgs.filter(msg => msg.get("type") === msgType)
  }

  dataObj.getLinks = (callback) => {
    const symTableMessages = dataObj.findMessageTypes(consts.SYMBOL_TABLE_MSG_TYPE)
    if (symTableMessages.length) {
      dataObj._getSymbolTableLinks(symTableMessages, (links) => {
        callback(links);
      });
    }
  }

  dataObj.getAttributes = () => {
    const attrs = {};
    const attrMsgs = dataObj.findMessageTypes(consts.ATTRIBUTE_MSG_TYPE);
    attrMsgs.forEach(msg => {
      const offset = msg.get("offset_to_message");
      const { name, value } = dataObj.unpackAttr(offset);
      attrs[name] = value;
    });
    return attrs;
  }

  dataObj.unpackAttr = (offset: number) => {
    const version = struct.unpack('<B', dataObj.msg_data, offset)[0];
    let currentAttrs;
    let paddingMultiple;

    if (version === 1) {
      currentAttrs = utils.unpackStruct(consts.ATTR_MSG_HEADER_V1, dataObj.msg_data, offset);
      offset += utils.structSize(consts.ATTR_MSG_HEADER_V1);
      paddingMultiple = 8;
    } else throw new Error("unimplemented");

    const nameSize = currentAttrs.get("name_size");
    const name = dataObj.msg_data.slice(offset, offset + nameSize).toString();
    offset += utils.paddedSize(nameSize, paddingMultiple);

    const dataType = new DataTypeMessage(dataObj.msg_data, offset);

    return {
      name: "debug",
      value: 0
    };
  }

  dataObj._getSymbolTableLinks = (symTableMessages: Array<Map<string, any>>, callback) : void => {
    
    let heap;
    let bTree;

    if (symTableMessages.length != 1) {} /* throw something */;
    if (symTableMessages[0].get("size") != 16) {} /* throw something */;

    const symbolTableMessage = utils.unpackStruct(consts.SYMBOL_TABLE_MSG, dataObj.msg_data,
      symTableMessages[0].get("offset_to_message"));

    const updateSymTables = (heap: Heap, bTree: BTreeInterface) : void => {

      if (!heap || !bTree) return;

      const symbolTableAddresses = bTree.symbolTableAddresses();

      let links = {};
      let completed = 0;
      let totalSymTables = symbolTableAddresses.length;
      if (!totalSymTables) callback(links);
      symbolTableAddresses.forEach((addr: number) => {
        lowLevel.SymbolTable(fileObj, addr, false, (symTable: SymbolTable) => {
          symTable.assignName(heap);
          // stage 3 proposal for object destructuring isn't supported :(
          links = Object.assign(symTable.getLinks(), links);
          
          if (++completed === totalSymTables) callback(links);
        });
      })
      
    }

    lowLevel.Heap(fileObj, symbolTableMessage.get("heap_address").toInt(), (heapObj: Heap) => {
      heap = heapObj;
      updateSymTables(heap, bTree);
    });

    BTree(fileObj, symbolTableMessage.get("btree_address").toInt(), (bTreeObj: BTreeInterface) => {
      bTree = bTreeObj;
      updateSymTables(heap, bTree);
    });
    
  }

  return dataObj;
}

export default DataObjects;