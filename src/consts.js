const utils = require('./utils.js');

const consts = {};

consts.VALID_FORMAT_SIGNATURE = [137, 72, 68, 70, 13, 10, 26, 10];

// Hashmaps with fields that point to its size in bytes
consts.SUPERBLOCK_V0 = {
  'format_signature': 8,

  'superblock_version': 1,
  'free_storage_version': 1,
  'root_group_version': 1,
  'reserved_0': 1,

  'shared_header_version': 1,
  'offset_size': 1,            // assume 8
  'length_size': 1,            // assume 8
  'reserved_1': 1,

  'group_leaf_node_k': 2,
  'group_internal_node_k': 2,

  'file_consistency_flags': 4,

  'base_address': 8,                  // assume 8 byte addressing
  'free_space_address': 8,            // assume 8 byte addressing
  'end_of_file_address': 8,           // assume 8 byte addressing
  'driver_information_address': 8,    // assume 8 byte addressing
}

consts.SYMBOL_TABLE_NODE = {
  'signature': 4,
  'version': 1,
  'reserved_0': 1,
  'symbols': 2,
}

consts.SYMBOL_TABLE_ENTRY = {
  'link_name_offset': 8,
  'object_header_address': 8,
  'cache_type': 4,
  'reserved': 4,
  'scratch': 16,
}

consts.SUPERBLOCK_V0_SIZE = utils.structSize(consts.SUPERBLOCK_V0);
consts.SYMBOL_TABLE_ENTRY_SIZE = utils.structSize(consts.SYMBOL_TABLE_ENTRY);

consts.OBJECT_HEADER_V1 = {
  'version': 1,
  'reserved': 1,
  'total_header_messages': 2,
  'object_reference_count': 4,
  'object_header_size': 4,
  'padding': 4,
}

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