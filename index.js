// anything starting wtih \x needs to be updated
// confirm output of _read_bytes (buffer) is being compared correctly
// make sure } catch (err) { } is not hiding actual error
// encoding_errors - wrap in try/catch to hide errors

const denodeify = require('denodeify');
const fs = require('fs-ext');
const path = require('path');

const fs_open_async = denodeify(fs.open);
const fs_read_async = denodeify(fs.read);
const fs_close_async = denodeify(fs.close);

const logging = {
    INFO: 'INFO'
};

class ParseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ParseError';
    }
}

class NotImplementedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotImplementedError';
    }
}

const datetime = () => {
    throw new Error('Not implemented!');
};
const timedelta = () => {
    throw new Error('Not implemented!');
};

const structUnpack = (fmt, raw_bytes) => {
    const endian = fmt[0] === '<' ? 'little' : 'big';
    const letter = fmt[fmt.length - 1];

    if (letter === 's') {
        if (endian === 'big') {
            // If big endian, reverse bytes manually maybe
            throw new Error('Big endian not supported');
        }
        return raw_bytes.toString();
    } else if (letter === 'd') {
        if (endian === 'big') {
            return raw_bytes.readDoubleBE();
        }
        return raw_bytes.readDoubleLE();
    } else if (letter === 'i') {
        if (endian === 'big') {
            return raw_bytes.readInt32BE();
        }
        return raw_bytes.readInt32LE();
    } else if (letter === 'b') {
        // Only ever called for 1 char, so this should be fine (and for both directions)
        return raw_bytes.readIntBE(0, 1);
    } else if (letter === 'q') {
        // Not a real conversion, just 48 bits - would be better to check that the remaining 2 bytes are 0
        if (endian === 'big') {
            return raw_bytes.readIntBE(0, 6);
        }
        return raw_bytes.readIntLE(0, 6);
    } else if (letter === 'h') {
        if (endian === 'big') {
            return raw_bytes.readInt16BE();
        }
        return raw_bytes.readInt16LE();
    }
};

// Could use encoding_errors... not sure what the implication would be though
const decode = (name, encoding, encoding_errors) => {
    return name.toString(encoding);
};


/*class Decompressor {
    constructor(parent) {
        this.parent = parent

    decompress_row(offset, length, result_length, page) {
        throw new NotImplementedError();

    @staticmethod
    to_ord(int_or_str) {
        if isinstance(int_or_str, int) {
            return int_or_str
        return ord(int_or_str)

    @staticmethod
    to_chr(int_or_str) {
        py2 = six.PY2
        if isinstance(int_or_str, (bytes, bytearray)) {
            return int_or_str
        if py2:
            return chr(int_or_str)
        return bytes([int_or_str])


class RLEDecompressor extends Decompressor {
    """
    Decompresses data using the Run Length Encoding algorithm
    """
    decompress_row(offset, length, result_length, page) {
        b = this.to_ord
        c = this.to_chr
        current_result_array_index = 0
        result = []
        i = 0
        for (let j = 0; i < length; i++) {
            if i !== j:
                continue
            control_byte = b(page[offset + i]) & 0xF0
            end_of_first_byte = b(page[offset + i]) & 0x0F
            if control_byte === 0x00:
                if i !== (length - 1) {
                    count_of_bytes_to_copy = (
                        (b(page[offset + i + 1]) & 0xFF) +
                        64 +
                        end_of_first_byte * 256
                    )
                    start = offset + i + 2
                    end = start + count_of_bytes_to_copy
                    result.push(c(page[start:end]))
                    i += count_of_bytes_to_copy + 1
                    current_result_array_index += count_of_bytes_to_copy
            } else if (control_byte === 0x40:
                copy_counter = (
                    end_of_first_byte * 16 +
                    (b(page[offset + i + 1]) & 0xFF)
                )
                for _ in xrange(copy_counter + 18) {
                    result.push(c(page[offset + i + 2]))
                    current_result_array_index += 1
                i += 2
            } else if (control_byte === 0x60:
                for _ in xrange(end_of_first_byte * 256 +
                                (b(page[offset + i + 1]) & 0xFF) + 17) {
                    result.push(c(0x20))
                    current_result_array_index += 1
                i += 1
            } else if (control_byte === 0x70:
                for _ in xrange(end_of_first_byte * 256 +
                                (b(page[offset + i + 1]) & 0xFF) + 17) {
                    result.push(c(0x00))
                    current_result_array_index += 1
                i += 1
            } else if (control_byte === 0x80:
                count_of_bytes_to_copy = Math.min(end_of_first_byte + 1,
                                             length - (i + 1))
                start = offset + i + 1
                end = start + count_of_bytes_to_copy
                result.push(c(page[start:end]))
                i += count_of_bytes_to_copy
                current_result_array_index += count_of_bytes_to_copy
            } else if (control_byte === 0x90:
                count_of_bytes_to_copy = Math.min(end_of_first_byte + 17,
                                             length - (i + 1))
                start = offset + i + 1
                end = start + count_of_bytes_to_copy
                result.push(c(page[start:end]))
                i += count_of_bytes_to_copy
                current_result_array_index += count_of_bytes_to_copy
            } else if (control_byte === 0xA0:
                count_of_bytes_to_copy = Math.min(end_of_first_byte + 33,
                                             length - (i + 1))
                start = offset + i + 1
                end = start + count_of_bytes_to_copy
                result.push(c(page[start:end]))
                i += count_of_bytes_to_copy
                current_result_array_index += count_of_bytes_to_copy
            } else if (control_byte === 0xB0:
                count_of_bytes_to_copy = Math.min(end_of_first_byte + 49,
                                             length - (i + 1))
                start = offset + i + 1
                end = start + count_of_bytes_to_copy
                result.push(c(page[start:end]))
                i += count_of_bytes_to_copy
                current_result_array_index += count_of_bytes_to_copy
            } else if (control_byte === 0xC0:
                for _ in xrange(end_of_first_byte + 3) {
                    result.push(c(page[offset + i + 1]))
                    current_result_array_index += 1
                i += 1
            } else if (control_byte === 0xD0:
                for _ in xrange(end_of_first_byte + 2) {
                    result.push(c(0x40))
                    current_result_array_index += 1
            } else if (control_byte === 0xE0:
                for _ in xrange(end_of_first_byte + 2) {
                    result.push(c(0x20))
                    current_result_array_index += 1
            } else if (control_byte === 0xF0:
                for _ in xrange(end_of_first_byte + 2) {
                    result.push(c(0x00))
                    current_result_array_index += 1
            } else {
                throw new Error(`unknown control byte: ${control_byte}`)
            i += 1

        result = b''.join(result)
        if result.length !== result_length:
            throw new Error('unexpected result length: %d !== %d' %
                                     (result.length, result_length))

        return result


class RDCDecompressor extends Decompressor {
    """
    Decompresses data using the Ross Data Compression algorithm
    """
    bytes_to_bits(src, offset, length) {
        result = [0] * (length * 8)
        for (let i = 0; i < length; i++) {
            b = src[offset + i]
            for (let bit = 0; i < 8; i++) {
                result[8 * i + (7 - bit)] = 0 if ((b & (1 << bit)) === 0) else 1
            }
        return result

    ensure_capacity(src, capacity) {
        if capacity >= src.length {
            new_len = max(capacity, 2 * src.length)
            src.extend([0] * (new_len - src.length))
        return src

    is_short_rle(first_byte_of_cb) {
        return first_byte_of_cb in [0x00, 0x01, 0x02, 0x03, 0x04, 0x05])

    is_single_byte_marker(first_byte_of_cb) {
        return first_byte_of_cb in [0x02, 0x04, 0x06, 0x08, 0x0A])

    is_two_bytes_marker(double_bytes_cb) {
        return double_bytes_cb.length === 2 and\
            ((double_bytes_cb[0] >> 4) & 0xF) > 2

    is_three_bytes_marker(three_byte_marker) {
        flag = three_byte_marker[0] >> 4
        return three_byte_marker.length === 3 && (flag & 0xF) in [1, 2])

    get_length_of_rle_pattern(first_byte_of_cb) {
        if first_byte_of_cb <= 0x05:
            return first_byte_of_cb + 3
        return 0

    get_length_of_one_byte_pattern(first_byte_of_cb) {
        return first_byte_of_cb + 14\
            if this.is_single_byte_marker(first_byte_of_cb) else 0

    get_length_of_two_bytes_pattern(double_bytes_cb) {
        return (double_bytes_cb[0] >> 4) & 0xF

    get_length_of_three_bytes_pattern(p_type, three_byte_marker) {
        if p_type === 1:
            return 19 + (three_byte_marker[0] & 0xF) +\
                (three_byte_marker[1] * 16)
        } else if (p_type === 2:
            return three_byte_marker[2] + 16
        return 0

    get_offset_for_one_byte_pattern(first_byte_of_cb) {
        if first_byte_of_cb === 0x08:
            return 24
        } else if (first_byte_of_cb === 0x0A:
            return 40
        return 0

    get_offset_for_two_bytes_pattern(double_bytes_cb) {
        return 3 + (double_bytes_cb[0] & 0xF) + (double_bytes_cb[1] * 16)

    get_offset_for_three_bytes_pattern(triple_bytes_cb) {
        return 3 + (triple_bytes_cb[0] & 0xF) + (triple_bytes_cb[1] * 16)

    clone_byte(b, length) {
        return [b] * length

    decompress_row(offset, length, result_length, page) {
        b = this.to_ord
        c = this.to_chr
        src_row = [b(x) for x in page.slice(offset, offset + length)]
        out_row = [0] * result_length
        src_offset = 0
        out_offset = 0
        while src_offset < (src_row.length - 2) {
            prefix_bits = this.bytes_to_bits(src_row, src_offset, 2)
            src_offset += 2
            for bit_index in xrange(16) {
                if src_offset >= src_row.length {
                    break
                if prefix_bits[bit_index] === 0:
                    out_row = this.ensure_capacity(out_row, out_offset)
                    out_row[out_offset] = src_row[src_offset]
                    src_offset += 1
                    out_offset += 1
                    continue
                marker_byte = src_row[src_offset]
                try:
                    next_byte = src_row[src_offset + 1]
                except IndexError:
                    break
                if this.is_short_rle(marker_byte) {
                    length = this.get_length_of_rle_pattern(marker_byte)
                    out_row = this.ensure_capacity(
                        out_row, out_offset + length
                    )
                    pattern = this.clone_byte(next_byte, length)
                    out_row[out_offset:out_offset + length] = pattern
                    out_offset += length
                    src_offset += 2
                    continue
                } else if (this.is_single_byte_marker(marker_byte) && not\
                        ((next_byte & 0xF0) === ((next_byte << 4) & 0xF0)) {
                    length = this.get_length_of_one_byte_pattern(marker_byte)
                    out_row = this.ensure_capacity(
                        out_row, out_offset + length
                    )
                    back_offset = this.get_offset_for_one_byte_pattern(
                        marker_byte
                    )
                    start = out_offset - back_offset
                    end = start + length
                    out_row[out_offset:out_offset + length] =\
                        out_row[start:end]
                    src_offset += 1
                    out_offset += length
                    continue
                two_bytes_marker = src_row.slice(src_offset, src_offset + 2)
                if this.is_two_bytes_marker(two_bytes_marker) {
                    length = this.get_length_of_two_bytes_pattern(
                        two_bytes_marker
                    )
                    out_row = this.ensure_capacity(
                        out_row, out_offset + length
                    )
                    back_offset = this.get_offset_for_two_bytes_pattern(
                        two_bytes_marker
                    )
                    start = out_offset - back_offset
                    end = start + length
                    out_row[out_offset:out_offset + length] =\
                        out_row[start:end]
                    src_offset += 2
                    out_offset += length
                    continue
                three_bytes_marker = src_row.slice(src_offset, src_offset + 3)
                if this.is_three_bytes_marker(three_bytes_marker) {
                    p_type = (three_bytes_marker[0] >> 4) & 0x0F
                    back_offset = 0
                    if p_type === 2:
                        back_offset = this.get_offset_for_three_bytes_pattern(
                            three_bytes_marker
                        )
                    length = this.get_length_of_three_bytes_pattern(
                        p_type, three_bytes_marker
                    )
                    out_row = this.ensure_capacity(
                        out_row, out_offset + length
                    )
                    if p_type === 1:
                        pattern = this.clone_byte(
                            three_bytes_marker[2], length
                        )
                    } else {
                        start = out_offset - back_offset
                        end = start + length
                        pattern = out_row.slice(start, end)
                    out_row[out_offset:out_offset + length] = pattern
                    src_offset += 3
                    out_offset += length
                    continue
                } else {
                    throw new Error(`unknown marker ${src_row[src_offset]} at offset ${src_offset}`);
                    break;
                }
        return b''.join([c(x) for x in out_row])*/

/*SAS7BDAT(path[, log_level[, extra_time_format_strings[, \
extra_date_time_format_strings[, extra_date_format_strings]]]]) -> \
SAS7BDAT object

Open a SAS7BDAT file. The log level are standard logging levels
(defaults to logging.INFO).

If your sas7bdat file uses non-standard format strings for time, datetime,
or date values, pass those strings into the constructor using the
appropriate kwarg.*/
class SAS7BDAT {
    constructor(path, log_level=logging.INFO, extra_time_format_strings=null, extra_date_time_format_strings=null,  extra_date_format_strings=null, skip_header=false, encoding='utf8', encoding_errors='ignore', align_correction=true) {
        this._open_files = [];
        SAS7BDAT._open_files = this._open_files;
        this.RLE_COMPRESSION = 'SASYZCRL';
        SAS7BDAT.RLE_COMPRESSION = this.RLE_COMPRESSION;
        this.RDC_COMPRESSION = 'SASYZCR2';
        this.COMPRESSION_LITERALS = [this.RLE_COMPRESSION, this.RDC_COMPRESSION];
        SAS7BDAT.COMPRESSION_LITERALS = this.COMPRESSION_LITERALS;
        this.DECOMPRESSORS = {
            [this.RLE_COMPRESSION]: this.RLEDecompressor,
            [this.RDC_COMPRESSION]: this.RDCDecompressor
        };
        this.TIME_FORMAT_STRINGS = ['TIME'];
        this.DATE_TIME_FORMAT_STRINGS = ['DATETIME'];
        this.DATE_FORMAT_STRINGS = ['YYMMDD', 'MMDDYY', 'DDMMYY', 'DATE', 'JULIAN', 'MONYY'];

        this.path = path;
        this.endianess = null;
        this.u64 = false;
        this.logger = this._make_logger(log_level);
        this._update_format_strings(this.TIME_FORMAT_STRINGS, extra_time_format_strings);
        this._update_format_strings(this.DATE_TIME_FORMAT_STRINGS, extra_date_time_format_strings);
        this._update_format_strings(this.DATE_FORMAT_STRINGS, extra_date_format_strings);
        this.skip_header = skip_header;
        this.encoding = encoding;
        this.encoding_errors = encoding_errors;
        this.align_correction = align_correction;
        this._file = fs.openSync(path, 'r');
        this._open_files.push(this._file);
        this.cached_page = null;
        this.current_page_type = null;
        this.current_page_block_count = null;
        this.current_page_subheaders_count = null;
        this.current_file_position = 0;
        this.current_page_data_subheader_pointers = [];
        this.current_row = [];
        this.column_names_strings = [];
        this.column_names = [];
        this.column_types = [];
        this.column_data_offsets = [];
        this.column_data_lengths = [];
        this.columns = [];
        this.header = new SASHeader(this);
        this.properties = this.header.properties;
        this.header.parse_metadata();
        this.logger.debug(this.header);
    }

    _update_format_strings(arr, format_strings) {
        if (format_strings !== null) {
            if (typeof format_strings === 'string') {
                format_strings = [format_strings];
            }

            format_strings.forEach(format_string => {
                if (!arr.includes(format_string)) {
                    arr.push(format_string);
                }
            });
        }
    }

    close() {
        fs.closeSync(this._file);
    }

    _make_logger(level = logging.INFO) {
/*        logger = logging.getLogger(this.path)
        logger.setLevel(level)
        fmt = '%(message)s'
        stream_handler = logging.StreamHandler()
        if platform.system() !== 'Windows':
            stream_handler.emit = _get_color_emit(
                os.path.basename(this.path),
                stream_handler.emit
            )
        } else {
            fmt = '[%s] %%(message)s' % os.path.basename(this.path)
        formatter = logging.Formatter(fmt, '%y-%m-%d %H:%M:%S')
        stream_handler.setFormatter(formatter)
        logger.addHandler(stream_handler)
        return logger*/

        const levels = {
            error: 0,
            warning: 1,
            debug: 2,
            info: 3
        };

        const log = level2 => msg => {
            if (levels[level2] >= levels[level]) {
                console.log(level2, msg);
            }
        };

        return {
            debug: log('debug'),
            error: log('error'),
            info: log('info'),
            warning: log('warning')
        };
    }

    _read_bytes(offsets_to_lengths) {
        const result = {};
        if (!this.cached_page) {
            for (let offset of Object.keys(offsets_to_lengths)) {
                const length = offsets_to_lengths[offset];
                offset = parseInt(offset, 10);
                let skipped = 0;
                while (skipped < (offset - this.current_file_position)) {
                    const seek = offset - this.current_file_position - skipped;
                    skipped += seek;
                    fs.seekSync(this._file, seek, 0);
                }
                const tmp = Buffer.alloc(length);
                fs.readSync(this._file, tmp, 0, length, null);
//                tmp = this._file.read(length)
                if (tmp.length < length) {
                    throw new Error(`failed to read ${length} bytes from sas7bdat file`);
                }
                this.current_file_position = offset + length;
                result[offset] = tmp;
            }
        } else {
            for (let offset of Object.keys(offsets_to_lengths)) {
                const length = offsets_to_lengths[offset];
                offset = parseInt(offset, 10);
                result[offset] = this.cached_page.slice(offset, offset + length);
            }
        }
        return result;
    }

    /*
    See the full range of newfmt here, find correspondence in node library (including endianess) and implement here
        h - short -> integer (2)
        d - double -> float (8)
        [0-9]*s - char[] -> bytes
        i - integer -> integer (4)
        b - signed char -> integer
        q - unsigned long long -> integer (8)
        and with each endian, forward or backwards
    */
    _read_val(fmt, raw_bytes, size) {
        if (fmt === 'i' && this.u64 && size === 8) {
            fmt = 'q';
        }
        let newfmt = fmt;
        if (fmt === 's') {
            newfmt = `${Math.min(size, raw_bytes.length)}s`;
        } else if (['number', 'datetime', 'date', 'time'].includes(fmt)) {
            newfmt = 'd';
            if (raw_bytes.length !== size) {
                size = raw_bytes.length;
            }
            if (size < 8) {
                if (this.endianess === 'little') {
                    const raw_bytes_old = raw_bytes;
                    raw_bytes = '';
                    for (let i = 0; i < (8 - size); i++) {
                        raw_bytes += '\x00';
                    }
                    raw_bytes += raw_bytes_old;
                } else {
                    for (let i = 0; i < (8 - size); i++) {
                        raw_bytes += '\x00';
                    }
                }
                size = 8;
            }
        }
        if (this.endianess === 'big') {
            newfmt = `>${newfmt}`;
        } else {
            newfmt = `<${newfmt}`;
        }
        let val = structUnpack(newfmt, raw_bytes.slice(0, size));
        if (fmt === 's') {
            val = val.replace(/\0/g, '').trim();
        } else if (Number.isNaN(val)) {
            val = null;
        } else if (fmt === 'datetime') {
            val = datetime(1960, 1, 1) + timedelta('seconds', val);
        } else if (fmt === 'time') {
            val = (datetime(1960, 1, 1) + timedelta('seconds', val)).time();
        } else if (fmt === 'date') {
            val = (datetime(1960, 1, 1) + timedelta('days', val)).date();
/*            if (val === Infinity) {
                // Some data sets flagged with a date format are actually
                // stored as datetime values
                val = datetime(1960, 1, 1) + timedelta('seconds', val)
            }*/
        }

        return val;
    }

    /*
    readlines() -> generator which yields lists of values, each a line
    from the file.

    Possible values in the list are null, string, float, datetime.datetime,
    datetime.date, and datetime.time.
    */
    * [Symbol.iterator]() {
        const bit_offset = this.header.PAGE_BIT_OFFSET;
        const subheader_pointer_length = this.header.SUBHEADER_POINTER_LENGTH;
        const row_count = this.header.properties.row_count;
        let current_row_in_file_index = 0;
        let current_row_on_page_index = 0;
        if (!this.skip_header) {
            yield this.columns.map(x => decode(x.name, this.encoding, this.encoding_errors));
        }
        if (!this.cached_page) {
            fs.seekSync(this._file, this.properties.header_length, 0);
            this._read_next_page();
        }
        while (current_row_in_file_index < row_count) {
            current_row_in_file_index += 1;
            const current_page_type = this.current_page_type;
            if (current_page_type === this.header.PAGE_META_TYPE) {
                if (current_row_on_page_index < this.current_page_data_subheader_pointers.length && current_row_on_page_index >= 0) {
                    const current_subheader_pointer = this.current_page_data_subheader_pointers[current_row_on_page_index];
                    current_row_on_page_index += 1;
                    const Cls = this.header.SUBHEADER_INDEX_TO_CLASS[this.header.DATA_SUBHEADER_INDEX];
                    if (Cls === undefined) {
                        throw new NotImplementedError();
                    }
                    new Cls(this).process_subheader(
                        current_subheader_pointer.offset,
                        current_subheader_pointer.length
                    );
                    if (current_row_on_page_index === this.current_page_data_subheader_pointers.length) {
                        this._read_next_page();
                        current_row_on_page_index = 0;
                    }
                } else {
                    this._read_next_page();
                    current_row_on_page_index = 0;
                }
            } else if (this.header.PAGE_MIX_TYPE.includes(current_page_type)) {
                let align_correction;
                if (this.align_correction) {
                    align_correction = (
                        bit_offset + this.header.SUBHEADER_POINTERS_OFFSET +
                        this.current_page_subheaders_count *
                        subheader_pointer_length
                    ) % 8;
                } else {
                    align_correction = 0;
                }
                const offset = (
                    bit_offset + this.header.SUBHEADER_POINTERS_OFFSET +
                    align_correction + this.current_page_subheaders_count *
                    subheader_pointer_length + current_row_on_page_index *
                    this.properties.row_length
                );
                try {
                    this.current_row = this._process_byte_array_with_data(
                        offset,
                        this.properties.row_length
                    );
                } catch (err) {
                    console.log(`failed to process data (you might want to try passing align_correction=${!this.align_correction} to the SAS7BDAT constructor)`);
                    throw err;
                }
                current_row_on_page_index += 1;
                if (current_row_on_page_index === Math.min(this.properties.row_count, this.properties.mix_page_row_count)) {
                    this._read_next_page();
                    current_row_on_page_index = 0;
                }
            } else if (current_page_type === this.header.PAGE_DATA_TYPE) {
                this.current_row = this._process_byte_array_with_data(
                    bit_offset + this.header.SUBHEADER_POINTERS_OFFSET +
                    current_row_on_page_index *
                    this.properties.row_length,
                    this.properties.row_length
                );
                current_row_on_page_index += 1;
                if (current_row_on_page_index === this.current_page_block_count) {
                    this._read_next_page();
                    current_row_on_page_index = 0;
                }
            } else {
                throw new Error(`unknown page type: ${current_page_type}`);
            }
            yield this.current_row;
        }
    }

    _read_next_page() {
        this.current_page_data_subheader_pointers = [];
        this.cached_page = Buffer.alloc(this.properties.page_length);
        const bytesRead = fs.readSync(this._file, this.cached_page, 0, this.properties.page_length, null);
        if (bytesRead <= 0) {
            return;
        }

        if (this.cached_page.length !== this.properties.page_length) {
            throw new Error(`failed to read complete page from file (read ${this.cached_page.length} of ${this.properties.page_length} bytes)`);
        }
        this.header.read_page_header();
        if (this.current_page_type === this.header.PAGE_META_TYPE) {
            this.header.process_page_metadata();
        }

        const types = this.header.PAGE_MIX_TYPE.concat(this.header.PAGE_META_TYPE, this.header.PAGE_DATA_TYPE);
        if (!types.includes(this.current_page_type)) {
            this._read_next_page();
        }
    }

    _process_byte_array_with_data(offset, length) {
        const row_elements = [];
        let source;
        if (this.properties.compression && length < this.properties.row_length) {
            const Decompressor = this.DECOMPRESSOR[this.properties.compression];
            source = new Decompressor(this).decompress_row(
                offset, length, this.properties.row_length,
                this.cached_page
            );
            offset = 0;
        } else {
            source = this.cached_page;
        }
        for (let i = 0; i < this.properties.column_count; i++) {
            const length = this.column_data_lengths[i];
            if (length === 0) {
                break;
            }
            const start = offset + this.column_data_offsets[i];
            const end = offset + this.column_data_offsets[i] + length;
            const temp = source.slice(start, end);
            if (this.columns[i].type === 'number') {
                if (this.column_data_lengths[i] <= 2) {
                    row_elements.push(this._read_val(
                        'h', temp, length
                    ));
                } else {
                    const fmt = this.columns[i].format;
                    if (!fmt) {
                        row_elements.push(this._read_val(
                            'number', temp, length
                        ));
                    } else if (fmt in this.TIME_FORMAT_STRINGS) {
                        row_elements.push(this._read_val(
                            'time', temp, length
                        ));
                    } else if (fmt in this.DATE_TIME_FORMAT_STRINGS) {
                        row_elements.push(this._read_val(
                            'datetime', temp, length
                        ));
                    } else if (fmt in this.DATE_FORMAT_STRINGS) {
                        row_elements.push(this._read_val(
                            'date', temp, length
                        ));
                    } else {
                        row_elements.push(this._read_val(
                            'number', temp, length
                        ));
                    }
                }
            } else { // string
                row_elements.push(decode(this._read_val(
                    's', temp, length
                ), this.encoding, this.encoding_errors));
            }
        }
        return row_elements;
    }

/*    convert_file(out_file, delimiter=',', step_size=100000) {
        """
        convert_file(out_file[, delimiter[, step_size]]) -> null

        A convenience method to convert a SAS7BDAT file into a delimited
        text file. Defaults to comma separated. The step_size parameter
        is uses to show progress on longer running conversions.
        """
        delimiter = str(delimiter)
        this.logger.debug(`saving as: ${out_file}`)
        out_f = null
        success = true
        try:
            if out_file === '-':
                out_f = sys.stdout
            } else {
                out_f = open(out_file, 'w')
            out = csv.writer(out_f, lineterminator='\n', delimiter=delimiter)
            i = 0
            for i, line in enumerate(1) {
                if line.length !== (this.properties.column_count || 0) {
                    msg = 'parsed line into %s columns but was ' \
                          'expecting %s.\n%s' %\
                          (line.length, this.properties.column_count, line)
                    throw new Error(msg)
                    success = false
                    if this.logger.level === logging.DEBUG:
                        raise ParseError(msg)
                    break
                if not i % step_size:
                    this.logger.info(
                        '%.1f%% complete',
                        float(i) / this.properties.row_count * 100.0
                    )
                try:
                    out.writerow(line)
                except IOError:
                    this.logger.warning('wrote %s lines before interruption', i)
                    break
            this.logger.info('\u27f6 [%s] wrote %s of %s lines',
                             os.path.basename(out_file), i - 1,
                             this.properties.row_count || 0)
        finally:
            if (out_f !== null) {
                out_f.close()
        return success

    to_data_frame() {
        """
        to_data_frame() -> pandas.DataFrame object

        A convenience method to convert a SAS7BDAT file into a pandas
        DataFrame.
        """
        import pandas as pd
        data = list(this.readlines())
        return pd.DataFrame(data.slice(1), columns=data[0])*/
}

class Column {
    constructor(col_id, name, label, col_format, col_type, length) {
        this.col_id = col_id;
        this.name = name;
        this.label = label;
        this.format = col_format.toString('utf8');
        this.type = col_type;
        this.length = length;
    }
}


class SubheaderPointer {
    constructor(offset = null, length = null, compression = null, p_type = null) {
        this.offset = offset;
        this.length = length;
        this.compression = compression;
        this.type = p_type;
    }
}


class ProcessingSubheader {
    constructor(parent) {
        this.TEXT_BLOCK_SIZE_LENGTH = 2;
        this.ROW_LENGTH_OFFSET_MULTIPLIER = 5;
        this.ROW_COUNT_OFFSET_MULTIPLIER = 6;
        this.COL_COUNT_P1_MULTIPLIER = 9;
        this.COL_COUNT_P2_MULTIPLIER = 10;
        this.ROW_COUNT_ON_MIX_PAGE_OFFSET_MULTIPLIER = 15; // rowcountfp
        this.COLUMN_NAME_POINTER_LENGTH = 8;
        this.COLUMN_NAME_TEXT_SUBHEADER_OFFSET = 0;
        this.COLUMN_NAME_TEXT_SUBHEADER_LENGTH = 2;
        this.COLUMN_NAME_OFFSET_OFFSET = 2;
        this.COLUMN_NAME_OFFSET_LENGTH = 2;
        this.COLUMN_NAME_LENGTH_OFFSET = 4;
        this.COLUMN_NAME_LENGTH_LENGTH = 2;
        this.COLUMN_DATA_OFFSET_OFFSET = 8;
        this.COLUMN_DATA_LENGTH_OFFSET = 8;
        this.COLUMN_DATA_LENGTH_LENGTH = 4;
        this.COLUMN_TYPE_OFFSET = 14;
        this.COLUMN_TYPE_LENGTH = 1;
        this.COLUMN_FORMAT_TEXT_SUBHEADER_INDEX_OFFSET = 22;
        this.COLUMN_FORMAT_TEXT_SUBHEADER_INDEX_LENGTH = 2
        this.COLUMN_FORMAT_OFFSET_OFFSET = 24;
        this.COLUMN_FORMAT_OFFSET_LENGTH = 2;
        this.COLUMN_FORMAT_LENGTH_OFFSET = 26;
        this.COLUMN_FORMAT_LENGTH_LENGTH = 2;
        this.COLUMN_LABEL_TEXT_SUBHEADER_INDEX_OFFSET = 28;
        this.COLUMN_LABEL_TEXT_SUBHEADER_INDEX_LENGTH = 2;
        this.COLUMN_LABEL_OFFSET_OFFSET = 30;
        this.COLUMN_LABEL_OFFSET_LENGTH = 2;
        this.COLUMN_LABEL_LENGTH_OFFSET = 32;
        this.COLUMN_LABEL_LENGTH_LENGTH = 2;

        this.parent = parent;
        this.logger = parent.logger;
        this.properties = parent.header.properties;
        this.int_length = this.properties.u64 ? 8 : 4;
    }

    process_subheader(offset, length) {
        throw new NotImplementedError();
    }
}


class RowSizeSubheader extends ProcessingSubheader {
    process_subheader(offset, length) {
        const int_len = this.int_length;
        const lcs = offset + (this.properties.u64 ? 682 : 354);
        const lcp = offset + (this.properties.u64 ? 706 : 378);
        const vals = this.parent._read_bytes({
            [offset + this.ROW_LENGTH_OFFSET_MULTIPLIER * int_len]: int_len,
            [offset + this.ROW_COUNT_OFFSET_MULTIPLIER * int_len]: int_len,
            [offset + this.ROW_COUNT_ON_MIX_PAGE_OFFSET_MULTIPLIER * int_len]:
                            int_len,
            [offset + this.COL_COUNT_P1_MULTIPLIER * int_len]: int_len,
            [offset + this.COL_COUNT_P2_MULTIPLIER * int_len]: int_len,
            [lcs]: 2,
            [lcp]: 2,
        });
        if (this.properties.row_length !== null) {
            throw new Error('found more than one row length subheader');
        }
        if (this.properties.row_count !== null) {
            throw new Error('found more than one row count subheader');
        }
        if (this.properties.col_count_p1 !== null) {
            throw new Error('found more than one col count p1 subheader');
        }
        if (this.properties.col_count_p2 !== null) {
            throw new Error('found more than one col count p2 subheader');
        }
        if (this.properties.mix_page_row_count !== null) {
            throw new Error('found more than one mix page row count subheader');
        }
        this.properties.row_length = this.parent._read_val(
            'i',
            vals[offset + this.ROW_LENGTH_OFFSET_MULTIPLIER * int_len],
            int_len
        );
        this.properties.row_count = this.parent._read_val(
            'i',
            vals[offset + this.ROW_COUNT_OFFSET_MULTIPLIER * int_len],
            int_len
        );
        this.properties.col_count_p1 = this.parent._read_val(
            'i',
            vals[offset + this.COL_COUNT_P1_MULTIPLIER * int_len],
            int_len
        );
        this.properties.col_count_p2 = this.parent._read_val(
            'i',
            vals[offset + this.COL_COUNT_P2_MULTIPLIER * int_len],
            int_len
        );
        this.properties.mix_page_row_count = this.parent._read_val(
            'i',
            vals[offset + this.ROW_COUNT_ON_MIX_PAGE_OFFSET_MULTIPLIER *
                 int_len],
            int_len
        );
        this.properties.lcs = this.parent._read_val('h', vals[lcs], 2);
        this.properties.lcp = this.parent._read_val('h', vals[lcp], 2);
    }
}

class ColumnSizeSubheader extends ProcessingSubheader {
    process_subheader(offset, length) {
        offset += this.int_length;
        const vals = this.parent._read_bytes({
            [offset]: this.int_length
        });
        if (this.properties.column_count !== null) {
            throw new Error('found more than one column count subheader');
        }
        this.properties.column_count = this.parent._read_val(
            'i', vals[offset], this.int_length
        );
        if (this.properties.col_count_p1 + this.properties.col_count_p2 !== this.properties.column_count) {
            this.logger.warning('column count mismatch');
        }
    }
}


class SubheaderCountsSubheader extends ProcessingSubheader {
    process_subheader(offset, length) {
        return; // Not sure what to do here yet
    }
}


class ColumnTextSubheader extends ProcessingSubheader {
    process_subheader(offset, length) {
        offset += this.int_length;
        let vals = this.parent._read_bytes({
            [offset]: this.TEXT_BLOCK_SIZE_LENGTH
        });
        const text_block_size = this.parent._read_val(
            'h', vals[offset], this.TEXT_BLOCK_SIZE_LENGTH
        );

        vals = this.parent._read_bytes({
            [offset]: text_block_size
        });
        this.parent.column_names_strings.push(vals[offset]);
        if (this.parent.column_names_strings.length === 1) {
            const column_name = this.parent.column_names_strings[0];
            let compression_literal = null;
            for (const cl of SAS7BDAT.COMPRESSION_LITERALS) {
                if (column_name.indexOf(cl) >= 0) {
                    compression_literal = cl;
                    break;
                }
            }
            this.properties.compression = compression_literal;
            offset -= this.int_length;
            vals = this.parent._read_bytes({
                [offset + (this.properties.u64 ? 20 : 16)]: 8
            });
            compression_literal = this.parent._read_val(
                's',
                vals[offset + (this.properties.u64 ? 20 : 16)],
                8
            ).trim();
            if (compression_literal === '') {
                this.properties.lcs = 0;
                vals = this.parent._read_bytes({
                    [offset + 16 + (this.properties.u64 ? 20 : 16)]: this.properties.lcp
                });
                const creatorproc = this.parent._read_val(
                    's',
                    vals[offset + 16 + (this.properties.u64 ? 20 : 16)],
                    this.properties.lcp
                );
                this.properties.creator_proc = creatorproc;
            } else if (compression_literal === SAS7BDAT.RLE_COMPRESSION) {
                vals = this.parent._read_bytes({
                    [offset + 24 + (this.properties.u64 ? 20 : 16)]: this.properties.lcp
                });
                const creatorproc = this.parent._read_val(
                    's',
                    vals[offset + 24 + (this.properties.u64 ? 20 : 16)],
                    this.properties.lcp
                );
                this.properties.creator_proc = creatorproc;
            } else if (this.properties.lcs > 0) {
                this.properties.lcp = 0;
                vals = this.parent._read_bytes({
                    [offset + (this.properties.u64 ? 20 : 16)]: this.properties.lcs
                });
                const creator = this.parent._read_val(
                    's',
                    vals[offset + (this.properties.u64 ? 20 : 16)],
                    this.properties.lcs
                );
                this.properties.creator = creator;
            }
        }
    }
}

class ColumnNameSubheader extends ProcessingSubheader {
    process_subheader(offset, length) {
        offset += this.int_length;
        const column_name_pointers_count = Math.floor((length - 2 * this.int_length - 12) / 8);
        for (let i = 0; i < column_name_pointers_count; i++) {
            const text_subheader = (
                offset + this.COLUMN_NAME_POINTER_LENGTH * (i + 1) +
                this.COLUMN_NAME_TEXT_SUBHEADER_OFFSET
            );
            const col_name_offset = (
                offset + this.COLUMN_NAME_POINTER_LENGTH * (i + 1) +
                this.COLUMN_NAME_OFFSET_OFFSET
            );
            const col_name_length = (
                offset + this.COLUMN_NAME_POINTER_LENGTH * (i + 1) +
                this.COLUMN_NAME_LENGTH_OFFSET
            );
            const vals = this.parent._read_bytes({
                [text_subheader]: this.COLUMN_NAME_TEXT_SUBHEADER_LENGTH,
                [col_name_offset]: this.COLUMN_NAME_OFFSET_LENGTH,
                [col_name_length]: this.COLUMN_NAME_LENGTH_LENGTH
            });

            const idx = this.parent._read_val(
                'h', vals[text_subheader],
                this.COLUMN_NAME_TEXT_SUBHEADER_LENGTH
            );
            const col_offset = this.parent._read_val(
                'h', vals[col_name_offset],
                this.COLUMN_NAME_OFFSET_LENGTH
            );
            const col_len = this.parent._read_val(
                'h', vals[col_name_length],
                this.COLUMN_NAME_LENGTH_LENGTH
            );
            const name_str = this.parent.column_names_strings[idx];
            this.parent.column_names.push(
                name_str.slice(col_offset, col_offset + col_len)
            );
        }
    }
}


class ColumnAttributesSubheader extends ProcessingSubheader {
    process_subheader(offset, length) {
        const int_len = this.int_length;
        const column_attributes_vectors_count = (
            Math.floor((length - 2 * int_len - 12) / (int_len + 8))
        );
        for (let i = 0; i < column_attributes_vectors_count; i++) {
            const col_data_offset = (
                offset + int_len + this.COLUMN_DATA_OFFSET_OFFSET + i *
                (int_len + 8)
            );
            const col_data_len = (
                offset + 2 * int_len + this.COLUMN_DATA_LENGTH_OFFSET + i *
                (int_len + 8)
            );
            const col_types = (
                offset + 2 * int_len + this.COLUMN_TYPE_OFFSET + i *
                (int_len + 8)
            );
            const vals = this.parent._read_bytes({
                [col_data_offset]: int_len,
                [col_data_len]: this.COLUMN_DATA_LENGTH_LENGTH,
                [col_types]: this.COLUMN_TYPE_LENGTH
            });
            this.parent.column_data_offsets.push(this.parent._read_val(
                'i', vals[col_data_offset], int_len
            ));
            this.parent.column_data_lengths.push(this.parent._read_val(
                'i', vals[col_data_len], this.COLUMN_DATA_LENGTH_LENGTH
            ));
            const ctype = this.parent._read_val(
                'b', vals[col_types], this.COLUMN_TYPE_LENGTH
            );
            this.parent.column_types.push(
                ctype === 1 ? 'number' : 'string'
            );
        }
    }
}

class FormatAndLabelSubheader extends ProcessingSubheader {
    process_subheader(offset, length) {
        const int_len = this.int_length;
        const text_subheader_format = (
            offset + this.COLUMN_FORMAT_TEXT_SUBHEADER_INDEX_OFFSET + 3 *
            int_len
        );
        const col_format_offset = (
            offset + this.COLUMN_FORMAT_OFFSET_OFFSET + 3 * int_len
        );
        const col_format_len = (
            offset + this.COLUMN_FORMAT_LENGTH_OFFSET + 3 * int_len
        );
        const text_subheader_label = (
            offset + this.COLUMN_LABEL_TEXT_SUBHEADER_INDEX_OFFSET + 3 *
            int_len
        );
        const col_label_offset = (
            offset + this.COLUMN_LABEL_OFFSET_OFFSET + 3 * int_len
        );
        const col_label_len = (
            offset + this.COLUMN_LABEL_LENGTH_OFFSET + 3 * int_len
        );
        const vals = this.parent._read_bytes({
            [text_subheader_format]: this.COLUMN_FORMAT_TEXT_SUBHEADER_INDEX_LENGTH,
            [col_format_offset]: this.COLUMN_FORMAT_OFFSET_LENGTH,
            [col_format_len]: this.COLUMN_FORMAT_LENGTH_LENGTH,
            [text_subheader_label]: this.COLUMN_LABEL_TEXT_SUBHEADER_INDEX_LENGTH,
            [col_label_offset]: this.COLUMN_LABEL_OFFSET_LENGTH,
            [col_label_len]: this.COLUMN_LABEL_LENGTH_LENGTH
        });

        // min used to prevent incorrect data which appear in some files
        const format_idx = Math.min(
            this.parent._read_val(
                'h', vals[text_subheader_format],
                this.COLUMN_FORMAT_TEXT_SUBHEADER_INDEX_LENGTH
            ),
            this.parent.column_names_strings.length - 1
        );
        const format_start = this.parent._read_val(
            'h', vals[col_format_offset],
            this.COLUMN_FORMAT_OFFSET_LENGTH
        );
        const format_len = this.parent._read_val(
            'h', vals[col_format_len],
            this.COLUMN_FORMAT_LENGTH_LENGTH
        );
        // min used to prevent incorrect data which appear in some files
        const label_idx = Math.min(
            this.parent._read_val(
                'h', vals[text_subheader_label],
                this.COLUMN_LABEL_TEXT_SUBHEADER_INDEX_LENGTH
            ),
            this.parent.column_names_strings.length - 1
        );
        const label_start = this.parent._read_val(
            'h', vals[col_label_offset],
            this.COLUMN_LABEL_OFFSET_LENGTH
        );
        const label_len = this.parent._read_val(
            'h', vals[col_label_len],
            this.COLUMN_LABEL_LENGTH_LENGTH
        );

        const label_names = this.parent.column_names_strings[label_idx];
        const column_label = label_names.slice(label_start, label_start + label_len);
        const format_names = this.parent.column_names_strings[format_idx];
        const column_format = format_names.slice(format_start, format_start + format_len);
        const current_column_number = this.parent.columns.length;
        this.parent.columns.push(
            new Column(current_column_number,
                   this.parent.column_names[current_column_number],
                   column_label,
                   column_format,
                   this.parent.column_types[current_column_number],
                   this.parent.column_data_lengths[current_column_number])
        );
    }
}

class ColumnListSubheader extends ProcessingSubheader {
    process_subheader(offset, length) {
        return; // Not sure what to do with this yet
    }
}

class DataSubheader extends ProcessingSubheader {
    process_subheader(offset, length) {
        this.parent.current_row = this.parent._process_byte_array_with_data(
            offset, length
        );
    }
}

class SASProperties {
    constructor() {
        this.u64 = false;
        this.endianess = null;
        this.platform = null;
        this.name = null;
        this.file_type = null;
        this.date_created = null;
        this.date_modified = null;
        this.header_length = null;
        this.page_length = null;
        this.page_count = null;
        this.sas_release = null;
        this.server_type = null;
        this.os_type = null;
        this.os_name = null;
        this.compression = null;
        this.row_length = null;
        this.row_count = null;
        this.col_count_p1 = null;
        this.col_count_p2 = null;
        this.mix_page_row_count = null;
        this.lcs = null;
        this.lcp = null;
        this.creator = null;
        this.creator_proc = null;
        this.column_count = null;
        this.filename = null;
    }
}


class SASHeader {
    constructor(parent) {
        this.MAGIC = Buffer.from([0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0xc2, 0xea, 0x81, 0x60, 0xb3, 0x14, 0x11, 0xcf, 0xbd, 0x92, 0x8, 0x0, 0x9, 0xc7, 0x31, 0x8c, 0x18, 0x1f, 0x10, 0x11]);
        this.ROW_SIZE_SUBHEADER_INDEX = 'row_size';
        this.COLUMN_SIZE_SUBHEADER_INDEX = 'column_size';
        this.SUBHEADER_COUNTS_SUBHEADER_INDEX = 'subheader_counts';
        this.COLUMN_TEXT_SUBHEADER_INDEX = 'column_text';
        this.COLUMN_NAME_SUBHEADER_INDEX = 'column_name';
        this.COLUMN_ATTRIBUTES_SUBHEADER_INDEX = 'column_attributes';
        this.FORMAT_AND_LABEL_SUBHEADER_INDEX = 'format_and_label';
        this.COLUMN_LIST_SUBHEADER_INDEX = 'column_list';
        this.DATA_SUBHEADER_INDEX = 'data';
        // Subheader signatures, 32 and 64 bit, little and big endian
        this.SUBHEADER_SIGNATURE_TO_INDEX = {
            'f7f7f7f7': this.ROW_SIZE_SUBHEADER_INDEX,
            '00000000f7f7f7f7': this.ROW_SIZE_SUBHEADER_INDEX,
            'f7f7f7f700000000': this.ROW_SIZE_SUBHEADER_INDEX,
            'f6f6f6f6': this.COLUMN_SIZE_SUBHEADER_INDEX,
            '00000000f6f6f6f6': this.COLUMN_SIZE_SUBHEADER_INDEX,
            'f6f6f6f600000000': this.COLUMN_SIZE_SUBHEADER_INDEX,
            '00fcffff': this.SUBHEADER_COUNTS_SUBHEADER_INDEX,
            'fffffc00': this.SUBHEADER_COUNTS_SUBHEADER_INDEX,
            '00fcffffffffffff': this.SUBHEADER_COUNTS_SUBHEADER_INDEX,
            'fffffffffffffc00': this.SUBHEADER_COUNTS_SUBHEADER_INDEX,
            'fdffffff': this.COLUMN_TEXT_SUBHEADER_INDEX,
            'fffffffd': this.COLUMN_TEXT_SUBHEADER_INDEX,
            'fdffffffffffffff': this.COLUMN_TEXT_SUBHEADER_INDEX,
            'fffffffffffffffd': this.COLUMN_TEXT_SUBHEADER_INDEX,
            'ffffffff': this.COLUMN_NAME_SUBHEADER_INDEX,
            'ffffffffffffffff': this.COLUMN_NAME_SUBHEADER_INDEX,
            'fcffffff': this.COLUMN_ATTRIBUTES_SUBHEADER_INDEX,
            'fffffffc': this.COLUMN_ATTRIBUTES_SUBHEADER_INDEX,
            'fcffffffffffffff': this.COLUMN_ATTRIBUTES_SUBHEADER_INDEX,
            'fffffffffffffffc': this.COLUMN_ATTRIBUTES_SUBHEADER_INDEX,
            'fefbffff': this.FORMAT_AND_LABEL_SUBHEADER_INDEX,
            'fffffbfe': this.FORMAT_AND_LABEL_SUBHEADER_INDEX,
            'fefbffffffffffff': this.FORMAT_AND_LABEL_SUBHEADER_INDEX,
            'fffffffffffffbfe': this.FORMAT_AND_LABEL_SUBHEADER_INDEX,
            'feffffff': this.COLUMN_LIST_SUBHEADER_INDEX,
            'fffffffe': this.COLUMN_LIST_SUBHEADER_INDEX,
            'feffffffffffffff': this.COLUMN_LIST_SUBHEADER_INDEX,
            'fffffffffffffffe': this.COLUMN_LIST_SUBHEADER_INDEX
        };
        this.SUBHEADER_INDEX_TO_CLASS = {
            [this.ROW_SIZE_SUBHEADER_INDEX]: RowSizeSubheader,
            [this.COLUMN_SIZE_SUBHEADER_INDEX]: ColumnSizeSubheader,
            [this.SUBHEADER_COUNTS_SUBHEADER_INDEX]: SubheaderCountsSubheader,
            [this.COLUMN_TEXT_SUBHEADER_INDEX]: ColumnTextSubheader,
            [this.COLUMN_NAME_SUBHEADER_INDEX]: ColumnNameSubheader,
            [this.COLUMN_ATTRIBUTES_SUBHEADER_INDEX]: ColumnAttributesSubheader,
            [this.FORMAT_AND_LABEL_SUBHEADER_INDEX]: FormatAndLabelSubheader,
            [this.COLUMN_LIST_SUBHEADER_INDEX]: ColumnListSubheader,
            [this.DATA_SUBHEADER_INDEX]: DataSubheader
        };
        this.ALIGN_1_CHECKER_VALUE = '3';
        this.ALIGN_1_OFFSET = 32;
        this.ALIGN_1_LENGTH = 1;
        this.ALIGN_1_VALUE = 4;
        this.U64_BYTE_CHECKER_VALUE = '3';
        this.ALIGN_2_OFFSET = 35;
        this.ALIGN_2_LENGTH = 1;
        this.ALIGN_2_VALUE = 4;
        this.ENDIANNESS_OFFSET = 37;
        this.ENDIANNESS_LENGTH = 1;
        this.PLATFORM_OFFSET = 39;
        this.PLATFORM_LENGTH = 1;
        this.DATASET_OFFSET = 92;
        this.DATASET_LENGTH = 64;
        this.FILE_TYPE_OFFSET = 156;
        this.FILE_TYPE_LENGTH = 8;
        this.DATE_CREATED_OFFSET = 164;
        this.DATE_CREATED_LENGTH = 8;
        this.DATE_MODIFIED_OFFSET = 172;
        this.DATE_MODIFIED_LENGTH = 8;
        this.HEADER_SIZE_OFFSET = 196;
        this.HEADER_SIZE_LENGTH = 4;
        this.PAGE_SIZE_OFFSET = 200;
        this.PAGE_SIZE_LENGTH = 4;
        this.PAGE_COUNT_OFFSET = 204;
        this.PAGE_COUNT_LENGTH = 4;
        this.SAS_RELEASE_OFFSET = 216;
        this.SAS_RELEASE_LENGTH = 8;
        this.SAS_SERVER_TYPE_OFFSET = 224;
        this.SAS_SERVER_TYPE_LENGTH = 16;
        this.OS_VERSION_NUMBER_OFFSET = 240;
        this.OS_VERSION_NUMBER_LENGTH = 16;
        this.OS_MAKER_OFFSET = 256;
        this.OS_MAKER_LENGTH = 16;
        this.OS_NAME_OFFSET = 272;
        this.OS_NAME_LENGTH = 16;
        this.PAGE_BIT_OFFSET_X86 = 16;
        this.PAGE_BIT_OFFSET_X64 = 32;
        this.SUBHEADER_POINTER_LENGTH_X86 = 12;
        this.SUBHEADER_POINTER_LENGTH_X64 = 24;
        this.PAGE_TYPE_OFFSET = 0;
        this.PAGE_TYPE_LENGTH = 2;
        this.BLOCK_COUNT_OFFSET = 2;
        this.BLOCK_COUNT_LENGTH = 2;
        this.SUBHEADER_COUNT_OFFSET = 4;
        this.SUBHEADER_COUNT_LENGTH = 2;
        this.PAGE_META_TYPE = 0;
        this.PAGE_DATA_TYPE = 256;
        this.PAGE_MIX_TYPE = [512, 640];
        this.PAGE_AMD_TYPE = 1024;
        this.PAGE_METC_TYPE = 16384;
        this.PAGE_COMP_TYPE = -28672;
        this.PAGE_MIX_DATA_TYPE = this.PAGE_MIX_TYPE.concat(this.PAGE_DATA_TYPE);
        this.PAGE_META_MIX_AMD = [this.PAGE_META_TYPE].concat(this.PAGE_MIX_TYPE, this.PAGE_AMD_TYPE);
        this.PAGE_ANY = this.PAGE_META_MIX_AMD.concat(this.PAGE_DATA_TYPE, this.PAGE_METC_TYPE, this.PAGE_COMP_TYPE);
        this.SUBHEADER_POINTERS_OFFSET = 8;
        this.TRUNCATED_SUBHEADER_ID = 1;
        this.COMPRESSED_SUBHEADER_ID = 4;
        this.COMPRESSED_SUBHEADER_TYPE = 1;

        this.parent = parent;
        this.properties = new SASProperties();
        this.properties.filename = path.basename(parent.path);

        // Check magic number
        let h = Buffer.alloc(288);
        fs.readSync(parent._file, h, 0, 288, null);
        parent.cached_page = h;
        if (h.length < 288) {
            throw new Error('header too short (not a sas7bdat file?)');
        }
        if (!this.check_magic_number(h)) {
            throw new Error('magic number mismatch');
        }
        let align1 = 0;
        let align2 = 0;
        let offsets_and_lengths = {
            [this.ALIGN_1_OFFSET]: this.ALIGN_1_LENGTH,
            [this.ALIGN_2_OFFSET]: this.ALIGN_2_LENGTH
        };
        const align_vals = parent._read_bytes(offsets_and_lengths);
        if (Buffer.from(this.U64_BYTE_CHECKER_VALUE).equals(align_vals[this.ALIGN_1_OFFSET])) {
            align2 = this.ALIGN_2_VALUE;
            this.properties.u64 = true;
        }
        if (Buffer.from(this.ALIGN_1_CHECKER_VALUE).equals(align_vals[this.ALIGN_2_OFFSET])) {
            align1 = this.ALIGN_1_VALUE;
        }
        const total_align = align1 + align2;
        offsets_and_lengths = {
            [this.ENDIANNESS_OFFSET]: this.ENDIANNESS_LENGTH,
            [this.PLATFORM_OFFSET]: this.PLATFORM_LENGTH,
            [this.DATASET_OFFSET]: this.DATASET_LENGTH,
            [this.FILE_TYPE_OFFSET]: this.FILE_TYPE_LENGTH,
            [this.DATE_CREATED_OFFSET + align1]: this.DATE_CREATED_LENGTH,
            [this.DATE_MODIFIED_OFFSET + align1]: this.DATE_MODIFIED_LENGTH,
            [this.HEADER_SIZE_OFFSET + align1]: this.HEADER_SIZE_LENGTH,
            [this.PAGE_SIZE_OFFSET + align1]: this.PAGE_SIZE_LENGTH,
            [this.PAGE_COUNT_OFFSET + align1]: this.PAGE_COUNT_LENGTH + align2,
            [this.SAS_RELEASE_OFFSET + total_align]: this.SAS_RELEASE_LENGTH,
            [this.SAS_SERVER_TYPE_OFFSET + total_align]: this.SAS_SERVER_TYPE_LENGTH,
            [this.OS_VERSION_NUMBER_OFFSET + total_align]: this.OS_VERSION_NUMBER_LENGTH,
            [this.OS_MAKER_OFFSET + total_align]: this.OS_MAKER_LENGTH,
            [this.OS_NAME_OFFSET + total_align]: this.OS_NAME_LENGTH
        };
        const vals = parent._read_bytes(offsets_and_lengths);
        this.properties.endianess = vals[this.ENDIANNESS_OFFSET].toString() === '\u0001' ? 'little' : 'big';
        parent.endianess = this.properties.endianess;
        if (vals[this.PLATFORM_OFFSET].toString() === '1') {
            this.properties.platform = 'unix';
        } else if (vals[this.PLATFORM_OFFSET].toString() === '2') {
            this.properties.platform = 'windows';
        } else {
            this.properties.platform = 'unknown';
        }

        this.properties.name = parent._read_val(
            's', vals[this.DATASET_OFFSET], this.DATASET_LENGTH
        );
        this.properties.file_type = parent._read_val(
            's', vals[this.FILE_TYPE_OFFSET], this.FILE_TYPE_LENGTH
        );

        // Timestamp is epoch 01/01/1960
        try {
            this.properties.date_created = datetime(1960, 1, 1) + timedelta(
                'seconds', parent._read_val(
                    'd', vals[this.DATE_CREATED_OFFSET + align1],
                    this.DATE_CREATED_LENGTH
                )
            );
        } catch (err) { }
        try {
            this.properties.date_modified = datetime(1960, 1, 1) + timedelta(
                'seconds', parent._read_val(
                    'd', vals[this.DATE_MODIFIED_OFFSET + align1],
                    this.DATE_MODIFIED_LENGTH
                )
            );
        } catch (err) { }

        this.properties.header_length = parent._read_val(
            'i', vals[this.HEADER_SIZE_OFFSET + align1],
            this.HEADER_SIZE_LENGTH
        );
        if (this.properties.u64 && this.properties.header_length !== 8192) {
            parent.logger.warning(`header length ${this.properties.header_length} !== 8192`);
        }

        const tmp = Buffer.alloc(this.properties.header_length - 288);
        fs.readSync(parent._file, tmp, 0, this.properties.header_length - 288, null);
        parent.cached_page = Buffer.concat([parent.cached_page, tmp]);
        h = parent.cached_page;
        if (h.length !== this.properties.header_length) {
            throw new Error('header too short (not a sas7bdat file?)');
        }
        this.properties.page_length = parent._read_val(
            'i', vals[this.PAGE_SIZE_OFFSET + align1],
            this.PAGE_SIZE_LENGTH
        );
        this.properties.page_count = parent._read_val(
            'i', vals[this.PAGE_COUNT_OFFSET + align1],
            this.PAGE_COUNT_LENGTH
        );
        this.properties.sas_release = parent._read_val(
            's', vals[this.SAS_RELEASE_OFFSET + total_align],
            this.SAS_RELEASE_LENGTH
        );
        this.properties.server_type = parent._read_val(
            's', vals[this.SAS_SERVER_TYPE_OFFSET + total_align],
            this.SAS_SERVER_TYPE_LENGTH
        );
        this.properties.os_type = parent._read_val(
            's', vals[this.OS_VERSION_NUMBER_OFFSET + total_align],
            this.OS_VERSION_NUMBER_LENGTH
        );
        if (vals[this.OS_NAME_OFFSET + total_align] !== 0) {
            this.properties.os_name = parent._read_val(
                's', vals[this.OS_NAME_OFFSET + total_align],
                this.OS_NAME_LENGTH
            );
        } else {
            this.properties.os_name = parent._read_val(
                's', vals[this.OS_MAKER_OFFSET + total_align],
                this.OS_MAKER_LENGTH
            );
        }
        parent.u64 = this.properties.u64;
    }

    get PAGE_BIT_OFFSET() {
        return this.properties.u64 ? this.PAGE_BIT_OFFSET_X64 : this.PAGE_BIT_OFFSET_X86;
    }

    get SUBHEADER_POINTER_LENGTH() {
        return this.properties.u64 ? this.SUBHEADER_POINTER_LENGTH_X64 : this.SUBHEADER_POINTER_LENGTH_X86;
    }

    check_magic_number(header) {
        return this.MAGIC.equals(header.slice(0, this.MAGIC.length));
    }

    parse_metadata() {
        let done = false;
        while (!done) {
            this.parent.cached_page = Buffer.alloc(this.properties.page_length);
            fs.readSync(this.parent._file, this.parent.cached_page, 0, this.properties.page_length, null);
            if (this.parent.cached_page.length <= 0) {
                break;
            }
            if (this.parent.cached_page.length !== this.properties.page_length) {
                throw new Error('Failed to read a meta data page from file');
            }
            done = this.process_page_meta();
        }
    }

    read_page_header() {
        const bit_offset = this.PAGE_BIT_OFFSET;
        const vals = this.parent._read_bytes({
            [this.PAGE_TYPE_OFFSET + bit_offset]: this.PAGE_TYPE_LENGTH,
            [this.BLOCK_COUNT_OFFSET + bit_offset]: this.BLOCK_COUNT_LENGTH,
            [this.SUBHEADER_COUNT_OFFSET + bit_offset]: this.SUBHEADER_COUNT_LENGTH
        });

        this.parent.current_page_type = this.parent._read_val(
            'h', vals[this.PAGE_TYPE_OFFSET + bit_offset],
            this.PAGE_TYPE_LENGTH
        );
        this.parent.current_page_block_count = this.parent._read_val(
            'h', vals[this.BLOCK_COUNT_OFFSET + bit_offset],
            this.BLOCK_COUNT_LENGTH
        );
        this.parent.current_page_subheaders_count = this.parent._read_val(
            'h', vals[this.SUBHEADER_COUNT_OFFSET + bit_offset],
            this.SUBHEADER_COUNT_LENGTH
        );
    }

    process_page_meta() {
        this.read_page_header();
        if (this.PAGE_META_MIX_AMD.includes(this.parent.current_page_type)) {
            this.process_page_metadata();
        }
        return this.PAGE_MIX_DATA_TYPE.includes(this.parent.current_page_type) || this.parent.current_page_data_subheader_pointers;
    }

    process_page_metadata() {
        const parent = this.parent;
        const bit_offset = this.PAGE_BIT_OFFSET;
        for (let i = 0; i < parent.current_page_subheaders_count; i++) {
            const pointer = this.process_subheader_pointers(this.SUBHEADER_POINTERS_OFFSET + bit_offset, i);
            if (!pointer.length) {
                continue;
            }
            if (pointer.compression !== this.TRUNCATED_SUBHEADER_ID) {
                const subheader_signature = this.read_subheader_signature(pointer.offset);
                const subheader_index = this.get_subheader_class(subheader_signature, pointer.compression, pointer.type);
                if (subheader_index !== null) {
                    if (subheader_index !== this.DATA_SUBHEADER_INDEX) {
                        const Cls = this.SUBHEADER_INDEX_TO_CLASS[subheader_index];
                        if (Cls === undefined) {
                            throw new NotImplementedError();
                        }
                        new Cls(parent).process_subheader(pointer.offset, pointer.length);
                    } else {
                        parent.current_page_data_subheader_pointers.push(pointer);
                    }
                } else {
                    parent.logger.debug('unknown subheader signature');
                }
            }
        }
    }

    read_subheader_signature(offset) {
        const length = this.properties.u64 ? 8 : 4;
        return this.parent._read_bytes({[offset]: length})[offset];
    }

    get_subheader_class(signature, compression, type) {
        let index = this.SUBHEADER_SIGNATURE_TO_INDEX[signature.toString('hex')];
        if (this.properties.compression !== null && index === null && (compression === this.COMPRESSED_SUBHEADER_ID || compression === 0) && type === this.COMPRESSED_SUBHEADER_TYPE) {
            index = this.DATA_SUBHEADER_INDEX;
        }
        return index;
    }

    process_subheader_pointers(offset, subheader_pointer_index) {
        const length = this.properties.u64 ? 8 : 4;
        const subheader_pointer_length = this.SUBHEADER_POINTER_LENGTH;
        const total_offset = offset + subheader_pointer_length * subheader_pointer_index;
        const vals = this.parent._read_bytes({
            [total_offset]: length,
            [total_offset + length]: length,
            [total_offset + 2 * length]: 1,
            [total_offset + 2 * length + 1]: 1
        });

        const subheader_offset = this.parent._read_val(
            'i', vals[total_offset], length
        );
        const subheader_length = this.parent._read_val(
            'i', vals[total_offset + length], length
        );
        const subheader_compression = this.parent._read_val(
            'b', vals[total_offset + 2 * length], 1
        );
        const subheader_type = this.parent._read_val(
            'b', vals[total_offset + 2 * length + 1], 1
        );

        return new SubheaderPointer(subheader_offset, subheader_length, subheader_compression, subheader_type);
    }
}

const cleanUp = () => {
    for (const fd of SAS7BDAT._open_files) {
        fs.closeSync(fd);
    }
};

process.on('exit', () => cleanUp());

SAS7BDAT.parse = filename => {
    const sas7bdat = new SAS7BDAT(filename);
    return Array.from(sas7bdat);
};

module.exports = SAS7BDAT;

console.log(SAS7BDAT.parse('test.sas7bdat'));