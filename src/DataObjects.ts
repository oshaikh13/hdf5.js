import utils, { Reference } from './utils';
import consts from './consts';
import struct from 'python-struct';
import { Buffer } from 'buffer/';
import lowLevel, { GlobalHeap } from './lowLevel';
import BTree from './BTree';
import { DataObj, BTree as BTreeInterface, Heap, SymbolTable } from './interfaces';
import FileObj from './highLevel';
import DatatypeMessage from './DatatypeMessage';

var DataObjects = (fileObj: FileObj, offset: number, onReadyCallback) : DataObj => {
  
  const dataObj = <DataObj>{};

  const setUpObject = (msgData: Uint8Array, unpackedHeaderObj: Map<string, any>, msgs: Array<Map<string, any>>) : void => {
      dataObj.msgs = msgs;
      dataObj.msg_data = msgData;

      // this is the offset passed initially to DataObjects
      dataObj.offset = offset;
      dataObj._global_heaps = {};
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

    const dataType = new DatatypeMessage(dataObj.msg_data, offset).datatype;
    offset += utils.paddedSize(currentAttrs.get("datatype_size"), paddingMultiple);

    const shape = dataObj.determineDataShape(dataObj.msg_data, offset);
    const items = shape.reduce((a, b) => a * b, 1);
    offset += utils.paddedSize(currentAttrs.get('dataspace_size'), paddingMultiple);
    dataObj._attrValue(dataType, dataObj.msg_data, items, offset, (value) => {
      // console.log(name, value);
    })

    return {
      name: "debug",
      value: 0
    };
  }

  dataObj._vlenSizeAndData = (buffer: Uint8Array, offset: number, currentIdx: number, callback) => {
    const vlenSize = struct.unpack('<I', buffer, offset)[0]

    const gheapId = utils.unpackStruct(consts.GLOBAL_HEAP_ID, buffer, offset + 4);

    const loadVlenSizeAndDataFromHeap = (gheapAddress) => {
      const gheap : GlobalHeap = dataObj._global_heaps[gheapAddress];
      const vlenData = gheap.objects().get(gheapId.get('object_index'));
      callback(currentIdx, {vlenSize, vlenData});
    }

    const gheapAddress = gheapId.get('collection_address').toInt();
    console.log(gheapAddress + " ADDR");
    
    if (!dataObj._global_heaps[gheapAddress]) {
      const gheap = new GlobalHeap(fileObj, offset, () => {
        console.log(gheap);
        dataObj._global_heaps[gheapAddress] = gheap;
        loadVlenSizeAndDataFromHeap(gheapAddress);
      })
    } else loadVlenSizeAndDataFromHeap(gheapAddress);

  }

  dataObj._attrValue = (datatype, buffer: Uint8Array, count: number, offset: number, callback) => {
    const value = [];
    let completed = 0;
    if (datatype instanceof Array && datatype.length >= 2) {
      console.log (datatype);
      const checkComplete = () => {
        
        if (++completed === count){
          callback(value);
        } 
      }

      const dataTypeClass = datatype[0];
      for (var i = 0; i < count; i++) {
        if (dataTypeClass === "VLEN_STRING") {
          const character_set = datatype[2];
          console.log("READING VLEN_STRING: " + offset);
          dataObj._vlenSizeAndData(buffer, offset, i, (currentIdx, vlenInfo) => {
            console.log("HAI HO");
            console.log(currentIdx, vlenInfo);
            if (character_set === 0) value[currentIdx] = vlenInfo.vlenData;
            else value[currentIdx] = vlenInfo.vlenData.toString();
            checkComplete();
          });
          offset += 16;
        } else if (dataTypeClass === "REFERENCE") {
          console.log("READING REFERENCE: " + offset);
          const address = struct.unpack('<Q', buffer, offset)[0]
          value[i] = new Reference(address);
          offset += 8;
          checkComplete();
        } else if (dataTypeClass === "VLEN_SEQUENCE") {
          console.log("READING VLEN_SEQ: " + offset);
          const baseType = datatype[1]
          dataObj._vlenSizeAndData(buffer, offset, i, (currentIdx, vlenInfo) => {
            dataObj._attrValue(baseType, vlenInfo.vlenData, vlenInfo.vlenSize, 0, (attrValue) => {
              value[currentIdx] = attrValue;
              checkComplete();
            })
          })
          offset += 16
        } else throw new Error("unimplemented");
      }

    } else {
      callback(struct.unpack(datatype, buffer, offset));
    } 

  }

  dataObj.determineDataShape = (buffer: Uint8Array, offset: number) : Array<any> => {
    const version = struct.unpack('<B', buffer, offset)[0];
    let header;
    if (version == 1) {
      header = utils.unpackStruct(consts.DATASPACE_MSG_HEADER_V1, buffer, offset)
      offset += utils.structSize(consts.DATASPACE_MSG_HEADER_V1);
    } else if (version == 2) {
      header = utils.unpackStruct(consts.DATASPACE_MSG_HEADER_V2, buffer, offset)
      offset += utils.structSize(consts.DATASPACE_MSG_HEADER_V2)
    } else throw new Error('unknown dataspace message version');

    const ndims = header.get('dimensionality');
    const dimSizes = struct.unpack('<' + 'Q'.repeat(ndims), buffer, offset)

    return dimSizes
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