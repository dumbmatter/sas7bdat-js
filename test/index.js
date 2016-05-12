const fs = require('fs');
const path = require('path');
const sas7bdat = require('../index');

// Smoke tests - run on various data files and see if there is an error
describe('smoke tests', function () {
    this.timeout(20000);
    const filenames = fs.readdirSync(path.join(__dirname, 'data/sas7bdat')).filter(filename => filename.includes('sas7bdat'));
    for (const filename of filenames) {
        it(filename, () => sas7bdat.parse(path.join(__dirname, 'data/sas7bdat', filename)));
    }
});