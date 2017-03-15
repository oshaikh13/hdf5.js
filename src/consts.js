
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

  'base_address': 4,                  // assume 8 byte addressing
  'free_space_address': 4,            // assume 8 byte addressing
  'end_of_file_address': 4,           // assume 8 byte addressing
  'driver_information_address': 4,    // assume 8 byte addressing
}