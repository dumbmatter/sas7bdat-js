// TODO:
// variable names (like colName -> colNames)
// simplify (like colNames can just be array of strings)
// "not sure" - lots of factors of 2 - maybe padding needed everywhere, not just at end? put in read functions
// stream
// tests
// - endian
// - u64
// compare against stattransfer on real files

const denodeify = require('denodeify');
const fs = require('fs');
const C = require('./lib/constants');
const getCols = require('./lib/getCols');
const filterSubhs = require('./lib/filterSubhs');
const parseHeader = require('./lib/parseHeader');
const read = require('./lib/read');

const fsOpenAsync = denodeify(fs.open);
const fsReadAsync = denodeify(fs.read);
const fsCloseAsync = denodeify(fs.close);

const pageTypeString = type => {
    if (C.PAGE_META.includes(type)) {
        return 'meta';
    }
    if (C.PAGE_DATA.includes(type)) {
        return 'data';
    }
    if (C.PAGE_MIX.includes(type)) {
        return 'mix';
    }
    if (C.PAGE_AMD.includes(type)) {
        return 'amd';
    }
    return 'unknown';
};

const readSubheaders = (page, u64) => {
    const subhs = [];
    if (!C.PAGE_META_MIX_AMD.includes(page.type)) {
        return subhs;
    }

    // page offset of subheader pointers
    const oshp = u64 ? 40 : 24;
    // length of subheader pointers
    const lshp = u64 ? 24 : 12;
    // length of first two subheader fields
    const lshf = u64 ? 8 : 4;

    for (let i = 0; i < page.subhCount; i++) {
        const base = oshp + i * lshp;
        subhs[i] = {
            page: page.page,
            offset: read.int(page.data, base, lshf * 2), // Needs to be doubled for colon.sas7bdat, not sure why
            len: read.int(page.data, base + lshf, lshf)
        };
        if (subhs[i].len > 0) {
            subhs[i].raw = read.raw(page.data, subhs[i].offset, subhs[i].len);
            subhs[i].signature = read.raw(subhs[i].raw, 0, 4);
        }
    }

    return subhs;
};

const parse = async file => {
    const fd = await fsOpenAsync(file, 'r');

    const {info, pageCount, pageSize, u64} = await parseHeader(fd);

    // Read pages
    const pages = [];
    for (let i = 0; i < pageCount; i++) {
        const data = Buffer.alloc(pageSize);
        await fsReadAsync(fd, data, 0, pageSize, null);

        const type = read.int(data, u64 ? 32 : 16, 4);

        pages[i] = {
            page: i + 1,
            data,
            type,
            typeString: pageTypeString(type),
            blckCount: read.int(data, u64 ? 34 : 18, 4),
            subhCount: read.int(data, u64 ? 36 : 20, 4)
        };
    }

    // Read all subheaders
    let subhs = [];
    for (const page of pages) {
        subhs = subhs.concat(readSubheaders(page, u64));
    }

    // Parse row size subheader
    let rowSize = filterSubhs(subhs, C.SUBH_ROWSIZE);
    if (rowSize.length !== 1) {
        throw new Error(`Found ${rowSize.length} row size subheaders where 1 expected`);
    }
    rowSize = rowSize[0];
    const rowLength = read.int(rowSize.raw, u64 ? 40 : 20, u64 ? 8 : 4);
    const rowCount = read.int(rowSize.raw, u64 ? 48 : 24, u64 ? 8 : 4);
    //const colCountP1 = read.int(rowSize.raw, u64 ? 72 : 36, u64 ? 8 : 4);
    //const colCountP2 = read.int(rowSize.raw, u64 ? 80 : 40, u64 ? 8 : 4);
    const rowCountFp = read.int(rowSize.raw, u64 ? 120 : 60, u64 ? 8 : 4);

    const cols = getCols(subhs, u64);

    // Check pages for known types
    for (const page of pages) {
        if (!C.PAGE_ANY.includes(page.type)) {
            throw new Error(`Page ${page.page} has unknown type: ${page.type}`);
        }
        if (C.PAGE_METC.includes(page.type) || C.PAGE_COMP.includes(page.type)) {
            throw new Error(`File contains compressed data`);
        }
    }

    // Parse data
    const rows = [];

    let i = 0;
    for (const page of pages) {
        if (!C.PAGE_MIX_DATA.includes(page.type)) {
            continue;
        }

        let base = (u64 ? 32 : 16) + 8;
        let rowCountP;
        if (C.PAGE_MIX.includes(page.type)) {
            rowCountP = rowCountFp;

            // skip subheader pointers
            base = base + page.subhCount * (u64 ? 24 : 12);
            base = base + (base % 8);
        } else {
            // Changed the 2s to 4s, not sure why
            rowCountP = read.int(page.data, u64 ? 34 : 18, 4);
        }

        // round up to 8-byte boundary
        base = Math.floor((base + 7) / 8) * 8 + (base % 8);
        if (rowCountP > rowCount) {
            rowCountP = rowCount;
        }

        const limit = i + rowCountP;
        for (i = i; i < limit; i++) {
            rows[i] = {};
            for (const col of cols) {
                const offset = base + col.offset;
                if (col.len > 0) {
                    let raw = read.raw(page.data, offset, col.len);

                    let len = col.len;
                    if (col.type === 'numeric') {
                        const MIN_NUMERIC_LENGTH = 8;
                        if (len < MIN_NUMERIC_LENGTH) {
                            const padding = [];
                            for (let i = 0; i < (MIN_NUMERIC_LENGTH - len); i++) {
                                padding.push(0x00);
                            }
                            raw = Buffer.concat([Buffer.from(padding), raw]);
                            len = MIN_NUMERIC_LENGTH;
                        }

                        if (col.format && C.TIME_FORMAT_STRINGS.includes(col.format)) {
                            rows[i][col.name] = read.time(raw, 0, len);
                        } else if (col.format && C.DATE_TIME_FORMAT_STRINGS.includes(col.format)) {
                            rows[i][col.name] = read.datetime(raw, 0, len);
                        } else if (col.format && C.DATE_FORMAT_STRINGS.includes(col.format)) {
                            rows[i][col.name] = read.date(raw, 0, len);
                        } else {
                            rows[i][col.name] = read.flo(raw, 0, len);
                        }
                    } else if (col.type === 'character') {
                        rows[i][col.name] = read.str(raw, 0, len).trim();
                    } else {
                        throw new Error(`Column has unknown type: ${col.type}`);
                    }
                }
            }
            base += rowLength;
        }
    }

    if (i !== rowCount) {
        throw new Error(`Found ${i} records where ${rowCount} expected`);
    }

    await fsCloseAsync(fd);

    return {cols, rows, info};
};

module.exports = {parse};
