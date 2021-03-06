import { Buffer } from 'buffer/';

const consts = {
  VALID_FORMAT_SIGNATURE: Buffer.from([137, 72, 68, 70, 13, 10, 26, 10]).toString(),

  SUPERBLOCK_V0: new Map ([
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
  
  ]),

  SYMBOL_TABLE_NODE: new Map([
    ['signature', '4s'],
    ['version', 'B'],
    ['reserved_0', 'B'],
    ['symbols', 'H'],
  ]),

  SYMBOL_TABLE_ENTRY: new Map([
    ['link_name_offset', 'Q'],     // # 8 byte address
    ['object_header_address', 'Q'],
    ['cache_type', 'I'],
    ['reserved', 'I'],
    ['scratch', '16s'],
  ]),

  OBJECT_HEADER_V1: new Map([
    ['version', 'B'],
    ['reserved', 'B'],
    ['total_header_messages', 'H'],
    ['object_reference_count', 'I'],
    ['object_header_size', 'I'],
    ['padding', 'I'],
  ]),
  
  HEADER_MSG_INFO_V1: new Map([
    ['type', 'H'],
    ['size', 'H'],
    ['flags', 'B'],
    ['reserved', '3s'],
  ]),
  
  SYMBOL_TABLE_MSG: new Map([
    ['btree_address', 'Q'],     // 8 bytes addressing
    ['heap_address', 'Q'],      // 8 byte addressing
  ]),
  
  LOCAL_HEAP: new Map([
    ['signature', '4s'],
    ['version', 'B'],
    ['reserved', '3s'],
    ['data_segment_size', 'Q'],         // 8 byte size of lengths
    ['offset_to_free_list', 'Q'],       // 8 bytes size of lengths
    ['address_of_data_segment', 'Q'],   // 8 byte addressing
  ]),


  OBJECT_CONTINUATION_MSG_TYPE: 0x0010,
  SYMBOL_TABLE_MSG_TYPE: 0x0011,
  ATTRIBUTE_MSG_TYPE: 0x000C,
  
  ATTR_MSG_HEADER_V1: new Map([
    ['version', 'B'],
    ['reserved', 'B'],
    ['name_size', 'H'],
    ['datatype_size', 'H'],
    ['dataspace_size', 'H'],
  ]),

  B_LINK_NODE_V1: new Map([
    ['signature', '4s'],
  
    ['node_type', 'B'],
    ['node_level', 'B'],
    ['entries_used', 'H'],
  
    ['left_sibling', 'Q'],     // # 8 byte addressing
    ['right_sibling', 'Q'],    // # 8 byte addressing
  ]),

  DATATYPE_MSG: new Map([
    ['class_and_version', 'B'],
    ['class_bit_field_0', 'B'],
    ['class_bit_field_1', 'B'],
    ['class_bit_field_2', 'B'],
    ['size', 'I'],
  ]),

  COMPOUND_PROP_DESC_V1: new Map([
    ['offset', 'I'],
    ['dimensionality', 'B'],
    ['reserved_0', 'B'],
    ['reserved_1', 'B'],
    ['reserved_2', 'B'],
    ['permutation', 'I'],
    ['reserved_3', 'I'],
    ['dim_size_1', 'I'],
    ['dim_size_2', 'I'],
    ['dim_size_3', 'I'],
    ['dim_size_4', 'I'],
  ]),

  DATATYPE_FIXED_POINT: 0,
  DATATYPE_FLOATING_POINT: 1,
  DATATYPE_TIME: 2,
  DATATYPE_STRING: 3,
  DATATYPE_BITFIELD: 4,
  DATATYPE_OPAQUE: 5,
  DATATYPE_COMPOUND: 6,
  DATATYPE_REFERENCE: 7,
  DATATYPE_ENUMERATED: 8,
  DATATYPE_VARIABLE_LENGTH: 9,
  DATATYPE_ARRAY: 10,
  DATASPACE_MSG_TYPE: 0x0001,
  DATA_STORAGE_MSG_TYPE: 0x0008,
  DATATYPE_MSG_TYPE: 0x0003,


  DATASPACE_MSG_HEADER_V1: new Map([
    ['version', 'B'],
    ['dimensionality', 'B'],
    ['flags', 'B'],
    ['reserved_0', 'B'],
    ['reserved_1', 'I'],
  ]),

  DATASPACE_MSG_HEADER_V2: new Map([
    ['version', 'B'],
    ['dimensionality', 'B'],
    ['flags', 'B'],
    ['type', 'B'],
  ]),

  GLOBAL_HEAP_ID: new Map([
    ['collection_address', 'Q'],
    ['object_index', 'I'],
  ]),

  GLOBAL_HEAP_HEADER: new Map([
    ['signature', '4s'],
    ['version', 'B'],
    ['reserved', '3s'],
    ['collection_size', 'Q'],
  ]),

  GLOBAL_HEAP_OBJECT: new Map([
    ['object_index', 'H'],
    ['reference_count', 'H'],
    ['reserved', 'I'],
    ['object_size', 'Q']    
  ])

};



export default consts;