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
  
  B_LINK_NODE_V1: new Map([
    ['signature', '4s'],
  
    ['node_type', 'B'],
    ['node_level', 'B'],
    ['entries_used', 'H'],
  
    ['left_sibling', 'Q'],     // # 8 byte addressing
    ['right_sibling', 'Q'],    // # 8 byte addressing
  ]),

};



export default consts;