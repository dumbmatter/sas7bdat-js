# sas7bdat-js

Read SAS files in JavaScript. Because you always wanted to do that, right?

Ported from [the sas7bdat Python package](https://bitbucket.org/jaredhobbs/sas7bdat). All functionality should be the same, except sas7bdat-js does not support compression yet.

## Install

    npm install sas7bdat

## Use

First load the module:

    const SAS7BDAT = require('sas7bdat');

`SAS7BDAT.createReadStream` returns a stream that emits individual rows, one at a time:

    const stream = SAS7BDAT.createReadStream('test.sas7bdat');
    stream.on('data', row => console.log(row));
    stream.on('end', () => console.log('Done!'));
    stream.on('error', err => console.log(err));

`SAS7BDAT.parse` returns a promise that resolves to an array containing all the rows:

    SAS7BDAT.parse('test.sas7bdat')
        .then(rows => console.log(rows))
        .catch(err => console.log(err));

## Options

Pass an `options` object as the second parameter to `SAS7BDAT.createReadStream` or `SAS7BDAT.parse`:

    const options = {};

    const stream = SAS7BDAT.createReadStream('test.sas7bdat', options);

### `options.dateFormatter`

This lets you customize the output format of date/time variables. For example, the default is:

    options.dateFormatter = (d, outputFormat) => {
        if (outputFormat === 'date') {
            return d.toISOString().slice(0, 10);
        }
        if (outputFormat === 'time') {
            return d.toISOString().slice(11, 23);
        }
        return d.toISOString();
    }

The two arguments to the callback function are `d` (a JavaScript Date object) and `outputFormat` (a string containing 'date', 'time', or 'datetime').

### Other options coming soon...

- Whether you want arrays or objects returned for rows
- All the options of the original Python package

## Tests

    npm test

## Similar open source projects for other languages

- Python: https://bitbucket.org/jaredhobbs/sas7bdat (sas7bdat-js is just a port of this)
- R: https://github.com/BioStatMatt/sas7bdat
- R: https://github.com/hadley/haven