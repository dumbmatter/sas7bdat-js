const assert = require('assert');
const denodeify = require('denodeify');
const fs = require('fs');
const path = require('path');
const stringify = require('csv-stringify');
const sas7bdat = require('../index');

const stringifyAsync = denodeify(stringify);

const sasFilenames = fs.readdirSync(path.join(__dirname, 'data/sas7bdat'))
    .filter(filename => filename.includes('sas7bdat'));

// Smoke tests - run on various data files and see if there is an error
describe('Smoke tests', function () {
    this.timeout(20000);
    for (const filename of sasFilenames) {
        it(filename, () => sas7bdat.parse(path.join(__dirname, 'data/sas7bdat', filename)));
    }
});

describe.only('Compare to StatTransfer CSV export', function () {
    this.timeout(20000);

    const options = {
        header: true,
        quotedString: true
    };

    for (const filename of sasFilenames) {
        it(filename, async () => {
            const data = await sas7bdat.parse(path.join(__dirname, 'data/sas7bdat', filename));
            options.columns = data.cols.map(col => col.name);
            let csv = await stringifyAsync(data.rows, options);

            // Replace NaN with nothing, to facilitate comparison
            csv = csv.replace(/,NaN/g, ',');

            const filename2 = filename.replace('sas7bdat', 'csv');
            const csv2 = fs.readFileSync(path.join(__dirname, 'data/csv', filename2), 'utf8');

            assert.equal(csv, csv2);
        });
    }
});
