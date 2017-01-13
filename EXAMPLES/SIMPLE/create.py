import h5py
import numpy as np

f = h5py.File('simple.hdf5', 'w')
data = f.create_dataset('somedata', (100,), dtype='i')

print  data.shape
# (100,)
print data.dtype
# dtype('int32')

data[:] = np.arange(100)
print data[0]
# 0
print data[-1]
# 99

f.close()
