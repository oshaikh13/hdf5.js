const utils = require('./utils.js');
const consts = require('./consts.js');
const struct = require('python-struct');

const BTree = (fileObj, offset, onReady) => {


  const readNode = (offset, callback) => {
    utils.fileChunkReader(fileObj._file, [offset, offset + utils.structSize(consts.B_LINK_NODE_V1) - 1], (e) => {

      const node = utils.unpackStruct(consts.B_LINK_NODE_V1, Buffer.from(e.target.result), 0);
      const startKeyAddressOffset = offset + utils.structSize(consts.B_LINK_NODE_V1);
      const endKeyAddressOffset = startKeyAddressOffset + (node.get("entries_used") * 32) - 1;

      utils.fileChunkReader(fileObj._file, [startKeyAddressOffset, endKeyAddressOffset], (e) => {
        const keys = [];
        const addresses = [];
        let readFrom = 0;
        const keyAddressBuffer = Buffer.from(e.target.result);
        for (var i = 0; i < node.get("entries_used"); i++) {
          keys.push(struct.unpack('<QQ', keyAddressBuffer, readFrom));
          readFrom += 16;
          addresses.push(struct.unpack('<QQ', keyAddressBuffer, readFrom));
          readFrom += 16;
        }
        node.set("keys", keys);
        node.set("addresses", addresses);
        callback(node);
      })

    })
  }

  const bTreeObj = {};
  
  // reads the root node, offset is the start of the BTree.
  // start = root node
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
}

module.exports = BTree;