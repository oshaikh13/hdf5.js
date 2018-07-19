# hdf5.js
A JavaScript implementation for reading the HDF5 file format.

Take a look at Pyfive for [help/details](https://github.com/jjhelmus/pyfive)

After setting up with yarn + parcel, you'll need to fix 2 problems, both in node_modules/python-struct/index.js

1

A pull request is incoming (to fix this problem on node-python-struct itself)
```
line 500: if (position + size >= buffer.length) {
becomes
line 500: if (position + size >= data.length) {
```

2

Also, node-python-struct doesn't have a buffer dependency in the browser. To fix this, add the following to the top of the file. This isn't a problem with python-struct.

```
const Buffer = require('buffer/').Buffer;
```

The production ready version (when it's done) won't have either of these problems.