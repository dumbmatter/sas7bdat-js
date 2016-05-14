# sas7bdat-js

Read SAS files in JavaScript. Because you always wanted to do that, right?

Ported from [the sas7bdat Python package](https://bitbucket.org/jaredhobbs/sas7bdat).

## Use

`SAS7BDAT.parse` returns a promise that resolves to an array of the complete rows of the file:

    const SAS7BDAT = require('sas7bdat');

    SAS7BDAT.parse('test.sas7bdat')
        .then(rows => console.log(rows))
        .catch(err => console.log(err));

`SAS7BDAT.createReadStream` returns a promise that resolves to a stream that will emit individual rows:

    const SAS7BDAT = require('sas7bdat');

    SAS7BDAT.createReadStream('test.sas7bdat');
        .then(stream => {
            stream.on('data', row => rows.push(row));
            stream.on('end', () => console.log(rows));
            stream.on('error', err => console.log(err));
        })
        .catch(err => console.log(err));

## Similar open source projects for other languages

- Python: https://bitbucket.org/jaredhobbs/sas7bdat (sas7bdat-js is just a port of this)
- R: https://github.com/BioStatMatt/sas7bdat
- R: https://github.com/hadley/haven