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

    const options = {};

    for (const filename of sasFilenames) {
        it(filename, async () => {
            const rows = await sas7bdat.parse(path.join(__dirname, 'data/sas7bdat', filename));

            const filename2 = filename.replace('sas7bdat', 'csv');
            const csv = fs.readFileSync(path.join(__dirname, 'data/csv', filename2), 'utf8');
            const rows2 = await csvParseAsync(csv, options);

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
