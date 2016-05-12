const C = require('./constants');

module.exports = {
    raw: (buf, off, len) => buf.slice(off, off + len),
    int: (buf, off, len) => buf.readIntLE(off, len / 2), // Not really sure why len / 2, but it seems to work...
    str: (buf, off, len) => buf.slice(off, off + len).toString().replace(/\0/g, ''), // http://stackoverflow.com/a/22809513/786644
    flo: (buf, off) => buf.readDoubleLE(off),
    date: (buf, off, len) => {
console.log(C.EPOCH, buf.readDoubleLE(off) * 1000);
fdo
        return new Date(C.EPOCH + buf.readIntLE(off, len / 2) * 1000);
return val;
    },
    time: (buff, off, len) => {
        const val = buf.slice(off, off + len);
return val;
    },
    datetime: (buf, off, len) => {
        const val = buf.slice(off, off + len);
return val;
    }
/*        elif fmt == 'datetime':
            val = datetime(1960, 1, 1) + timedelta(seconds=val)
        elif fmt == 'time':
            val = (datetime(1960, 1, 1) + timedelta(seconds=val)).time()
        elif fmt == 'date':
            try:
                val = (datetime(1960, 1, 1) + timedelta(days=val)).date()
            except OverflowError:
                # Some data sets flagged with a date format are actually
                # stored as datetime values
                val = datetime(1960, 1, 1) + timedelta(seconds=val)*/
};
