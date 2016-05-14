const assert = require('assert');
const denodeify = require('denodeify');
const fs = require('fs');
const path = require('path');
const csvParse = require('csv-parse');
const sas7bdat = require('../index');

const csvParseAsync = denodeify(csvParse);

const sasFilenames = fs.readdirSync(path.join(__dirname, 'data/sas7bdat'));

const assertCloseEnough = (x, y) => {
    if (Math.abs((x - y) / x) > 1e-10) {
        throw new Error(`Floats ${x} and ${y} are too far apart`);
    }
};

// Smoke tests - run on various data files and see if there is an error.
// Kind of redundant with the StatTransfer tests below...
describe.skip('Smoke tests', function () {
    this.timeout(100000);
    for (const filename of sasFilenames) {
        it(filename, () => sas7bdat.parse(path.join(__dirname, 'data/sas7bdat', filename)));
    }
});

describe('Compare to StatTransfer CSV export', function () {
    this.timeout(100000);

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
            const rows = await sas7bdat.parse(path.join(__dirname, 'data/sas7bdat', filename), options);

            const filename2 = filename.replace('sas7bdat', 'csv');
            const csv = fs.readFileSync(path.join(__dirname, 'data/csv', filename2), 'utf8');
            const rows2 = await csvParseAsync(csv, {});

            assert.equal(rows.length, rows2.length);
            for (let i = 0; i < rows.length; i++) {
                const cols = Object.keys(rows[i]);
                assert.deepEqual(cols, Object.keys(rows2[i]));

                for (const col of cols) {
                    if (typeof rows[i][col] === 'string') {
                        assert.equal(rows[i][col], rows2[i][col]);
                    } else {
                        const f = parseFloat(rows2[i][col]);
                        assertCloseEnough(rows[i][col], f);
                    }
                }
            }
        });
    }
});

describe('Error handling', async () => {
    it('Should throw error when file does not exist', async () => {
        const filename = 'does_not_exist.sas7bdat';
        try {
            await sas7bdat.parse(filename);
            throw new Error('Should not reach here');
        } catch (err) {
            assert(err.message.includes('ENOENT'));
            assert(err.message.includes(filename));
        }
    });
});

describe('Options', () => {
    describe('dateFormatter', () => {
        it('Default date formatting', async () => {
            const rows = await sas7bdat.parse(path.join(__dirname, 'data/sas7bdat/datetime.sas7bdat'));

            assert.deepEqual(rows[1], ['2015-02-02T14:42:12.000Z', '2015-02-02', '2015-02-02', '2015-02-02', '14:42:12.000']);
        });

        it('Custom dateFormatter function', async () => {
            const rows = await sas7bdat.parse(path.join(__dirname, 'data/sas7bdat/datetime.sas7bdat'), {
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
            const rows = await sas7bdat.parse(path.join(__dirname, 'data/sas7bdat/andy.sas7bdat'), {
                rowFormat: 'object'
            });
            assert.deepEqual(rows[0], {sales: 73.2, price: 5.69, advert: 1.3});
            rows.forEach(row => assert.equal(typeof row, 'object'));
        });
    });

    describe('skipHeader', () => {
        it('Skips header when true', async () => {
            const rows = await sas7bdat.parse(path.join(__dirname, 'data/sas7bdat/andy.sas7bdat'));
            const rows2 = await sas7bdat.parse(path.join(__dirname, 'data/sas7bdat/andy.sas7bdat'), {
                skipHeader: true
            });
            assert.deepEqual(rows2[0], [73.2, 5.69, 1.3]);
            assert.equal(rows.length, rows2.length + 1);
        });

        it('Does nothing when rowFormat=object', async () => {
            const rows = await sas7bdat.parse(path.join(__dirname, 'data/sas7bdat/andy.sas7bdat'), {
                skipHeader: false,
                rowFormat: 'object'
            });
            const rows2 = await sas7bdat.parse(path.join(__dirname, 'data/sas7bdat/andy.sas7bdat'), {
                skipHeader: true,
                rowFormat: 'object'
            });
            assert.deepEqual(rows, rows2);
        });
    });
});
