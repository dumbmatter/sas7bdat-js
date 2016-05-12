const C = require('./constants');
const filterSubhs = require('./filterSubhs');
const read = require('./read');

const readColumnAttributes = (colAttr, u64) => {
    const info = [];
    let j = 0;
    const lcav = u64 ? 16 : 12;

    for (const subh of colAttr) {
        const cmax = (subh.len - (u64 ? 28 : 20)) / lcav;
        for (let i = 0; i < cmax; i++) {
            const base = (i + 1) * lcav;
            info[j] = {
                offset: read.int(subh.raw, base, u64 ? 8 : 4),
                len: read.int(subh.raw, base + (u64 ? 8 : 4), 4),
                type: read.int(subh.raw, base + (u64 ? 14 : 10), 1) === 1 ? 'numeric' : 'character'
            };
            j += 1;
        }
    }

    return info;
};

const readColumnNames = (colNameSubhs, colTextSubhs, u64) => {
    const names = [];
    let j = 0;
    const offp = u64 ? 8 : 4;

    for (const subh of colNameSubhs) {
        const cmax = (subh.len - (u64 ? 28 : 20)) / 8;
        for (let i = 0; i < cmax; i++) {
            const base = (u64 ? 16 : 12) + i * 8;

            // Changed the 2s to 4s, not sure why
            const hdr = read.int(subh.raw, base, 4);
            const off = read.int(subh.raw, base + 2, 4);
            const len = read.int(subh.raw, base + 4, 4);

            names[j] = read.str(colTextSubhs[hdr].raw, off + offp, len);
            j = j + 1;
        }
    }

    return names;
};

// Like make.unique in R
const makeUnique = arr => {
    const seen = {};

    return arr.map(x => {
        let y = x;
        let i = 0;
        while (seen.hasOwnProperty(y)) {
            i += 1;
            y = `${x}.${i}`;
        }

        seen[y] = true;

        return y;
    });
};

const readColumnLabelsFormats = (colLabSubhs, colTextSubhs, u64) => {
    if (colLabSubhs.length < 1) {
        return null;
    }

    const offp = u64 ? 8 : 4;

    return colLabSubhs.map(colLabSubh => {
        const fbase = u64 ? 46 : 34;
        const lbase = u64 ? 52 : 40;

        // Changed the 2s to 4s, not sure why
        const fhdr = read.int(colLabSubh.raw, fbase, 4);
        const foff = read.int(colLabSubh.raw, fbase + 2, 4);
        const flen = read.int(colLabSubh.raw, fbase + 4, 4);

        // Changed the 2s to 4s, not sure why
        const lhdr = read.int(colLabSubh.raw, lbase, 4);
        const loff = read.int(colLabSubh.raw, lbase + 2, 4);
        const llen = read.int(colLabSubh.raw, lbase + 4, 4);

        const lab = {fhdr, foff, flen, lhdr, loff, llen};

        if (flen > 0) {
            lab.format = read.str(colTextSubhs[fhdr].raw, foff + offp, flen);
        }
        if (llen > 0) {
            lab.label = read.str(colTextSubhs[lhdr].raw, loff + offp, llen);
        }

        return lab;
    });
};

module.exports = (subhs, u64) => {
    // Parse col size subheader
    const colSize = filterSubhs(subhs, C.SUBH_COLSIZE);
    if (colSize.length !== 1) {
        throw new Error(`Found ${colSize.length} column size subheaders where 1 expected`);
    }
    const colCount = read.int(colSize[0].raw, u64 ? 8 : 4, u64 ? 8 : 4);

    // Read column information
    const colTextSubhs = filterSubhs(subhs, C.SUBH_COLTEXT);
    if (colTextSubhs.length < 1) {
        throw new Error('No column text subheaders found');
    }

    const colAttrSubhs = filterSubhs(subhs, C.SUBH_COLATTR);
    if (colAttrSubhs.length < 1) {
        throw new Error('No column attribute subheaders found');
    }

    const colAttr = readColumnAttributes(colAttrSubhs, u64);
    if (colAttr.length !== colCount) {
        throw new Error(`Found ${colAttr.length} column attributes where ${colCount} expected`);
    }

    const colNameSubhs = filterSubhs(subhs, C.SUBH_COLNAME);
    if (colNameSubhs.length < 1) {
        throw new Error('No column name subheaders found');
    }

    let colNames = readColumnNames(colNameSubhs, colTextSubhs, u64);
    if (colNames.length !== colCount) {
        throw new Error(`Found ${colNames.length} column attributes where ${colCount} expected`);
    }
    colNames = makeUnique(colNames); // So there are no name collissions when they are used as properties of a JS object

    const colLabSubhs = filterSubhs(subhs, C.SUBH_COLLABS);
    let colLabs = readColumnLabelsFormats(colLabSubhs, colTextSubhs, u64);
    if (colLabs === null) {
        colLabs = new Array(colCount);
    }
    if (colLabs.length !== colCount) {
        throw new Error(`Found ${colLabs.length} formats and labels where ${colCount} expected`);
    }

    // Collate column information
    return colNames.map((name, i) => {
        return Object.assign({name}, colAttr[i], colLabs[i]);
    });
};
