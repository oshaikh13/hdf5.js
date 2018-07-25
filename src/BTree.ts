import utils from './utils';
import consts from './consts';
import struct from 'python-struct';
import { Buffer } from 'buffer/';
import { BTree, FileObj } from './interfaces';

const BTree = (fileObj: FileObj, offset: number, onReady) => {


  const readNode = (offset: number, callback) => {
    utils.fileChunkReader(fileObj._file, [offset, offset + utils.structSize(consts.B_LINK_NODE_V1) - 1], (e) => {

      const node = utils.unpackStruct(consts.B_LINK_NODE_V1, Buffer.from(e.target.result), 0);
      const startKeyAddressOffset = offset + utils.structSize(consts.B_LINK_NODE_V1);
      const endKeyAddressOffset = startKeyAddressOffset + ((node.get("entries_used") + 1) * 16) - 1;

      utils.fileChunkReader(fileObj._file, [startKeyAddressOffset, endKeyAddressOffset], (e) => {
        const keys = [];
        const addresses = [];
        let readFrom = 0;
        const keyAddressBuffer = Buffer.from(e.target.result);

        for (var i = 0; i < node.get("entries_used"); i++) {
          keys.push(struct.unpack('<Q', keyAddressBuffer, readFrom));
          readFrom += 8;
          addresses.push(struct.unpack('<Q', keyAddressBuffer, readFrom));
          readFrom += 8;
        }

        // n+1 key
        keys.push(struct.unpack('<Q', keyAddressBuffer, readFrom));
        node.set("keys", keys);
        node.set("addresses", addresses);

        callback(node);
      })

    })
  }

  readNode(offset, (rootNode) => {
    let nodeLevel = rootNode.get("node_level");
    bTreeObj.rootNode = rootNode;
    bTreeObj.allNodes = {};
    bTreeObj.allNodes[nodeLevel] = [bTreeObj.rootNode];

    while (nodeLevel != 0) {
      throw new Error("unimplemented")
    }

    onReady(bTreeObj);
  });

  const bTreeObj : BTree = {
    rootNode: null,
    allNodes: null,
    symbolTableAddresses: () => bTreeObj.allNodes[0]
      .reduce((a, b) => a.concat(...b.get("addresses")), [])
      .map((long) => long.toInt())
  };

  return bTreeObj;

}

export default BTree;