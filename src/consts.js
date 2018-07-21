const utils = require('./utils.js');

const consts = {};

consts.VALID_FORMAT_SIGNATURE = [137, 72, 68, 70, 13, 10, 26, 10];

// Hashmaps with fields that point to its size in bytes
consts.SUPERBLOCK_V0 = new Map ([
  ['format_signature', '8s'],

  ['superblock_version', 'B'],
  ['free_storage_version', 'B'],
  ['root_group_version', 'B'],
  ['reserved_0', 'B'],

  ['shared_header_version', 'B'],
  ['offset_size', 'B'],            // assume 8
  ['length_size', 'B'],            // assume 8
  ['reserved_1', 'B'],

  ['group_leaf_node_k', 'H'],
  ['group_internal_node_k', 'H'],

  ['file_consistency_flags', 'L'],

  ['base_address', 'Q'],                  // assume 8 byte addressing
  ['free_space_address', 'Q'],            // assume 8 byte addressing
  ['end_of_file_address', 'Q'],           // assume 8 byte addressing
  ['driver_information_address', 'Q'],    // assume 8 byte addressing

]);

consts.SYMBOL_TABLE_NODE = new Map([
  ['signature', '4s'],
  ['version', 'B'],
  ['reserved_0', 'B'],
  ['symbols', 'H'],
]);

consts.SYMBOL_TABLE_ENTRY = new Map([
  ['link_name_offset', 'Q'],     // # 8 byte address
  ['object_header_address', 'Q'],
  ['cache_type', 'I'],
  ['reserved', 'I'],
  ['scratch', '16s'],
])

consts.SUPERBLOCK_V0_SIZE = utils.structSize(consts.SUPERBLOCK_V0);
consts.SYMBOL_TABLE_ENTRY_SIZE = utils.structSize(consts.SYMBOL_TABLE_ENTRY);

consts.OBJECT_HEADER_V1 = new Map([
  ['version', 'B'],
  ['reserved', 'B'],
  ['total_header_messages', 'H'],
  ['object_reference_count', 'I'],
  ['object_header_size', 'I'],
  ['padding', 'I'],
])

consts.HEADER_MSG_INFO_V1 = {
  'type': 2,
  'size': 2,
  'flags': 1,
  'reserved': 3,
}

consts.SYMBOL_TABLE_MSG = {
  'btree_address': 8, // assume 8 byte addressing
  'heap_address': 8 // assume 8 byte addressing
}

consts.OBJECT_HEADER_V1_SIZE = utils.structSize(consts.OBJECT_HEADER_V1);

consts.OBJECT_CONTINUATION_MSG_TYPE = 0x0010;
consts.SYMBOL_TABLE_MSG_TYPE = 0x0011

module.exports = consts;