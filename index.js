const denodeify = require('denodeify');
const fs = require('fs-ext');
const sas7bdatFactory = require('./sas7bdat-factory.js');

const fs_open_async = denodeify(fs.open);
const open_file = fs_open_async;

const fs_read_async = denodeify(fs.read);
const read_file = async (sas7bdat, offset, length) => {
    const buffer = Buffer.alloc(length);
    const bytesRead = await fs_read_async(sas7bdat._file, buffer, offset, length, null);

    return {buffer, bytesRead};
};

const fs_seek_async = denodeify(fs.seek);
const seek_file = (sas7bdat, offset) => {
    fs_seek_async(sas7bdat._file, offset, 0);
};

const fs_close_async = denodeify(fs.close);
const close_file = sas7bdat => fs_close_async(sas7bdat._file);

const SAS7BDAT = sas7bdatFactory({open_file, read_file, seek_file, close_file});

module.exports = SAS7BDAT;

/*SAS7BDAT.parse('test/data/sas7bdat/sv.sas7bdat')
    .then(rows => console.log(rows[1]))
    .catch(err => console.log(err));

SAS7BDAT.toCsv('test/data/sas7bdat/sv.sas7bdat', 'test.csv', {
        csvOptions: {
            quotedEmpty: false,
            quotedString: true
        }
    })
    .catch(err => console.log(err));*/
