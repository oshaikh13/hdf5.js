
var VALID_FORMAT_SIGNATURE = [137, 72, 68, 70, 13, 10, 26, 10];

// Hashmaps with fields that point to its size in bytes
var SUPERBLOCK_V0 = {
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

var SYMBOL_TABLE_NODE = {
  'signature': 4,
  'version': 1,
  'reserved_0': 1,
  'symbols': 2,
}

var SYMBOL_TABLE_ENTRY = {
  'link_name_offset': 8,
  'object_header_address': 8,
  'cache_type': 4,
  'reserved': 4,
  'scratch': 16,
}

var SUPERBLOCK_V0_SIZE = structSize(SUPERBLOCK_V0);
