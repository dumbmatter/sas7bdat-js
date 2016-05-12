module.exports = {
    raw: (buf, off, len) => buf.slice(off, off + len),
    int: (buf, off, len) => buf.readIntLE(off, len / 2), // Not really sure why len / 2, but it seems to work...
    str: (buf, off, len) => buf.slice(off, off + len).toString().replace(/\0/g, ''), // http://stackoverflow.com/a/22809513/786644
    flo: (buf, off) => buf.readDoubleLE(off)
};
