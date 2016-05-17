# sas7bdat-js [![Build Status](https://travis-ci.org/dumbmatter/sas7bdat-js.svg?branch=master)](https://travis-ci.org/dumbmatter/sas7bdat-js)

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

There is also a convenience function `SAS7BDAT.toCsv` for converting to CSV, documentation coming soon...

## Options

Pass an `options` object as the second parameter to `SAS7BDAT.createReadStream` or `SAS7BDAT.parse`:

    const options = {};

    const stream = SAS7BDAT.createReadStream('test.sas7bdat', options);

### `options.rowFormat`

A string equal to `'array'` (default) or `'object'` which controls whether rows come back as arrays:

    ['Col1', 'Col2', 'Col3']
    [1, 'a', 'whatever']
    [2, 'b', 'whatever']
    ...

or objects:

    {Col1: 1, Col2: 'a', Col3: 'whatever'}
    {Col1: 2, Col2: 'b', Col3: 'whatever'}
    ...

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

### `options.skipHeader`

By default, the first row emitted contains column names, like:

    ['Col1', 'Col2', 'Col3']
    [1, 'a', 'whatever']
    [2, 'b', 'whatever']
    ...

When `options.skipHeader` is `true`, the row containing column names will be skipped:

    [1, 'a', 'whatever']
    [2, 'b', 'whatever']
    ...

If `options.rowFormat` is `'object'`, then `options.skipHeader` has no effect.

### `options.extraDateFormatStrings`, `options.extraTimeFormatStrings`, and `options.extraDatetimeFormatStrings`

Date/time/datetime columns are identified by a string attatched to them, like `"YYMMDD"` means a date column and `"DATETIME"` means a datetime column. The default identifiers used here are:

* date: `['YYMMDD', 'MMDDYY', 'DDMMYY', 'DATE', 'JULIAN', 'MONYY', 'WEEKDATE']`
* time: `['TIME']`
* datetime: `['DATETIME']`

Some files might have some other strings used to identify these columns, in which case you can use `options.extraDateFormatStrings`, `options.extraTimeFormatStrings`, and `options.extraDatetimeFormatStrings` as needed. For example:

   // Add another date format string
   options.extraDateFormatStrings = 'whatever';

   // Add more than one time format string by using an array
   options.extraTimeFormatStrings = ['foo', 'bar'];

### `options.encoding`

A string containing the character encoding of strings in the file, default is `'utf8'`. Other available options are [whatever is supported by Node.js](https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings), currently:

* `'ascii'` - for 7-bit ASCII data only. This encoding method is very fast and will strip the high bit if set.
* `'utf8'` - Multibyte encoded Unicode characters. Many web pages and other document formats use UTF-8.
* `'utf16le'` - 2 or 4 bytes, little-endian encoded Unicode characters. Surrogate pairs (U+10000 to U+10FFFF) are supported.
* `'ucs2'` - Alias of `'utf16le'`.
* `'base64'` - Base64 string encoding. When creating a buffer from a string, this encoding will also correctly accept "URL * `Filename Safe Alphabet" as specified in [RFC 4648, Section 5](https://tools.ietf.org/html/rfc4648#section-5).
* `'binary'` - A way of encoding the buffer into a one-byte (`latin-1`) encoded string. The string `'latin-1'` is not supported. Instead, pass `'binary'` to use `'latin-1'` encoding.
* `'hex'` - Encode each byte as two hexadecimal characters.

### `options.alignCorrection`

Boolean, default `true`. I'm not totally sure what this does, it came along with the port from Python. If it's needed, it'll hopefully produce an error message telling you that.

### `options.logLevel`

A string containing one of the following options:

* `'critical'` - Log important error messages to the console.
* `'error'` - Everything above, plus messages about less important errors.
* `'warning'` - Everything above, plus messages about even less important warnings.
* `'info'` - Everything above, plus messages about normal behavior.
* `'debug'` - Everything above, plus more verbose debugging information.

The default value is `'warning'` which will usually result in no logged messages. This is meant to by like Python's `logging` module.

## Tests

    npm test

## Similar open source projects for other languages

- Python: https://bitbucket.org/jaredhobbs/sas7bdat (sas7bdat-js is just a port of this)
- R: https://github.com/BioStatMatt/sas7bdat
- R: https://github.com/hadley/haven