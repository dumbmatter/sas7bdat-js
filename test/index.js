const assert = require('assert');
const denodeify = require('denodeify');
const fs = require('fs');
const path = require('path');
const csvParse = require('csv-parse');
const SAS7BDAT = require('../index');

const csvParseAsync = denodeify(csvParse);

const sasFolder = path.join(__dirname, 'data/sas7bdat');
const csvFolder = path.join(__dirname, 'data/csv');

// Something weird about supppe.sas7bdat and suppesv.sas7bdat, row counts match but maybe come out of order? Python one seems to do it too.
// se.sas7bdat doesn't work in Python one either??
const skip = [];//['se.sas7bdat', 'sv.sas7bdat'];
const sasFilenames = fs.readdirSync(sasFolder).sort((a, b) => {
    return fs.statSync(path.join(sasFolder, a)).size - fs.statSync(path.join(sasFolder, b)).size;
}).filter(filename => !skip.includes(filename));
console.log(sasFilenames);

const filenameDoesNotExist = 'does_not_exist.sas7bdat';

const assertCloseEnough = (x, y) => {
    if (Math.abs((x - y) / x) > 1e-10) {
        throw new Error(`Floats ${x} and ${y} are too far apart`);
    }
};

// Smoke tests - run on various data files and see if there is an error.
// Kind of redundant with the StatTransfer tests below...
describe.skip('Smoke tests', function () {
    this.timeout(10000000);
    for (const filename of sasFilenames) {
        it(filename, () => SAS7BDAT.parse(sasFolder, filename));
    }
});

describe('Compare to StatTransfer CSV export', function () {
    this.timeout(1000000);

    const options = {
        dateFormatter: (d, output_format) => {
            // Matching the format of StatTransfer
            if (output_format === 'date') {
                return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
            }
            if (output_format === 'time') {
                return d.toISOString().slice(11, 19);
            }
            return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()} ${d.toISOString().slice(11, 19)}`;
        }
    };

    for (const filename of sasFilenames) {
        it(filename, async () => {
            const rows = await SAS7BDAT.parse(path.join(sasFolder, filename), options);

            const filename2 = filename.replace('sas7bdat', 'csv');
            const csv = fs.readFileSync(path.join(csvFolder, filename2), 'utf8');
            const rows2 = await csvParseAsync(csv, {});

            assert.equal(rows.length, rows2.length);
            for (let i = 0; i < rows.length; i++) {
                const cols = Object.keys(rows[i]);
                assert.deepEqual(cols, Object.keys(rows2[i]));

                for (const col of cols) {
                    if (typeof rows[i][col] === 'string') {
                        assert.equal(rows[i][col], rows2[i][col], `row ${i} equality`);
                    } else {
                        const f = parseFloat(rows2[i][col]);
                        assertCloseEnough(rows[i][col], f);
                    }
                }
            }
        });
    }
});

describe('Normal functionality', async () => {
    it('should close file when done streaming', async () => {
        const sas7bdat = new SAS7BDAT(path.join(sasFolder, 'andy.sas7bdat'));
        const rows = [];

        return new Promise(async (resolve, reject) => {
            const stream = await sas7bdat.create_read_stream();
            stream.on('data', row => rows.push(row));
            stream.on('error', err => reject(err));
            stream.on('end', () => {
                assert.equal(rows.length, 76);

                // Will throw error if file is already closed, as it should be
                assert.throws(() => {
                    fs.readSync(sas7bdat._file, Buffer.alloc(2), 0, 2);
                }, /EBADF/);

                resolve();
            });
        });
    });
});

describe('Error handling', async () => {
    it('should throw error when file does not exist', async () => {
        try {
            await SAS7BDAT.parse(filenameDoesNotExist);
            throw new Error('Should not reach here');
        } catch (err) {
            assert(err.message.includes('ENOENT'));
            assert(err.message.includes(filenameDoesNotExist));
        }
    });
});

describe('Options', () => {
    describe('dateFormatter', () => {
        it('default date formatting', async () => {
            const rows = await SAS7BDAT.parse(path.join(sasFolder, 'datetime.sas7bdat'));

            assert.deepEqual(rows[1], ['2015-02-02T14:42:12.000Z', '2015-02-02', '2015-02-02', '2015-02-02', '14:42:12.000']);
        });

        it('custom dateFormatter function', async () => {
            const rows = await SAS7BDAT.parse(path.join(sasFolder, 'datetime.sas7bdat'), {
                dateFormatter: (d, outputFormat) => {
                    if (outputFormat === 'date') {
                        return 'date';
                    }
                    if (outputFormat === 'time') {
                        return 'time';
                    }
                    return 'datetime';
                }
            });

            assert.deepEqual(rows[1], ['datetime', 'date', 'date', 'date', 'time']);
        });
    });

    describe('rowFormat', () => {
        it('object', async () => {
            const rows = await SAS7BDAT.parse(path.join(sasFolder, 'andy.sas7bdat'), {
                rowFormat: 'object'
            });
            assert.deepEqual(rows[0], {sales: 73.2, price: 5.69, advert: 1.3});
            rows.forEach(row => assert.equal(typeof row, 'object'));
        });
    });

    describe('skipHeader', () => {
        it('skips header when true', async () => {
            const rows = await SAS7BDAT.parse(path.join(sasFolder, 'andy.sas7bdat'));
            const rows2 = await SAS7BDAT.parse(path.join(sasFolder, 'andy.sas7bdat'), {
                skipHeader: true
            });
            assert.deepEqual(rows2[0], [73.2, 5.69, 1.3]);
            assert.equal(rows.length, rows2.length + 1);
        });

        it('does nothing when rowFormat=object', async () => {
            const rows = await SAS7BDAT.parse(path.join(sasFolder, 'andy.sas7bdat'), {
                skipHeader: false,
                rowFormat: 'object'
            });
            const rows2 = await SAS7BDAT.parse(path.join(sasFolder, 'andy.sas7bdat'), {
                skipHeader: true,
                rowFormat: 'object'
            });
            assert.deepEqual(rows, rows2);
        });
    });

    describe('extra*FormatStrings', () => {
        it('extraDateFormatStrings with string', async () => {
            const sas7bdat = new SAS7BDAT(filenameDoesNotExist, {
                extraDateFormatStrings: 'foo'
            });
            assert.equal(sas7bdat.DATE_FORMAT_STRINGS.length, 8);
            assert(sas7bdat.DATE_FORMAT_STRINGS.includes('foo'));
        });

        it('extraDateFormatStrings with array', async () => {
            const sas7bdat = new SAS7BDAT(filenameDoesNotExist, {
                extraDateFormatStrings: ['foo', 'bar']
            });
            assert.equal(sas7bdat.DATE_FORMAT_STRINGS.length, 9);
            assert(sas7bdat.DATE_FORMAT_STRINGS.includes('foo'));
            assert(sas7bdat.DATE_FORMAT_STRINGS.includes('bar'));
        });

        it('extraTimeFormatStrings with string', async () => {
            const sas7bdat = new SAS7BDAT(filenameDoesNotExist, {
                extraTimeFormatStrings: 'foo'
            });
            assert.equal(sas7bdat.TIME_FORMAT_STRINGS.length, 2);
            assert(sas7bdat.TIME_FORMAT_STRINGS.includes('foo'));
        });

        it('extraTimeFormatStrings with array', async () => {
            const sas7bdat = new SAS7BDAT(filenameDoesNotExist, {
                extraTimeFormatStrings: ['foo', 'bar']
            });
            assert.equal(sas7bdat.TIME_FORMAT_STRINGS.length, 3);
            assert(sas7bdat.TIME_FORMAT_STRINGS.includes('foo'));
            assert(sas7bdat.TIME_FORMAT_STRINGS.includes('bar'));
        });

        it('extraDatetimeFormatStrings with string', async () => {
            const sas7bdat = new SAS7BDAT(filenameDoesNotExist, {
                extraDatetimeFormatStrings: 'foo'
            });
            assert.equal(sas7bdat.DATE_TIME_FORMAT_STRINGS.length, 2);
            assert(sas7bdat.DATE_TIME_FORMAT_STRINGS.includes('foo'));
        });

        it('extraDatetimeFormatStrings with array', async () => {
            const sas7bdat = new SAS7BDAT(filenameDoesNotExist, {
                extraDatetimeFormatStrings: ['foo', 'bar']
            });
            assert.equal(sas7bdat.DATE_TIME_FORMAT_STRINGS.length, 3);
            assert(sas7bdat.DATE_TIME_FORMAT_STRINGS.includes('foo'));
            assert(sas7bdat.DATE_TIME_FORMAT_STRINGS.includes('bar'));
        });
    });

    describe('encoding', () => {
        it('does something', async () => {
            const rows = await SAS7BDAT.parse(path.join(sasFolder, 'andy.sas7bdat'));
            const rows2 = await SAS7BDAT.parse(path.join(sasFolder, 'andy.sas7bdat'), {
                encoding: 'hex'
            });
            assert.notDeepEqual(rows[0], rows2[0]);
        });
    });
});
