const denodeify = require('denodeify');
const fs = require('fs');
const C = require('./constants');
const read = require('./read');

const fsReadAsync = denodeify(fs.read);

const checkMagicNumber = header => C.MAGIC_NUMBER.equals(header.slice(0, C.MAGIC_NUMBER.length));

module.exports = async fd => {
    // Check magic number
    let header = Buffer.alloc(288);
    let bytesRead = await fsReadAsync(fd, header, 0, 288, null);
    if (bytesRead < 288) {
        throw new Error('Header too short (not a sas7bdat file?)');
    }
    if (!checkMagicNumber(header)) {
        throw new Error('Magic number mismatch');
    }

    // Check for 32 or 64 bit alignment
    const align1 = read.raw(header, 32, 1).toString('hex') === '33' ? 4 : 0;

    // If align1 === 4, file is u64 type
    const u64 = align1 === 4;

    const align2 = read.raw(header, 35, 1).toString('hex') === '33' ? 4 : 0;

    const endian = read.raw(header, 37, 1).toString('hex') === '01' ? 'little' : 'big';
    if (endian === 'big') {
        throw new Error('Big endian files are not supported');
    }

    const char = read.str(header, 39, 1);
    let platform;
    if (char === '1') {
        platform = 'unix';
    } else if (char === '2') {
        platform = 'windows';
    } else {
        platform = 'unknown';
    }

    // Timestamp is epoch 01/01/1960, offset by some seconds in the header
    const epoch = new Date('1960-01-01');
    const dateCreated = new Date(epoch.getTime() + read.flo(header, 164 + align1) * 1000);
    const dateModified = new Date(epoch.getTime() + read.flo(header, 172 + align1) * 1000);

    // Read the remaining header
    const headerLength = read.int(header, 196 + align2, 8);
    const remainingHeader = Buffer.alloc(headerLength - 288);
    bytesRead = await fsReadAsync(fd, remainingHeader, 0, headerLength - 288, null);
    header = Buffer.concat([header, remainingHeader]);
    if (bytesRead < headerLength - 288) {
        throw new Error('Header too short (not a sas7bdat file?)');
    }

    const pageSize = read.int(header, 200 + align2, 8);
    if (pageSize < 0) {
        throw new Error('Page size is negative');
    }

    const pageCount = read.int(header, 204 + align2, 8);
    if (pageCount < 1) {
        throw new Error('Page count is not positive');
    }

    const sasVersion = read.str(header, 216 + align1 + align2, 8);

    // sasHost is a 16 byte field, but only the first eight are used
    const sasHost = read.str(header, 224 + align1 + align2, 8);

    const osVersion = read.str(header, 240 + align1 + align2, 16);
    const osMaker = read.str(header, 256 + align1 + align2, 16);
    const osName = read.str(header, 272 + align1 + align2, 16);

    return {
        info: {
            dateCreated,
            dateModified,
            endian,
            osMaker,
            osName,
            osVersion,
            platform,
            sasHost,
            sasVersion
        },
        pageCount,
        pageSize,
        u64
    };
};
