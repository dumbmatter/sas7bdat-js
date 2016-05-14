# sas7bdat-js

Read SAS files in JavaScript. Because you always wanted to do that, right?

Ported from [the sas7bdat Python package](https://bitbucket.org/jaredhobbs/sas7bdat). All functionality should be the same, except sas7bdat-js does not support compression yet.

## Install

    npm install sas7bdat

## Use

`SAS7BDAT.parse` returns a promise that resolves to an array of the complete rows of the file:

    const SAS7BDAT = require('sas7bdat');

    SAS7BDAT.parse('test.sas7bdat')
        .then(rows => console.log(rows))
        .catch(err => console.log(err));

`SAS7BDAT.createReadStream` returns a stream that emits individual rows:

    const SAS7BDAT = require('sas7bdat');

    const stream = SAS7BDAT.createReadStream('test.sas7bdat');
    stream.on('data', row => console.log(row));
    stream.on('end', () => console.log('Done!'));
    stream.on('error', err => console.log(err));

## Options

...coming soon. Options will include:

- Formatting of parsed dates
- Whether you want arrays or objects returned for rows
- All the options of the original Python package

## Tests

    npm test

## Similar open source projects for other languages

- Python: https://bitbucket.org/jaredhobbs/sas7bdat (sas7bdat-js is just a port of this)
- R: https://github.com/BioStatMatt/sas7bdat
- R: https://github.com/hadley/haven