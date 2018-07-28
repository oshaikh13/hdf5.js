import utils from './utils';
import consts from './consts';

export default class DatatypeMessage {

  buffer: Uint8Array;
  offset: number;
  datatype: any;

  constructor(buffer, offset) {
    this.buffer = buffer;
    this.offset = offset;
    this.datatype = this.determineDatatype();
  }

  determineDatatype() {
    const datatypeMsg = utils.unpackStruct(consts.DATATYPE_MSG, this.buffer, this.offset);
    this.offset += utils.structSize(consts.DATATYPE_MSG);

    const datatypeClass = datatypeMsg.get('class_and_version') & 0x0F;

    if (datatypeClass == consts.DATATYPE_FIXED_POINT)
      return this._determineFixedPointDatatype(datatypeMsg)
    else if (datatypeClass == consts.DATATYPE_FLOATING_POINT)
        return this._determineFloatingPointDatatype(datatypeMsg);
    else if (datatypeClass == consts.DATATYPE_TIME)
        throw new Error("Time datatype class not supported.")
    else if (datatypeClass == consts.DATATYPE_STRING)
        return DatatypeMessage._determineStringDatatype(datatypeMsg);
    else if (datatypeClass == consts.DATATYPE_BITFIELD)
        throw new Error("Bitfield datatype class not supported.")
    else if (datatypeClass == consts.DATATYPE_OPAQUE)
        throw new Error("Opaque datatype class not supported.")
    else if (datatypeClass == consts.DATATYPE_COMPOUND)
        return this._determineCompoundDatatype(datatypeMsg);
    else if (datatypeClass == consts.DATATYPE_REFERENCE)
        return ['REFERENCE', datatypeMsg['size']]
    else if (datatypeClass == consts.DATATYPE_ENUMERATED)
        throw new Error("Enumerated datatype class not supported.")
    else if (datatypeClass == consts.DATATYPE_ARRAY)
        throw new Error("Array datatype class not supported.")
    else if (datatypeClass == consts.DATATYPE_VARIABLE_LENGTH) {
        let vlen_type = DatatypeMessage._determineVlenDatatype(datatypeMsg);
        if (vlen_type[0] == 'VLEN_SEQUENCE') {
          const base_type = this.determineDatatype()
          vlen_type = ['VLEN_SEQUENCE', base_type]
        }
        return vlen_type
    }

    throw new Error ('Invalid datatype class: '+ (datatypeClass));

  }

  _determineFixedPointDatatype(datatypeMsg: Map<string, any>) : string {
    const lengthInBytes: number = datatypeMsg.get("size");
    if (![1, 2, 4, 8].includes(lengthInBytes))
      throw new Error("Unsupported datatype size");

    const signed = datatypeMsg.get('class_bit_field_0') & 0x08;

    let datatypeChar: string;
    if (signed > 0) datatypeChar = 'i';
    else datatypeChar = 'u';

    const byteOrder = datatypeMsg.get('class_bit_field_0') & 0x01;

    let byteOrderChar: string;
    if (byteOrder == 0) byteOrderChar = '<';
    else byteOrderChar = '>';

    this.offset += 4

    return byteOrderChar + datatypeChar + lengthInBytes;
  }

  _determineFloatingPointDatatype(datatypeMsg: Map<string, any>) : string {
    const lengthInBytes: number = datatypeMsg.get("size");
    if (![1, 2, 4, 8].includes(lengthInBytes))
      throw new Error("Unsupported datatype size");

    const datatypeChar = "f";

    const byteOrder = datatypeMsg.get('class_bit_field_0') & 0x01;

    let byteOrderChar: string;
    if (byteOrder == 0) byteOrderChar = '<';
    else byteOrderChar = '>';

    this.offset += 12

    return byteOrderChar + datatypeChar + lengthInBytes;
  }

  static _determineStringDatatype (datatypeMsg: Map<string, any>) : string {
    return 'S' + datatypeMsg.get('size');
  }

  _determineCompoundDatatype (datatypeMsg: Map<string, any>) {
    const bitField0 = datatypeMsg.get('class_bit_field_0');
    const bitField1 = datatypeMsg.get('class_bit_field_1');

    const nComp = bitField0 + (bitField1 << 4)

    // # read in the members of the compound datatype
    const members = []
    for (var i = 0; i < nComp; i++) {
      const nullLocation = this.buffer.indexOf(0, this.offset);
      const nameSize = utils.paddedSize(nullLocation - this.offset, 8)
      const name = this.buffer.slice(this.offset, this.offset + nameSize).toString();
      this.offset += nameSize;

      const propDesc = utils.unpackStruct(
        consts.COMPOUND_PROP_DESC_V1, this.buffer, this.offset)
      
      this.offset += utils.structSize(consts.COMPOUND_PROP_DESC_V1);

      const compDatatype = this.determineDatatype();
      members.push([name, propDesc, compDatatype])
    }

    // # determine if the compound dtype is complex64/complex128
    if (members.length == 2) {
      const [name1, prop1, dtype1] = members[0]
      const [name2, prop2, dtype2] = members[1]
      const namesValid = (name1[0] == 'r' && name2[0] == 'i');

      const complexDtypeMap = {
          '>f4': '>c8',
          '<f4': '<c8',
          '>f8': '>c16',
          '<f8': '<c16',
      }

      const dtypesValid = (dtype1 == dtype2) && complexDtypeMap[dtype1];
      const half = Math.floor(datatypeMsg.get('size') / 2);
      const offsetsValid = (prop1.get('offset') == 0 && prop2.get('offset') == half)
      const propsValid = (
          prop1.get('dimensionality') == 0 &&
          prop1.get('permutation') == 0 &&
          prop1.get('dim_size_1') == 0 &&
          prop1.get('dim_size_2') == 0 &&
          prop1.get('dim_size_3') == 0 &&
          prop1.get('dim_size_4') == 0 &&
          prop2.get('dimensionality') == 0 &&
          prop2.get('permutation') == 0 &&
          prop2.get('dim_size_1') == 0 &&
          prop2.get('dim_size_2') == 0 &&
          prop2.get('dim_size_3') == 0 &&
          prop2.get('dim_size_4') == 0
      )

      if (namesValid && dtypesValid && offsetsValid && propsValid)
        return complexDtypeMap[dtype1];
      
    }

    throw new Error("Compond dtype not supported.")
  }
  
  static _determineVlenDatatype (datatypeMsg: Map<string, any>) : Array<any> {
    const vlenType = datatypeMsg.get('class_bit_field_0') & 0x01;
    if (vlenType != 1)
      return ['VLEN_SEQUENCE', 0, 0];
    const paddingType = datatypeMsg.get('class_bit_field_0') >> 4;
    const charecterSet = datatypeMsg.get('class_bit_field_1') & 0x01;
    return ['VLEN_STRING', paddingType, charecterSet]
  }
}