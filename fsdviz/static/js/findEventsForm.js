(function () {
  'use strict';

  let array8 = arrayUntyped,
      array16 = arrayUntyped,
      array32 = arrayUntyped,
      arrayLengthen = arrayLengthenUntyped,
      arrayWiden = arrayWidenUntyped;
  if (typeof Uint8Array !== "undefined") {
    array8 = function(n) { return new Uint8Array(n); };
    array16 = function(n) { return new Uint16Array(n); };
    array32 = function(n) { return new Uint32Array(n); };

    arrayLengthen = function(array, length) {
      if (array.length >= length) return array;
      var copy = new array.constructor(length);
      copy.set(array);
      return copy;
    };

    arrayWiden = function(array, width) {
      var copy;
      switch (width) {
        case 16: copy = array16(array.length); break;
        case 32: copy = array32(array.length); break;
        default: throw new Error("invalid array width!");
      }
      copy.set(array);
      return copy;
    };
  }

  function arrayUntyped(n) {
    var array = new Array(n), i = -1;
    while (++i < n) array[i] = 0;
    return array;
  }

  function arrayLengthenUntyped(array, length) {
    var n = array.length;
    while (n < length) array[n++] = 0;
    return array;
  }

  function arrayWidenUntyped(array, width) {
    if (width > 32) throw new Error("invalid array width!");
    return array;
  }

  // An arbitrarily-wide array of bitmasks
  function bitarray(n) {
    this.length = n;
    this.subarrays = 1;
    this.width = 8;
    this.masks = {
      0: 0
    };

    this[0] = array8(n);
  }

  bitarray.prototype.lengthen = function(n) {
    var i, len;
    for (i = 0, len = this.subarrays; i < len; ++i) {
      this[i] = arrayLengthen(this[i], n);
    }
    this.length = n;
  };

  // Reserve a new bit index in the array, returns {offset, one}
  bitarray.prototype.add = function() {
    var m, w, one, i, len;

    for (i = 0, len = this.subarrays; i < len; ++i) {
      m = this.masks[i];
      w = this.width - (32 * i);
      // isolate the rightmost zero bit and return it as an unsigned int of 32 bits, if NaN or -1, return a 0 
      one = (~m & (m + 1)) >>> 0;

      if (w >= 32 && !one) {
        continue;
      }

      if (w < 32 && (one & (1 << w))) {
        // widen this subarray
        this[i] = arrayWiden(this[i], w <<= 1);
        this.width = 32 * i + w;
      }

      this.masks[i] |= one;

      return {
        offset: i,
        one: one
      };
    }

    // add a new subarray
    this[this.subarrays] = array8(this.length);
    this.masks[this.subarrays] = 1;
    this.width += 8;
    return {
      offset: this.subarrays++,
      one: 1
    };
  };

  // Copy record from index src to index dest
  bitarray.prototype.copy = function(dest, src) {
    var i, len;
    for (i = 0, len = this.subarrays; i < len; ++i) {
      this[i][dest] = this[i][src];
    }
  };

  // Truncate the array to the given length
  bitarray.prototype.truncate = function(n) {
    var i, len;
    for (i = 0, len = this.subarrays; i < len; ++i) {
      for (var j = this.length - 1; j >= n; j--) {
        this[i][j] = 0;
      }
    }
    this.length = n;
  };

  // Checks that all bits for the given index are 0
  bitarray.prototype.zero = function(n) {
    var i, len;
    for (i = 0, len = this.subarrays; i < len; ++i) {
      if (this[i][n]) {
        return false;
      }
    }
    return true;
  };

  // Checks that all bits for the given index are 0 except for possibly one
  bitarray.prototype.zeroExcept = function(n, offset, zero) {
    var i, len;
    for (i = 0, len = this.subarrays; i < len; ++i) {
      if (i === offset ? this[i][n] & zero : this[i][n]) {
        return false;
      }
    }
    return true;
  };

  // Checks that all bits for the given index are 0 except for the specified mask.
  // The mask should be an array of the same size as the filter subarrays width.
  bitarray.prototype.zeroExceptMask = function(n, mask) {
    var i, len;
    for (i = 0, len = this.subarrays; i < len; ++i) {
      if (this[i][n] & mask[i]) {
        return false;
      }
    }
    return true;
  };

  // Checks that only the specified bit is set for the given index
  bitarray.prototype.only = function(n, offset, one) {
    var i, len;
    for (i = 0, len = this.subarrays; i < len; ++i) {
      if (this[i][n] != (i === offset ? one : 0)) {
        return false;
      }
    }
    return true;
  };

  // Checks that only the specified bit is set for the given index except for possibly one other
  bitarray.prototype.onlyExcept = function(n, offset, zero, onlyOffset, onlyOne) {
    var mask;
    var i, len;
    for (i = 0, len = this.subarrays; i < len; ++i) {
      mask = this[i][n];
      if (i === offset)
        mask = (mask & zero) >>> 0;
      if (mask != (i === onlyOffset ? onlyOne : 0)) {
        return false;
      }
    }
    return true;
  };

  var xfilterArray = {
    array8: arrayUntyped,
    array16: arrayUntyped,
    array32: arrayUntyped,
    arrayLengthen: arrayLengthenUntyped,
    arrayWiden: arrayWidenUntyped,
    bitarray: bitarray
  };

  const filterExact = (bisect, value) => {
    return function(values) {
      var n = values.length;
      return [bisect.left(values, value, 0, n), bisect.right(values, value, 0, n)];
    };
  };

  const filterRange = (bisect, range) => {
    var min = range[0],
        max = range[1];
    return function(values) {
      var n = values.length;
      return [bisect.left(values, min, 0, n), bisect.left(values, max, 0, n)];
    };
  };

  const filterAll = values => {
    return [0, values.length];
  };

  var xfilterFilter = {
    filterExact,
    filterRange,
    filterAll
  };

  var cr_identity = d => {
    return d;
  };

  var cr_null = () =>  {
    return null;
  };

  var cr_zero = () => {
    return 0;
  };

  function heap_by(f) {

    // Builds a binary heap within the specified array a[lo:hi]. The heap has the
    // property such that the parent a[lo+i] is always less than or equal to its
    // two children: a[lo+2*i+1] and a[lo+2*i+2].
    function heap(a, lo, hi) {
      var n = hi - lo,
          i = (n >>> 1) + 1;
      while (--i > 0) sift(a, i, n, lo);
      return a;
    }

    // Sorts the specified array a[lo:hi] in descending order, assuming it is
    // already a heap.
    function sort(a, lo, hi) {
      var n = hi - lo,
          t;
      while (--n > 0) t = a[lo], a[lo] = a[lo + n], a[lo + n] = t, sift(a, 1, n, lo);
      return a;
    }

    // Sifts the element a[lo+i-1] down the heap, where the heap is the contiguous
    // slice of array a[lo:lo+n]. This method can also be used to update the heap
    // incrementally, without incurring the full cost of reconstructing the heap.
    function sift(a, i, n, lo) {
      var d = a[--lo + i],
          x = f(d),
          child;
      while ((child = i << 1) <= n) {
        if (child < n && f(a[lo + child]) > f(a[lo + child + 1])) child++;
        if (x <= f(a[lo + child])) break;
        a[lo + i] = a[lo + child];
        i = child;
      }
      a[lo + i] = d;
    }

    heap.sort = sort;
    return heap;
  }

  const h$1 = heap_by(cr_identity);
  h$1.by = heap_by;

  function heapselect_by(f) {
    var heap = h$1.by(f);

    // Returns a new array containing the top k elements in the array a[lo:hi].
    // The returned array is not sorted, but maintains the heap property. If k is
    // greater than hi - lo, then fewer than k elements will be returned. The
    // order of elements in a is unchanged by this operation.
    function heapselect(a, lo, hi, k) {
      var queue = new Array(k = Math.min(hi - lo, k)),
          min,
          i,
          d;

      for (i = 0; i < k; ++i) queue[i] = a[lo++];
      heap(queue, 0, k);

      if (lo < hi) {
        min = f(queue[0]);
        do {
          if (f(d = a[lo]) > min) {
            queue[0] = d;
            min = f(heap(queue, 0, k)[0]);
          }
        } while (++lo < hi);
      }

      return queue;
    }

    return heapselect;
  }


  const h = heapselect_by(cr_identity);
  h.by = heapselect_by; // assign the raw function to the export as well

  function bisect_by(f) {

    // Locate the insertion point for x in a to maintain sorted order. The
    // arguments lo and hi may be used to specify a subset of the array which
    // should be considered; by default the entire array is used. If x is already
    // present in a, the insertion point will be before (to the left of) any
    // existing entries. The return value is suitable for use as the first
    // argument to `array.splice` assuming that a is already sorted.
    //
    // The returned insertion point i partitions the array a into two halves so
    // that all v < x for v in a[lo:i] for the left side and all v >= x for v in
    // a[i:hi] for the right side.
    function bisectLeft(a, x, lo, hi) {
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (f(a[mid]) < x) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    }

    // Similar to bisectLeft, but returns an insertion point which comes after (to
    // the right of) any existing entries of x in a.
    //
    // The returned insertion point i partitions the array into two halves so that
    // all v <= x for v in a[lo:i] for the left side and all v > x for v in
    // a[i:hi] for the right side.
    function bisectRight(a, x, lo, hi) {
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (x < f(a[mid])) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    }

    bisectRight.right = bisectRight;
    bisectRight.left = bisectLeft;
    return bisectRight;
  }

  const bisect = bisect_by(cr_identity);
  bisect.by = bisect_by; // assign the raw function to the export as well

  var permute = (array, index, deep) => {
    for (var i = 0, n = index.length, copy = deep ? JSON.parse(JSON.stringify(array)) : new Array(n); i < n; ++i) {
      copy[i] = array[index[i]];
    }
    return copy;
  };

  const reduceIncrement = p => {
    return p + 1;
  };

  const reduceDecrement = p => {
    return p - 1;
  };

  const reduceAdd = f => {
    return function(p, v) {
      return p + +f(v);
    };
  };

  const reduceSubtract = f => {
    return function(p, v) {
      return p - f(v);
    };
  };

  var xfilterReduce = {
    reduceIncrement,
    reduceDecrement,
    reduceAdd,
    reduceSubtract
  };

  function deep(t,e,i,n,r){for(r in n=(i=i.split(".")).splice(-1,1),i)e=e[i[r]]=e[i[r]]||{};return t(e,n)}

  // Note(cg): result was previsouly using lodash.result, not ESM compatible.
   
  const get$2 = (obj, prop) => {
    const value = obj[prop];
    return (typeof value === 'function') ? value.call(obj) : value;
  };

  /**
   * get value of object at a deep path.
   * if the resolved value is a function,
   * it's invoked with the `this` binding of 
   * its parent object and its result is returned. 
   *  
   * @param  {Object} obj  the object (e.g. { 'a': [{ 'b': { 'c1': 3, 'c2': 4} }], 'd': {e:1} }; )
   * @param  {String} path deep path (e.g. `d.e`` or `a[0].b.c1`. Dot notation (a.0.b)is also supported)
   * @return {Any}      the resolved value
   */
  const reg = /\[([\w\d]+)\]/g;
  var result = (obj, path) => {
    return deep(get$2, obj, path.replace(reg, '.$1'))
  };

  // constants
  var REMOVED_INDEX = -1;

  crossfilter.heap = h$1;
  crossfilter.heapselect = h;
  crossfilter.bisect = bisect;
  crossfilter.permute = permute;

  function crossfilter() {
    var crossfilter = {
      add: add,
      remove: removeData,
      dimension: dimension,
      groupAll: groupAll,
      size: size,
      all: all,
      allFiltered: allFiltered,
      onChange: onChange,
      isElementFiltered: isElementFiltered
    };

    var data = [], // the records
        n = 0, // the number of records; data.length
        filters, // 1 is filtered out
        filterListeners = [], // when the filters change
        dataListeners = [], // when data is added
        removeDataListeners = [], // when data is removed
        callbacks = [];

    filters = new xfilterArray.bitarray(0);

    // Adds the specified new records to this crossfilter.
    function add(newData) {
      var n0 = n,
          n1 = newData.length;

      // If there's actually new data to add…
      // Merge the new data into the existing data.
      // Lengthen the filter bitset to handle the new records.
      // Notify listeners (dimensions and groups) that new data is available.
      if (n1) {
        data = data.concat(newData);
        filters.lengthen(n += n1);
        dataListeners.forEach(function(l) { l(newData, n0, n1); });
        triggerOnChange('dataAdded');
      }

      return crossfilter;
    }

    // Removes all records that match the current filters, or if a predicate function is passed,
    // removes all records matching the predicate (ignoring filters).
    function removeData(predicate) {
      var // Mapping from old record indexes to new indexes (after records removed)
          newIndex = new Array(n),
          removed = [],
          usePred = typeof predicate === 'function',
          shouldRemove = function (i) {
            return usePred ? predicate(data[i], i) : filters.zero(i)
          };

      for (var index1 = 0, index2 = 0; index1 < n; ++index1) {
        if ( shouldRemove(index1) ) {
          removed.push(index1);
          newIndex[index1] = REMOVED_INDEX;
        } else {
          newIndex[index1] = index2++;
        }
      }

      // Remove all matching records from groups.
      filterListeners.forEach(function(l) { l(-1, -1, [], removed, true); });

      // Update indexes.
      removeDataListeners.forEach(function(l) { l(newIndex); });

      // Remove old filters and data by overwriting.
      for (var index3 = 0, index4 = 0; index3 < n; ++index3) {
        if ( newIndex[index3] !== REMOVED_INDEX ) {
          if (index3 !== index4) filters.copy(index4, index3), data[index4] = data[index3];
          ++index4;
        }
      }

      data.length = n = index4;
      filters.truncate(index4);
      triggerOnChange('dataRemoved');
    }

    function maskForDimensions(dimensions) {
      var n,
          d,
          len,
          id,
          mask = Array(filters.subarrays);
      for (n = 0; n < filters.subarrays; n++) { mask[n] = ~0; }
      for (d = 0, len = dimensions.length; d < len; d++) {
        // The top bits of the ID are the subarray offset and the lower bits are the bit
        // offset of the "one" mask.
        id = dimensions[d].id();
        mask[id >> 7] &= ~(0x1 << (id & 0x3f));
      }
      return mask;
    }

    // Return true if the data element at index i is filtered IN.
    // Optionally, ignore the filters of any dimensions in the ignore_dimensions list.
    function isElementFiltered(i, ignore_dimensions) {
      var mask = maskForDimensions(ignore_dimensions || []);
      return filters.zeroExceptMask(i,mask);
    }

    // Adds a new dimension with the specified value accessor function.
    function dimension(value, iterable) {

      if (typeof value === 'string') {
        var accessorPath = value;
        value = function(d) { return result(d, accessorPath); };
      }

      var dimension = {
        filter: filter,
        filterExact: filterExact,
        filterRange: filterRange,
        filterFunction: filterFunction,
        filterAll: filterAll,
        currentFilter: currentFilter,
        hasCurrentFilter: hasCurrentFilter,
        top: top,
        bottom: bottom,
        group: group,
        groupAll: groupAll,
        dispose: dispose,
        remove: dispose, // for backwards-compatibility
        accessor: value,
        id: function() { return id; }
      };

      var one, // lowest unset bit as mask, e.g., 00001000
          zero, // inverted one, e.g., 11110111
          offset, // offset into the filters arrays
          id, // unique ID for this dimension (reused when dimensions are disposed)
          values, // sorted, cached array
          index, // maps sorted value index -> record index (in data)
          newValues, // temporary array storing newly-added values
          newIndex, // temporary array storing newly-added index
          iterablesIndexCount,
          iterablesIndexFilterStatus,
          iterablesEmptyRows = [],
          sortRange = function(n) {
            return cr_range(n).sort(function(A, B) {
              var a = newValues[A], b = newValues[B];
              return a < b ? -1 : a > b ? 1 : A - B;
            });
          },
          refilter = xfilterFilter.filterAll, // for recomputing filter
          refilterFunction, // the custom filter function in use
          filterValue, // the value used for filtering (value, array, function or undefined)
          filterValuePresent, // true if filterValue contains something
          indexListeners = [], // when data is added
          dimensionGroups = [],
          lo0 = 0,
          hi0 = 0,
          t = 0,
          k;

      // Updating a dimension is a two-stage process. First, we must update the
      // associated filters for the newly-added records. Once all dimensions have
      // updated their filters, the groups are notified to update.
      dataListeners.unshift(preAdd);
      dataListeners.push(postAdd);

      removeDataListeners.push(removeData);

      // Add a new dimension in the filter bitmap and store the offset and bitmask.
      var tmp = filters.add();
      offset = tmp.offset;
      one = tmp.one;
      zero = ~one;

      // Create a unique ID for the dimension
      // IDs will be re-used if dimensions are disposed.
      // For internal use the ID is the subarray offset shifted left 7 bits or'd with the
      // bit offset of the set bit in the dimension's "one" mask.
      id = (offset << 7) | (Math.log(one) / Math.log(2));

      preAdd(data, 0, n);
      postAdd(data, 0, n);

      // Incorporates the specified new records into this dimension.
      // This function is responsible for updating filters, values, and index.
      function preAdd(newData, n0, n1) {
        var newIterablesIndexCount,
            newIterablesIndexFilterStatus;

        if (iterable){
          // Count all the values
          t = 0;
          j = 0;
          k = [];

          for (var i0 = 0; i0 < newData.length; i0++) {
            for(j = 0, k = value(newData[i0]); j < k.length; j++) {
              t++;
            }
          }

          newValues = [];
          newIterablesIndexCount = cr_range(newData.length);
          newIterablesIndexFilterStatus = cr_index(t,1);
          var unsortedIndex = cr_range(t);

          for (var l = 0, index1 = 0; index1 < newData.length; index1++) {
            k = value(newData[index1]);
            //
            if(!k.length){
              newIterablesIndexCount[index1] = 0;
              iterablesEmptyRows.push(index1 + n0);
              continue;
            }
            newIterablesIndexCount[index1] = k.length;
            for (j = 0; j < k.length; j++) {
              newValues.push(k[j]);
              unsortedIndex[l] = index1;
              l++;
            }
          }

          // Create the Sort map used to sort both the values and the valueToData indices
          var sortMap = sortRange(t);

          // Use the sortMap to sort the newValues
          newValues = permute(newValues, sortMap);


          // Use the sortMap to sort the unsortedIndex map
          // newIndex should be a map of sortedValue -> crossfilterData
          newIndex = permute(unsortedIndex, sortMap);

        } else {
          // Permute new values into natural order using a standard sorted index.
          newValues = newData.map(value);
          newIndex = sortRange(n1);
          newValues = permute(newValues, newIndex);
        }

        // Bisect newValues to determine which new records are selected.
        var bounds = refilter(newValues), lo1 = bounds[0], hi1 = bounds[1];

        var index2, index3, index4;
        if(iterable) {
          n1 = t;
          if (refilterFunction) {
            for (index2 = 0; index2 < n1; ++index2) {
              if (!refilterFunction(newValues[index2], index2)) {
                if(--newIterablesIndexCount[newIndex[index2]] === 0) {
                  filters[offset][newIndex[index2] + n0] |= one;
                }
                newIterablesIndexFilterStatus[index2] = 1;
              }
            }
          } else {
            for (index3 = 0; index3 < lo1; ++index3) {
              if(--newIterablesIndexCount[newIndex[index3]] === 0) {
                filters[offset][newIndex[index3] + n0] |= one;
              }
              newIterablesIndexFilterStatus[index3] = 1;
            }
            for (index4 = hi1; index4 < n1; ++index4) {
              if(--newIterablesIndexCount[newIndex[index4]] === 0) {
                filters[offset][newIndex[index4] + n0] |= one;
              }
              newIterablesIndexFilterStatus[index4] = 1;
            }
          }
        } else {
          if (refilterFunction) {
            for (index2 = 0; index2 < n1; ++index2) {
              if (!refilterFunction(newValues[index2], index2)) {
                filters[offset][newIndex[index2] + n0] |= one;
              }
            }
          } else {
            for (index3 = 0; index3 < lo1; ++index3) {
              filters[offset][newIndex[index3] + n0] |= one;
            }
            for (index4 = hi1; index4 < n1; ++index4) {
              filters[offset][newIndex[index4] + n0] |= one;
            }
          }
        }

        // If this dimension previously had no data, then we don't need to do the
        // more expensive merge operation; use the new values and index as-is.
        if (!n0) {
          values = newValues;
          index = newIndex;
          iterablesIndexCount = newIterablesIndexCount;
          iterablesIndexFilterStatus = newIterablesIndexFilterStatus;
          lo0 = lo1;
          hi0 = hi1;
          return;
        }



        var oldValues = values,
          oldIndex = index,
          oldIterablesIndexFilterStatus = iterablesIndexFilterStatus,
          old_n0,
          i1 = 0;

        i0 = 0;

        if(iterable){
          old_n0 = n0;
          n0 = oldValues.length;
          n1 = t;
        }

        // Otherwise, create new arrays into which to merge new and old.
        values = iterable ? new Array(n0 + n1) : new Array(n);
        index = iterable ? new Array(n0 + n1) : cr_index(n, n);
        if(iterable) iterablesIndexFilterStatus = cr_index(n0 + n1, 1);

        // Concatenate the newIterablesIndexCount onto the old one.
        if(iterable) {
          var oldiiclength = iterablesIndexCount.length;
          iterablesIndexCount = xfilterArray.arrayLengthen(iterablesIndexCount, n);
          for(var j=0; j+oldiiclength < n; j++) {
            iterablesIndexCount[j+oldiiclength] = newIterablesIndexCount[j];
          }
        }

        // Merge the old and new sorted values, and old and new index.
        var index5 = 0;
        for (; i0 < n0 && i1 < n1; ++index5) {
          if (oldValues[i0] < newValues[i1]) {
            values[index5] = oldValues[i0];
            if(iterable) iterablesIndexFilterStatus[index5] = oldIterablesIndexFilterStatus[i0];
            index[index5] = oldIndex[i0++];
          } else {
            values[index5] = newValues[i1];
            if(iterable) iterablesIndexFilterStatus[index5] = newIterablesIndexFilterStatus[i1];
            index[index5] = newIndex[i1++] + (iterable ? old_n0 : n0);
          }
        }

        // Add any remaining old values.
        for (; i0 < n0; ++i0, ++index5) {
          values[index5] = oldValues[i0];
          if(iterable) iterablesIndexFilterStatus[index5] = oldIterablesIndexFilterStatus[i0];
          index[index5] = oldIndex[i0];
        }

        // Add any remaining new values.
        for (; i1 < n1; ++i1, ++index5) {
          values[index5] = newValues[i1];
          if(iterable) iterablesIndexFilterStatus[index5] = newIterablesIndexFilterStatus[i1];
          index[index5] = newIndex[i1] + (iterable ? old_n0 : n0);
        }

        // Bisect again to recompute lo0 and hi0.
        bounds = refilter(values), lo0 = bounds[0], hi0 = bounds[1];
      }

      // When all filters have updated, notify index listeners of the new values.
      function postAdd(newData, n0, n1) {
        indexListeners.forEach(function(l) { l(newValues, newIndex, n0, n1); });
        newValues = newIndex = null;
      }

      function removeData(reIndex) {
        if (iterable) {
          for (var i0 = 0, i1 = 0; i0 < iterablesEmptyRows.length; i0++) {
            if (reIndex[iterablesEmptyRows[i0]] !== REMOVED_INDEX) {
              iterablesEmptyRows[i1] = reIndex[iterablesEmptyRows[i0]];
              i1++;
            }
          }
          iterablesEmptyRows.length = i1;
          for (i0 = 0, i1 = 0; i0 < n; i0++) {
            if (reIndex[i0] !== REMOVED_INDEX) {
              if (i1 !== i0) iterablesIndexCount[i1] = iterablesIndexCount[i0];
              i1++;
            }
          }
          iterablesIndexCount = iterablesIndexCount.slice(0, i1);
        }
        // Rewrite our index, overwriting removed values
        var n0 = values.length;
        for (var i = 0, j = 0, oldDataIndex; i < n0; ++i) {
          oldDataIndex = index[i];
          if (reIndex[oldDataIndex] !== REMOVED_INDEX) {
            if (i !== j) values[j] = values[i];
            index[j] = reIndex[oldDataIndex];
            if (iterable) {
              iterablesIndexFilterStatus[j] = iterablesIndexFilterStatus[i];
            }
            ++j;
          }
        }
        values.length = j;
        if (iterable) iterablesIndexFilterStatus = iterablesIndexFilterStatus.slice(0, j);
        while (j < n0) index[j++] = 0;

        // Bisect again to recompute lo0 and hi0.
        var bounds = refilter(values);
        lo0 = bounds[0], hi0 = bounds[1];
      }

      // Updates the selected values based on the specified bounds [lo, hi].
      // This implementation is used by all the public filter methods.
      function filterIndexBounds(bounds) {

        var lo1 = bounds[0],
            hi1 = bounds[1];

        if (refilterFunction) {
          refilterFunction = null;
          filterIndexFunction(function(d, i) { return lo1 <= i && i < hi1; }, bounds[0] === 0 && bounds[1] === values.length);
          lo0 = lo1;
          hi0 = hi1;
          return dimension;
        }

        var i,
            j,
            k,
            added = [],
            removed = [],
            valueIndexAdded = [],
            valueIndexRemoved = [];


        // Fast incremental update based on previous lo index.
        if (lo1 < lo0) {
          for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
            added.push(index[i]);
            valueIndexAdded.push(i);
          }
        } else if (lo1 > lo0) {
          for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
            removed.push(index[i]);
            valueIndexRemoved.push(i);
          }
        }

        // Fast incremental update based on previous hi index.
        if (hi1 > hi0) {
          for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
            added.push(index[i]);
            valueIndexAdded.push(i);
          }
        } else if (hi1 < hi0) {
          for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
            removed.push(index[i]);
            valueIndexRemoved.push(i);
          }
        }

        if(!iterable) {
          // Flip filters normally.

          for(i=0; i<added.length; i++) {
            filters[offset][added[i]] ^= one;
          }

          for(i=0; i<removed.length; i++) {
            filters[offset][removed[i]] ^= one;
          }

        } else {
          // For iterables, we need to figure out if the row has been completely removed vs partially included
          // Only count a row as added if it is not already being aggregated. Only count a row
          // as removed if the last element being aggregated is removed.

          var newAdded = [];
          var newRemoved = [];
          for (i = 0; i < added.length; i++) {
            iterablesIndexCount[added[i]]++;
            iterablesIndexFilterStatus[valueIndexAdded[i]] = 0;
            if(iterablesIndexCount[added[i]] === 1) {
              filters[offset][added[i]] ^= one;
              newAdded.push(added[i]);
            }
          }
          for (i = 0; i < removed.length; i++) {
            iterablesIndexCount[removed[i]]--;
            iterablesIndexFilterStatus[valueIndexRemoved[i]] = 1;
            if(iterablesIndexCount[removed[i]] === 0) {
              filters[offset][removed[i]] ^= one;
              newRemoved.push(removed[i]);
            }
          }

          added = newAdded;
          removed = newRemoved;

          // Now handle empty rows.
          if(refilter === xfilterFilter.filterAll) {
            for(i = 0; i < iterablesEmptyRows.length; i++) {
              if((filters[offset][k = iterablesEmptyRows[i]] & one)) {
                // Was not in the filter, so set the filter and add
                filters[offset][k] ^= one;
                added.push(k);
              }
            }
          } else {
            // filter in place - remove empty rows if necessary
            for(i = 0; i < iterablesEmptyRows.length; i++) {
              if(!(filters[offset][k = iterablesEmptyRows[i]] & one)) {
                // Was in the filter, so set the filter and remove
                filters[offset][k] ^= one;
                removed.push(k);
              }
            }
          }
        }

        lo0 = lo1;
        hi0 = hi1;
        filterListeners.forEach(function(l) { l(one, offset, added, removed); });
        triggerOnChange('filtered');
        return dimension;
      }

      // Filters this dimension using the specified range, value, or null.
      // If the range is null, this is equivalent to filterAll.
      // If the range is an array, this is equivalent to filterRange.
      // Otherwise, this is equivalent to filterExact.
      function filter(range) {
        return range == null
            ? filterAll() : Array.isArray(range)
            ? filterRange(range) : typeof range === "function"
            ? filterFunction(range)
            : filterExact(range);
      }

      // Filters this dimension to select the exact value.
      function filterExact(value) {
        filterValue = value;
        filterValuePresent = true;
        return filterIndexBounds((refilter = xfilterFilter.filterExact(bisect, value))(values));
      }

      // Filters this dimension to select the specified range [lo, hi].
      // The lower bound is inclusive, and the upper bound is exclusive.
      function filterRange(range) {
        filterValue = range;
        filterValuePresent = true;
        return filterIndexBounds((refilter = xfilterFilter.filterRange(bisect, range))(values));
      }

      // Clears any filters on this dimension.
      function filterAll() {
        filterValue = undefined;
        filterValuePresent = false;
        return filterIndexBounds((refilter = xfilterFilter.filterAll)(values));
      }

      // Filters this dimension using an arbitrary function.
      function filterFunction(f) {
        filterValue = f;
        filterValuePresent = true;

        refilterFunction = f;
        refilter = xfilterFilter.filterAll;

        filterIndexFunction(f, false);

        var bounds = refilter(values);
        lo0 = bounds[0], hi0 = bounds[1];

        return dimension;
      }

      function filterIndexFunction(f, filterAll) {
        var i,
            k,
            x,
            added = [],
            removed = [],
            valueIndexAdded = [],
            valueIndexRemoved = [],
            indexLength = values.length;

        if(!iterable) {
          for (i = 0; i < indexLength; ++i) {
            if (!(filters[offset][k = index[i]] & one) ^ !!(x = f(values[i], i))) {
              if (x) added.push(k);
              else removed.push(k);
            }
          }
        }

        if(iterable) {
          for(i=0; i < indexLength; ++i) {
            if(f(values[i], i)) {
              added.push(index[i]);
              valueIndexAdded.push(i);
            } else {
              removed.push(index[i]);
              valueIndexRemoved.push(i);
            }
          }
        }

        if(!iterable) {
          for(i=0; i<added.length; i++) {
            if(filters[offset][added[i]] & one) filters[offset][added[i]] &= zero;
          }

          for(i=0; i<removed.length; i++) {
            if(!(filters[offset][removed[i]] & one)) filters[offset][removed[i]] |= one;
          }
        } else {

          var newAdded = [];
          var newRemoved = [];
          for (i = 0; i < added.length; i++) {
            // First check this particular value needs to be added
            if(iterablesIndexFilterStatus[valueIndexAdded[i]] === 1) {
              iterablesIndexCount[added[i]]++;
              iterablesIndexFilterStatus[valueIndexAdded[i]] = 0;
              if(iterablesIndexCount[added[i]] === 1) {
                filters[offset][added[i]] ^= one;
                newAdded.push(added[i]);
              }
            }
          }
          for (i = 0; i < removed.length; i++) {
            // First check this particular value needs to be removed
            if(iterablesIndexFilterStatus[valueIndexRemoved[i]] === 0) {
              iterablesIndexCount[removed[i]]--;
              iterablesIndexFilterStatus[valueIndexRemoved[i]] = 1;
              if(iterablesIndexCount[removed[i]] === 0) {
                filters[offset][removed[i]] ^= one;
                newRemoved.push(removed[i]);
              }
            }
          }

          added = newAdded;
          removed = newRemoved;

          // Now handle empty rows.
          if(filterAll) {
            for(i = 0; i < iterablesEmptyRows.length; i++) {
              if((filters[offset][k = iterablesEmptyRows[i]] & one)) {
                // Was not in the filter, so set the filter and add
                filters[offset][k] ^= one;
                added.push(k);
              }
            }
          } else {
            // filter in place - remove empty rows if necessary
            for(i = 0; i < iterablesEmptyRows.length; i++) {
              if(!(filters[offset][k = iterablesEmptyRows[i]] & one)) {
                // Was in the filter, so set the filter and remove
                filters[offset][k] ^= one;
                removed.push(k);
              }
            }
          }
        }

        filterListeners.forEach(function(l) { l(one, offset, added, removed); });
        triggerOnChange('filtered');
      }

      function currentFilter() {
        return filterValue;
      }

      function hasCurrentFilter() {
        return filterValuePresent;
      }

      // Returns the top K selected records based on this dimension's order.
      // Note: observes this dimension's filter, unlike group and groupAll.
      function top(k, top_offset) {
        var array = [],
            i = hi0,
            j,
            toSkip = 0;

        if(top_offset && top_offset > 0) toSkip = top_offset;

        while (--i >= lo0 && k > 0) {
          if (filters.zero(j = index[i])) {
            if(toSkip > 0) {
              //skip matching row
              --toSkip;
            } else {
              array.push(data[j]);
              --k;
            }
          }
        }

        if(iterable){
          for(i = 0; i < iterablesEmptyRows.length && k > 0; i++) {
            // Add row with empty iterable column at the end
            if(filters.zero(j = iterablesEmptyRows[i])) {
              if(toSkip > 0) {
                //skip matching row
                --toSkip;
              } else {
                array.push(data[j]);
                --k;
              }
            }
          }
        }

        return array;
      }

      // Returns the bottom K selected records based on this dimension's order.
      // Note: observes this dimension's filter, unlike group and groupAll.
      function bottom(k, bottom_offset) {
        var array = [],
            i,
            j,
            toSkip = 0;

        if(bottom_offset && bottom_offset > 0) toSkip = bottom_offset;

        if(iterable) {
          // Add row with empty iterable column at the top
          for(i = 0; i < iterablesEmptyRows.length && k > 0; i++) {
            if(filters.zero(j = iterablesEmptyRows[i])) {
              if(toSkip > 0) {
                //skip matching row
                --toSkip;
              } else {
                array.push(data[j]);
                --k;
              }
            }
          }
        }

        i = lo0;

        while (i < hi0 && k > 0) {
          if (filters.zero(j = index[i])) {
            if(toSkip > 0) {
              //skip matching row
              --toSkip;
            } else {
              array.push(data[j]);
              --k;
            }
          }
          i++;
        }

        return array;
      }

      // Adds a new group to this dimension, using the specified key function.
      function group(key) {
        var group = {
          top: top,
          all: all,
          reduce: reduce,
          reduceCount: reduceCount,
          reduceSum: reduceSum,
          order: order,
          orderNatural: orderNatural,
          size: size,
          dispose: dispose,
          remove: dispose // for backwards-compatibility
        };

        // Ensure that this group will be removed when the dimension is removed.
        dimensionGroups.push(group);

        var groups, // array of {key, value}
            groupIndex, // object id ↦ group id
            groupWidth = 8,
            groupCapacity = capacity(groupWidth),
            k = 0, // cardinality
            select,
            heap,
            reduceAdd,
            reduceRemove,
            reduceInitial,
            update = cr_null,
            reset = cr_null,
            resetNeeded = true,
            groupAll = key === cr_null,
            n0old;

        if (arguments.length < 1) key = cr_identity;

        // The group listens to the crossfilter for when any dimension changes, so
        // that it can update the associated reduce values. It must also listen to
        // the parent dimension for when data is added, and compute new keys.
        filterListeners.push(update);
        indexListeners.push(add);
        removeDataListeners.push(removeData);

        // Incorporate any existing data into the grouping.
        add(values, index, 0, n);

        // Incorporates the specified new values into this group.
        // This function is responsible for updating groups and groupIndex.
        function add(newValues, newIndex, n0, n1) {

          if(iterable) {
            n0old = n0;
            n0 = values.length - newValues.length;
            n1 = newValues.length;
          }

          var oldGroups = groups,
              reIndex = iterable ? [] : cr_index(k, groupCapacity),
              add = reduceAdd,
              remove = reduceRemove,
              initial = reduceInitial,
              k0 = k, // old cardinality
              i0 = 0, // index of old group
              i1 = 0, // index of new record
              j, // object id
              g0, // old group
              x0, // old key
              x1, // new key
              g, // group to add
              x; // key of group to add

          // If a reset is needed, we don't need to update the reduce values.
          if (resetNeeded) add = initial = cr_null;
          if (resetNeeded) remove = initial = cr_null;

          // Reset the new groups (k is a lower bound).
          // Also, make sure that groupIndex exists and is long enough.
          groups = new Array(k), k = 0;
          if(iterable){
            groupIndex = k0 ? groupIndex : [];
          }
          else {
            groupIndex = k0 > 1 ? xfilterArray.arrayLengthen(groupIndex, n) : cr_index(n, groupCapacity);
          }


          // Get the first old key (x0 of g0), if it exists.
          if (k0) x0 = (g0 = oldGroups[0]).key;

          // Find the first new key (x1), skipping NaN keys.
          while (i1 < n1 && !((x1 = key(newValues[i1])) >= x1)) ++i1;

          // While new keys remain…
          while (i1 < n1) {

            // Determine the lesser of the two current keys; new and old.
            // If there are no old keys remaining, then always add the new key.
            if (g0 && x0 <= x1) {
              g = g0, x = x0;

              // Record the new index of the old group.
              reIndex[i0] = k;

              // Retrieve the next old key.
              g0 = oldGroups[++i0];
              if (g0) x0 = g0.key;
            } else {
              g = {key: x1, value: initial()}, x = x1;
            }

            // Add the lesser group.
            groups[k] = g;

            // Add any selected records belonging to the added group, while
            // advancing the new key and populating the associated group index.

            while (x1 <= x) {
              j = newIndex[i1] + (iterable ? n0old : n0);


              if(iterable){
                if(groupIndex[j]){
                  groupIndex[j].push(k);
                }
                else {
                  groupIndex[j] = [k];
                }
              }
              else {
                groupIndex[j] = k;
              }

              // Always add new values to groups. Only remove when not in filter.
              // This gives groups full information on data life-cycle.
              g.value = add(g.value, data[j], true);
              if (!filters.zeroExcept(j, offset, zero)) g.value = remove(g.value, data[j], false);
              if (++i1 >= n1) break;
              x1 = key(newValues[i1]);
            }

            groupIncrement();
          }

          // Add any remaining old groups that were greater th1an all new keys.
          // No incremental reduce is needed; these groups have no new records.
          // Also record the new index of the old group.
          while (i0 < k0) {
            groups[reIndex[i0] = k] = oldGroups[i0++];
            groupIncrement();
          }


          // Fill in gaps with empty arrays where there may have been rows with empty iterables
          if(iterable){
            for (var index1 = 0; index1 < n; index1++) {
              if(!groupIndex[index1]){
                groupIndex[index1] = [];
              }
            }
          }

          // If we added any new groups before any old groups,
          // update the group index of all the old records.
          if(k > i0){
            if(iterable){
              for (i0 = 0; i0 < n0old; ++i0) {
                for (index1 = 0; index1 < groupIndex[i0].length; index1++) {
                  groupIndex[i0][index1] = reIndex[groupIndex[i0][index1]];
                }
              }
            }
            else {
              for (i0 = 0; i0 < n0; ++i0) {
                groupIndex[i0] = reIndex[groupIndex[i0]];
              }
            }
          }

          // Modify the update and reset behavior based on the cardinality.
          // If the cardinality is less than or equal to one, then the groupIndex
          // is not needed. If the cardinality is zero, then there are no records
          // and therefore no groups to update or reset. Note that we also must
          // change the registered listener to point to the new method.
          j = filterListeners.indexOf(update);
          if (k > 1 || iterable) {
            update = updateMany;
            reset = resetMany;
          } else {
            if (!k && groupAll) {
              k = 1;
              groups = [{key: null, value: initial()}];
            }
            if (k === 1) {
              update = updateOne;
              reset = resetOne;
            } else {
              update = cr_null;
              reset = cr_null;
            }
            groupIndex = null;
          }
          filterListeners[j] = update;

          // Count the number of added groups,
          // and widen the group index as needed.
          function groupIncrement() {
            if(iterable){
              k++;
              return
            }
            if (++k === groupCapacity) {
              reIndex = xfilterArray.arrayWiden(reIndex, groupWidth <<= 1);
              groupIndex = xfilterArray.arrayWiden(groupIndex, groupWidth);
              groupCapacity = capacity(groupWidth);
            }
          }
        }

        function removeData(reIndex) {
          if (k > 1 || iterable) {
            var oldK = k,
                oldGroups = groups,
                seenGroups = cr_index(oldK, oldK),
                i,
                i0,
                j;

            // Filter out non-matches by copying matching group index entries to
            // the beginning of the array.
            if (!iterable) {
              for (i = 0, j = 0; i < n; ++i) {
                if (reIndex[i] !== REMOVED_INDEX) {
                  seenGroups[groupIndex[j] = groupIndex[i]] = 1;
                  ++j;
                }
              }
            } else {
              for (i = 0, j = 0; i < n; ++i) {
                if (reIndex[i] !== REMOVED_INDEX) {
                  groupIndex[j] = groupIndex[i];
                  for (i0 = 0; i0 < groupIndex[j].length; i0++) {
                    seenGroups[groupIndex[j][i0]] = 1;
                  }
                  ++j;
                }
              }
              groupIndex = groupIndex.slice(0, j);
            }

            // Reassemble groups including only those groups that were referred
            // to by matching group index entries.  Note the new group index in
            // seenGroups.
            groups = [], k = 0;
            for (i = 0; i < oldK; ++i) {
              if (seenGroups[i]) {
                seenGroups[i] = k++;
                groups.push(oldGroups[i]);
              }
            }

            if (k > 1 || iterable) {
              // Reindex the group index using seenGroups to find the new index.
              if (!iterable) {
                for (i = 0; i < j; ++i) groupIndex[i] = seenGroups[groupIndex[i]];
              } else {
                for (i = 0; i < j; ++i) {
                  for (i0 = 0; i0 < groupIndex[i].length; ++i0) {
                    groupIndex[i][i0] = seenGroups[groupIndex[i][i0]];
                  }
                }
              }
            } else {
              groupIndex = null;
            }
            filterListeners[filterListeners.indexOf(update)] = k > 1 || iterable
                ? (reset = resetMany, update = updateMany)
                : k === 1 ? (reset = resetOne, update = updateOne)
                : reset = update = cr_null;
          } else if (k === 1) {
            if (groupAll) return;
            for (var index3 = 0; index3 < n; ++index3) if (reIndex[index3] !== REMOVED_INDEX) return;
            groups = [], k = 0;
            filterListeners[filterListeners.indexOf(update)] =
            update = reset = cr_null;
          }
        }

        // Reduces the specified selected or deselected records.
        // This function is only used when the cardinality is greater than 1.
        // notFilter indicates a crossfilter.add/remove operation.
        function updateMany(filterOne, filterOffset, added, removed, notFilter) {

          if ((filterOne === one && filterOffset === offset) || resetNeeded) return;

          var i,
              j,
              k,
              n,
              g;

          if(iterable){
            // Add the added values.
            for (i = 0, n = added.length; i < n; ++i) {
              if (filters.zeroExcept(k = added[i], offset, zero)) {
                for (j = 0; j < groupIndex[k].length; j++) {
                  g = groups[groupIndex[k][j]];
                  g.value = reduceAdd(g.value, data[k], false, j);
                }
              }
            }

            // Remove the removed values.
            for (i = 0, n = removed.length; i < n; ++i) {
              if (filters.onlyExcept(k = removed[i], offset, zero, filterOffset, filterOne)) {
                for (j = 0; j < groupIndex[k].length; j++) {
                  g = groups[groupIndex[k][j]];
                  g.value = reduceRemove(g.value, data[k], notFilter, j);
                }
              }
            }
            return;
          }

          // Add the added values.
          for (i = 0, n = added.length; i < n; ++i) {
            if (filters.zeroExcept(k = added[i], offset, zero)) {
              g = groups[groupIndex[k]];
              g.value = reduceAdd(g.value, data[k], false);
            }
          }

          // Remove the removed values.
          for (i = 0, n = removed.length; i < n; ++i) {
            if (filters.onlyExcept(k = removed[i], offset, zero, filterOffset, filterOne)) {
              g = groups[groupIndex[k]];
              g.value = reduceRemove(g.value, data[k], notFilter);
            }
          }
        }

        // Reduces the specified selected or deselected records.
        // This function is only used when the cardinality is 1.
        // notFilter indicates a crossfilter.add/remove operation.
        function updateOne(filterOne, filterOffset, added, removed, notFilter) {
          if ((filterOne === one && filterOffset === offset) || resetNeeded) return;

          var i,
              k,
              n,
              g = groups[0];

          // Add the added values.
          for (i = 0, n = added.length; i < n; ++i) {
            if (filters.zeroExcept(k = added[i], offset, zero)) {
              g.value = reduceAdd(g.value, data[k], false);
            }
          }

          // Remove the removed values.
          for (i = 0, n = removed.length; i < n; ++i) {
            if (filters.onlyExcept(k = removed[i], offset, zero, filterOffset, filterOne)) {
              g.value = reduceRemove(g.value, data[k], notFilter);
            }
          }
        }

        // Recomputes the group reduce values from scratch.
        // This function is only used when the cardinality is greater than 1.
        function resetMany() {
          var i,
              j,
              g;

          // Reset all group values.
          for (i = 0; i < k; ++i) {
            groups[i].value = reduceInitial();
          }

          // We add all records and then remove filtered records so that reducers
          // can build an 'unfiltered' view even if there are already filters in
          // place on other dimensions.
          if(iterable){
            for (i = 0; i < n; ++i) {
              for (j = 0; j < groupIndex[i].length; j++) {
                g = groups[groupIndex[i][j]];
                g.value = reduceAdd(g.value, data[i], true, j);
              }
            }
            for (i = 0; i < n; ++i) {
              if (!filters.zeroExcept(i, offset, zero)) {
                for (j = 0; j < groupIndex[i].length; j++) {
                  g = groups[groupIndex[i][j]];
                  g.value = reduceRemove(g.value, data[i], false, j);
                }
              }
            }
            return;
          }

          for (i = 0; i < n; ++i) {
            g = groups[groupIndex[i]];
            g.value = reduceAdd(g.value, data[i], true);
          }
          for (i = 0; i < n; ++i) {
            if (!filters.zeroExcept(i, offset, zero)) {
              g = groups[groupIndex[i]];
              g.value = reduceRemove(g.value, data[i], false);
            }
          }
        }

        // Recomputes the group reduce values from scratch.
        // This function is only used when the cardinality is 1.
        function resetOne() {
          var i,
              g = groups[0];

          // Reset the singleton group values.
          g.value = reduceInitial();

          // We add all records and then remove filtered records so that reducers
          // can build an 'unfiltered' view even if there are already filters in
          // place on other dimensions.
          for (i = 0; i < n; ++i) {
            g.value = reduceAdd(g.value, data[i], true);
          }

          for (i = 0; i < n; ++i) {
            if (!filters.zeroExcept(i, offset, zero)) {
              g.value = reduceRemove(g.value, data[i], false);
            }
          }
        }

        // Returns the array of group values, in the dimension's natural order.
        function all() {
          if (resetNeeded) reset(), resetNeeded = false;
          return groups;
        }

        // Returns a new array containing the top K group values, in reduce order.
        function top(k) {
          var top = select(all(), 0, groups.length, k);
          return heap.sort(top, 0, top.length);
        }

        // Sets the reduce behavior for this group to use the specified functions.
        // This method lazily recomputes the reduce values, waiting until needed.
        function reduce(add, remove, initial) {
          reduceAdd = add;
          reduceRemove = remove;
          reduceInitial = initial;
          resetNeeded = true;
          return group;
        }

        // A convenience method for reducing by count.
        function reduceCount() {
          return reduce(xfilterReduce.reduceIncrement, xfilterReduce.reduceDecrement, cr_zero);
        }

        // A convenience method for reducing by sum(value).
        function reduceSum(value) {
          return reduce(xfilterReduce.reduceAdd(value), xfilterReduce.reduceSubtract(value), cr_zero);
        }

        // Sets the reduce order, using the specified accessor.
        function order(value) {
          select = h.by(valueOf);
          heap = h$1.by(valueOf);
          function valueOf(d) { return value(d.value); }
          return group;
        }

        // A convenience method for natural ordering by reduce value.
        function orderNatural() {
          return order(cr_identity);
        }

        // Returns the cardinality of this group, irrespective of any filters.
        function size() {
          return k;
        }

        // Removes this group and associated event listeners.
        function dispose() {
          var i = filterListeners.indexOf(update);
          if (i >= 0) filterListeners.splice(i, 1);
          i = indexListeners.indexOf(add);
          if (i >= 0) indexListeners.splice(i, 1);
          i = removeDataListeners.indexOf(removeData);
          if (i >= 0) removeDataListeners.splice(i, 1);
          i = dimensionGroups.indexOf(group);
          if (i >= 0) dimensionGroups.splice(i, 1);
          return group;
        }

        return reduceCount().orderNatural();
      }

      // A convenience function for generating a singleton group.
      function groupAll() {
        var g = group(cr_null), all = g.all;
        delete g.all;
        delete g.top;
        delete g.order;
        delete g.orderNatural;
        delete g.size;
        g.value = function() { return all()[0].value; };
        return g;
      }

      // Removes this dimension and associated groups and event listeners.
      function dispose() {
        dimensionGroups.forEach(function(group) { group.dispose(); });
        var i = dataListeners.indexOf(preAdd);
        if (i >= 0) dataListeners.splice(i, 1);
        i = dataListeners.indexOf(postAdd);
        if (i >= 0) dataListeners.splice(i, 1);
        i = removeDataListeners.indexOf(removeData);
        if (i >= 0) removeDataListeners.splice(i, 1);
        filters.masks[offset] &= zero;
        return filterAll();
      }

      return dimension;
    }

    // A convenience method for groupAll on a dummy dimension.
    // This implementation can be optimized since it always has cardinality 1.
    function groupAll() {
      var group = {
        reduce: reduce,
        reduceCount: reduceCount,
        reduceSum: reduceSum,
        value: value,
        dispose: dispose,
        remove: dispose // for backwards-compatibility
      };

      var reduceValue,
          reduceAdd,
          reduceRemove,
          reduceInitial,
          resetNeeded = true;

      // The group listens to the crossfilter for when any dimension changes, so
      // that it can update the reduce value. It must also listen to the parent
      // dimension for when data is added.
      filterListeners.push(update);
      dataListeners.push(add);

      // For consistency; actually a no-op since resetNeeded is true.
      add(data, 0);

      // Incorporates the specified new values into this group.
      function add(newData, n0) {
        var i;

        if (resetNeeded) return;

        // Cycle through all the values.
        for (i = n0; i < n; ++i) {

          // Add all values all the time.
          reduceValue = reduceAdd(reduceValue, data[i], true);

          // Remove the value if filtered.
          if (!filters.zero(i)) {
            reduceValue = reduceRemove(reduceValue, data[i], false);
          }
        }
      }

      // Reduces the specified selected or deselected records.
      function update(filterOne, filterOffset, added, removed, notFilter) {
        var i,
            k,
            n;

        if (resetNeeded) return;

        // Add the added values.
        for (i = 0, n = added.length; i < n; ++i) {
          if (filters.zero(k = added[i])) {
            reduceValue = reduceAdd(reduceValue, data[k], notFilter);
          }
        }

        // Remove the removed values.
        for (i = 0, n = removed.length; i < n; ++i) {
          if (filters.only(k = removed[i], filterOffset, filterOne)) {
            reduceValue = reduceRemove(reduceValue, data[k], notFilter);
          }
        }
      }

      // Recomputes the group reduce value from scratch.
      function reset() {
        var i;

        reduceValue = reduceInitial();

        // Cycle through all the values.
        for (i = 0; i < n; ++i) {

          // Add all values all the time.
          reduceValue = reduceAdd(reduceValue, data[i], true);

          // Remove the value if it is filtered.
          if (!filters.zero(i)) {
            reduceValue = reduceRemove(reduceValue, data[i], false);
          }
        }
      }

      // Sets the reduce behavior for this group to use the specified functions.
      // This method lazily recomputes the reduce value, waiting until needed.
      function reduce(add, remove, initial) {
        reduceAdd = add;
        reduceRemove = remove;
        reduceInitial = initial;
        resetNeeded = true;
        return group;
      }

      // A convenience method for reducing by count.
      function reduceCount() {
        return reduce(xfilterReduce.reduceIncrement, xfilterReduce.reduceDecrement, cr_zero);
      }

      // A convenience method for reducing by sum(value).
      function reduceSum(value) {
        return reduce(xfilterReduce.reduceAdd(value), xfilterReduce.reduceSubtract(value), cr_zero);
      }

      // Returns the computed reduce value.
      function value() {
        if (resetNeeded) reset(), resetNeeded = false;
        return reduceValue;
      }

      // Removes this group and associated event listeners.
      function dispose() {
        var i = filterListeners.indexOf(update);
        if (i >= 0) filterListeners.splice(i, 1);
        i = dataListeners.indexOf(add);
        if (i >= 0) dataListeners.splice(i, 1);
        return group;
      }

      return reduceCount();
    }

    // Returns the number of records in this crossfilter, irrespective of any filters.
    function size() {
      return n;
    }

    // Returns the raw row data contained in this crossfilter
    function all(){
      return data;
    }

    // Returns row data with all dimension filters applied, except for filters in ignore_dimensions
    function allFiltered(ignore_dimensions) {
      var array = [],
          i = 0,
          mask = maskForDimensions(ignore_dimensions || []);

        for (i = 0; i < n; i++) {
          if (filters.zeroExceptMask(i, mask)) {
            array.push(data[i]);
          }
        }

        return array;
    }

    function onChange(cb){
      if(typeof cb !== 'function'){
        /* eslint no-console: 0 */
        console.warn('onChange callback parameter must be a function!');
        return;
      }
      callbacks.push(cb);
      return function(){
        callbacks.splice(callbacks.indexOf(cb), 1);
      };
    }

    function triggerOnChange(eventName){
      for (var i = 0; i < callbacks.length; i++) {
        callbacks[i](eventName);
      }
    }

    return arguments.length
        ? add(arguments[0])
        : crossfilter;
  }

  // Returns an array of size n, big enough to store ids up to m.
  function cr_index(n, m) {
    return (m < 0x101
        ? xfilterArray.array8 : m < 0x10001
        ? xfilterArray.array16
        : xfilterArray.array32)(n);
  }

  // Constructs a new array of size n, with sequential values from 0 to n - 1.
  function cr_range(n) {
    var range = cr_index(n, n);
    for (var i = -1; ++i < n;) range[i] = i;
    return range;
  }

  function capacity(w) {
    return w === 8
        ? 0x100 : w === 16
        ? 0x10000
        : 0x100000000;
  }

  function ascending$1(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function bisector(compare) {
    if (compare.length === 1) compare = ascendingComparator(compare);
    return {
      left: function(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) < 0) lo = mid + 1;
          else hi = mid;
        }
        return lo;
      },
      right: function(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) > 0) hi = mid;
          else lo = mid + 1;
        }
        return lo;
      }
    };
  }

  function ascendingComparator(f) {
    return function(d, x) {
      return ascending$1(f(d), x);
    };
  }

  bisector(ascending$1);

  var noop = {value: function() {}};

  function dispatch() {
    for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
      if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
      _[t] = [];
    }
    return new Dispatch(_);
  }

  function Dispatch(_) {
    this._ = _;
  }

  function parseTypenames$1(typenames, types) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
      return {type: t, name: name};
    });
  }

  Dispatch.prototype = dispatch.prototype = {
    constructor: Dispatch,
    on: function(typename, callback) {
      var _ = this._,
          T = parseTypenames$1(typename + "", _),
          t,
          i = -1,
          n = T.length;

      // If no callback was specified, return the callback of the given type and name.
      if (arguments.length < 2) {
        while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
        return;
      }

      // If a type was specified, set the callback for the given type and name.
      // Otherwise, if a null callback was specified, remove callbacks of the given name.
      if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
      while (++i < n) {
        if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
        else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
      }

      return this;
    },
    copy: function() {
      var copy = {}, _ = this._;
      for (var t in _) copy[t] = _[t].slice();
      return new Dispatch(copy);
    },
    call: function(type, that) {
      if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    },
    apply: function(type, that, args) {
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    }
  };

  function get$1(type, name) {
    for (var i = 0, n = type.length, c; i < n; ++i) {
      if ((c = type[i]).name === name) {
        return c.value;
      }
    }
  }

  function set$1(type, name, callback) {
    for (var i = 0, n = type.length; i < n; ++i) {
      if (type[i].name === name) {
        type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
        break;
      }
    }
    if (callback != null) type.push({name: name, value: callback});
    return type;
  }

  var xhtml = "http://www.w3.org/1999/xhtml";

  var namespaces = {
    svg: "http://www.w3.org/2000/svg",
    xhtml: xhtml,
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };

  function namespace(name) {
    var prefix = name += "", i = prefix.indexOf(":");
    if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
    return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
  }

  function creatorInherit(name) {
    return function() {
      var document = this.ownerDocument,
          uri = this.namespaceURI;
      return uri === xhtml && document.documentElement.namespaceURI === xhtml
          ? document.createElement(name)
          : document.createElementNS(uri, name);
    };
  }

  function creatorFixed(fullname) {
    return function() {
      return this.ownerDocument.createElementNS(fullname.space, fullname.local);
    };
  }

  function creator(name) {
    var fullname = namespace(name);
    return (fullname.local
        ? creatorFixed
        : creatorInherit)(fullname);
  }

  function none() {}

  function selector(selector) {
    return selector == null ? none : function() {
      return this.querySelector(selector);
    };
  }

  function selection_select(select) {
    if (typeof select !== "function") select = selector(select);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
        }
      }
    }

    return new Selection$1(subgroups, this._parents);
  }

  function empty() {
    return [];
  }

  function selectorAll(selector) {
    return selector == null ? empty : function() {
      return this.querySelectorAll(selector);
    };
  }

  function selection_selectAll(select) {
    if (typeof select !== "function") select = selectorAll(select);

    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          subgroups.push(select.call(node, node.__data__, i, group));
          parents.push(node);
        }
      }
    }

    return new Selection$1(subgroups, parents);
  }

  function matcher(selector) {
    return function() {
      return this.matches(selector);
    };
  }

  function selection_filter(match) {
    if (typeof match !== "function") match = matcher(match);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }

    return new Selection$1(subgroups, this._parents);
  }

  function sparse(update) {
    return new Array(update.length);
  }

  function selection_enter() {
    return new Selection$1(this._enter || this._groups.map(sparse), this._parents);
  }

  function EnterNode(parent, datum) {
    this.ownerDocument = parent.ownerDocument;
    this.namespaceURI = parent.namespaceURI;
    this._next = null;
    this._parent = parent;
    this.__data__ = datum;
  }

  EnterNode.prototype = {
    constructor: EnterNode,
    appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
    insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
    querySelector: function(selector) { return this._parent.querySelector(selector); },
    querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
  };

  function constant$1(x) {
    return function() {
      return x;
    };
  }

  var keyPrefix = "$"; // Protect against keys like “__proto__”.

  function bindIndex(parent, group, enter, update, exit, data) {
    var i = 0,
        node,
        groupLength = group.length,
        dataLength = data.length;

    // Put any non-null nodes that fit into update.
    // Put any null nodes into enter.
    // Put any remaining data into enter.
    for (; i < dataLength; ++i) {
      if (node = group[i]) {
        node.__data__ = data[i];
        update[i] = node;
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }

    // Put any non-null nodes that don’t fit into exit.
    for (; i < groupLength; ++i) {
      if (node = group[i]) {
        exit[i] = node;
      }
    }
  }

  function bindKey(parent, group, enter, update, exit, data, key) {
    var i,
        node,
        nodeByKeyValue = {},
        groupLength = group.length,
        dataLength = data.length,
        keyValues = new Array(groupLength),
        keyValue;

    // Compute the key for each node.
    // If multiple nodes have the same key, the duplicates are added to exit.
    for (i = 0; i < groupLength; ++i) {
      if (node = group[i]) {
        keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
        if (keyValue in nodeByKeyValue) {
          exit[i] = node;
        } else {
          nodeByKeyValue[keyValue] = node;
        }
      }
    }

    // Compute the key for each datum.
    // If there a node associated with this key, join and add it to update.
    // If there is not (or the key is a duplicate), add it to enter.
    for (i = 0; i < dataLength; ++i) {
      keyValue = keyPrefix + key.call(parent, data[i], i, data);
      if (node = nodeByKeyValue[keyValue]) {
        update[i] = node;
        node.__data__ = data[i];
        nodeByKeyValue[keyValue] = null;
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }

    // Add any remaining nodes that were not bound to data to exit.
    for (i = 0; i < groupLength; ++i) {
      if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
        exit[i] = node;
      }
    }
  }

  function selection_data(value, key) {
    if (!value) {
      data = new Array(this.size()), j = -1;
      this.each(function(d) { data[++j] = d; });
      return data;
    }

    var bind = key ? bindKey : bindIndex,
        parents = this._parents,
        groups = this._groups;

    if (typeof value !== "function") value = constant$1(value);

    for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
      var parent = parents[j],
          group = groups[j],
          groupLength = group.length,
          data = value.call(parent, parent && parent.__data__, j, parents),
          dataLength = data.length,
          enterGroup = enter[j] = new Array(dataLength),
          updateGroup = update[j] = new Array(dataLength),
          exitGroup = exit[j] = new Array(groupLength);

      bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

      // Now connect the enter nodes to their following update node, such that
      // appendChild can insert the materialized enter node before this node,
      // rather than at the end of the parent node.
      for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
        if (previous = enterGroup[i0]) {
          if (i0 >= i1) i1 = i0 + 1;
          while (!(next = updateGroup[i1]) && ++i1 < dataLength);
          previous._next = next || null;
        }
      }
    }

    update = new Selection$1(update, parents);
    update._enter = enter;
    update._exit = exit;
    return update;
  }

  function selection_exit() {
    return new Selection$1(this._exit || this._groups.map(sparse), this._parents);
  }

  function selection_join(onenter, onupdate, onexit) {
    var enter = this.enter(), update = this, exit = this.exit();
    enter = typeof onenter === "function" ? onenter(enter) : enter.append(onenter + "");
    if (onupdate != null) update = onupdate(update);
    if (onexit == null) exit.remove(); else onexit(exit);
    return enter && update ? enter.merge(update).order() : update;
  }

  function selection_merge(selection) {

    for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }

    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }

    return new Selection$1(merges, this._parents);
  }

  function selection_order() {

    for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
      for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
        if (node = group[i]) {
          if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }

    return this;
  }

  function selection_sort(compare) {
    if (!compare) compare = ascending;

    function compareNode(a, b) {
      return a && b ? compare(a.__data__, b.__data__) : !a - !b;
    }

    for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          sortgroup[i] = node;
        }
      }
      sortgroup.sort(compareNode);
    }

    return new Selection$1(sortgroups, this._parents).order();
  }

  function ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function selection_call() {
    var callback = arguments[0];
    arguments[0] = this;
    callback.apply(null, arguments);
    return this;
  }

  function selection_nodes() {
    var nodes = new Array(this.size()), i = -1;
    this.each(function() { nodes[++i] = this; });
    return nodes;
  }

  function selection_node() {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
        var node = group[i];
        if (node) return node;
      }
    }

    return null;
  }

  function selection_size() {
    var size = 0;
    this.each(function() { ++size; });
    return size;
  }

  function selection_empty() {
    return !this.node();
  }

  function selection_each(callback) {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if (node = group[i]) callback.call(node, node.__data__, i, group);
      }
    }

    return this;
  }

  function attrRemove$1(name) {
    return function() {
      this.removeAttribute(name);
    };
  }

  function attrRemoveNS$1(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }

  function attrConstant$1(name, value) {
    return function() {
      this.setAttribute(name, value);
    };
  }

  function attrConstantNS$1(fullname, value) {
    return function() {
      this.setAttributeNS(fullname.space, fullname.local, value);
    };
  }

  function attrFunction$1(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttribute(name);
      else this.setAttribute(name, v);
    };
  }

  function attrFunctionNS$1(fullname, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
      else this.setAttributeNS(fullname.space, fullname.local, v);
    };
  }

  function selection_attr(name, value) {
    var fullname = namespace(name);

    if (arguments.length < 2) {
      var node = this.node();
      return fullname.local
          ? node.getAttributeNS(fullname.space, fullname.local)
          : node.getAttribute(fullname);
    }

    return this.each((value == null
        ? (fullname.local ? attrRemoveNS$1 : attrRemove$1) : (typeof value === "function"
        ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)
        : (fullname.local ? attrConstantNS$1 : attrConstant$1)))(fullname, value));
  }

  function defaultView(node) {
    return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
        || (node.document && node) // node is a Window
        || node.defaultView; // node is a Document
  }

  function styleRemove$1(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }

  function styleConstant$1(name, value, priority) {
    return function() {
      this.style.setProperty(name, value, priority);
    };
  }

  function styleFunction$1(name, value, priority) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.style.removeProperty(name);
      else this.style.setProperty(name, v, priority);
    };
  }

  function selection_style(name, value, priority) {
    return arguments.length > 1
        ? this.each((value == null
              ? styleRemove$1 : typeof value === "function"
              ? styleFunction$1
              : styleConstant$1)(name, value, priority == null ? "" : priority))
        : styleValue(this.node(), name);
  }

  function styleValue(node, name) {
    return node.style.getPropertyValue(name)
        || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
  }

  function propertyRemove(name) {
    return function() {
      delete this[name];
    };
  }

  function propertyConstant(name, value) {
    return function() {
      this[name] = value;
    };
  }

  function propertyFunction(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) delete this[name];
      else this[name] = v;
    };
  }

  function selection_property(name, value) {
    return arguments.length > 1
        ? this.each((value == null
            ? propertyRemove : typeof value === "function"
            ? propertyFunction
            : propertyConstant)(name, value))
        : this.node()[name];
  }

  function classArray(string) {
    return string.trim().split(/^|\s+/);
  }

  function classList(node) {
    return node.classList || new ClassList(node);
  }

  function ClassList(node) {
    this._node = node;
    this._names = classArray(node.getAttribute("class") || "");
  }

  ClassList.prototype = {
    add: function(name) {
      var i = this._names.indexOf(name);
      if (i < 0) {
        this._names.push(name);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    remove: function(name) {
      var i = this._names.indexOf(name);
      if (i >= 0) {
        this._names.splice(i, 1);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    contains: function(name) {
      return this._names.indexOf(name) >= 0;
    }
  };

  function classedAdd(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.add(names[i]);
  }

  function classedRemove(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.remove(names[i]);
  }

  function classedTrue(names) {
    return function() {
      classedAdd(this, names);
    };
  }

  function classedFalse(names) {
    return function() {
      classedRemove(this, names);
    };
  }

  function classedFunction(names, value) {
    return function() {
      (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
    };
  }

  function selection_classed(name, value) {
    var names = classArray(name + "");

    if (arguments.length < 2) {
      var list = classList(this.node()), i = -1, n = names.length;
      while (++i < n) if (!list.contains(names[i])) return false;
      return true;
    }

    return this.each((typeof value === "function"
        ? classedFunction : value
        ? classedTrue
        : classedFalse)(names, value));
  }

  function textRemove() {
    this.textContent = "";
  }

  function textConstant$1(value) {
    return function() {
      this.textContent = value;
    };
  }

  function textFunction$1(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    };
  }

  function selection_text(value) {
    return arguments.length
        ? this.each(value == null
            ? textRemove : (typeof value === "function"
            ? textFunction$1
            : textConstant$1)(value))
        : this.node().textContent;
  }

  function htmlRemove() {
    this.innerHTML = "";
  }

  function htmlConstant(value) {
    return function() {
      this.innerHTML = value;
    };
  }

  function htmlFunction(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    };
  }

  function selection_html(value) {
    return arguments.length
        ? this.each(value == null
            ? htmlRemove : (typeof value === "function"
            ? htmlFunction
            : htmlConstant)(value))
        : this.node().innerHTML;
  }

  function raise() {
    if (this.nextSibling) this.parentNode.appendChild(this);
  }

  function selection_raise() {
    return this.each(raise);
  }

  function lower() {
    if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
  }

  function selection_lower() {
    return this.each(lower);
  }

  function selection_append(name) {
    var create = typeof name === "function" ? name : creator(name);
    return this.select(function() {
      return this.appendChild(create.apply(this, arguments));
    });
  }

  function constantNull() {
    return null;
  }

  function selection_insert(name, before) {
    var create = typeof name === "function" ? name : creator(name),
        select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
    return this.select(function() {
      return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
    });
  }

  function remove() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  }

  function selection_remove() {
    return this.each(remove);
  }

  function selection_cloneShallow() {
    var clone = this.cloneNode(false), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }

  function selection_cloneDeep() {
    var clone = this.cloneNode(true), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }

  function selection_clone(deep) {
    return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
  }

  function selection_datum(value) {
    return arguments.length
        ? this.property("__data__", value)
        : this.node().__data__;
  }

  var filterEvents = {};

  if (typeof document !== "undefined") {
    var element = document.documentElement;
    if (!("onmouseenter" in element)) {
      filterEvents = {mouseenter: "mouseover", mouseleave: "mouseout"};
    }
  }

  function filterContextListener(listener, index, group) {
    listener = contextListener(listener, index, group);
    return function(event) {
      var related = event.relatedTarget;
      if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
        listener.call(this, event);
      }
    };
  }

  function contextListener(listener, index, group) {
    return function(event1) {
      try {
        listener.call(this, this.__data__, index, group);
      } finally {
      }
    };
  }

  function parseTypenames(typenames) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      return {type: t, name: name};
    });
  }

  function onRemove(typename) {
    return function() {
      var on = this.__on;
      if (!on) return;
      for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
        if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.capture);
        } else {
          on[++i] = o;
        }
      }
      if (++i) on.length = i;
      else delete this.__on;
    };
  }

  function onAdd(typename, value, capture) {
    var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
    return function(d, i, group) {
      var on = this.__on, o, listener = wrap(value, i, group);
      if (on) for (var j = 0, m = on.length; j < m; ++j) {
        if ((o = on[j]).type === typename.type && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.capture);
          this.addEventListener(o.type, o.listener = listener, o.capture = capture);
          o.value = value;
          return;
        }
      }
      this.addEventListener(typename.type, listener, capture);
      o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
      if (!on) this.__on = [o];
      else on.push(o);
    };
  }

  function selection_on(typename, value, capture) {
    var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

    if (arguments.length < 2) {
      var on = this.node().__on;
      if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
        for (i = 0, o = on[j]; i < n; ++i) {
          if ((t = typenames[i]).type === o.type && t.name === o.name) {
            return o.value;
          }
        }
      }
      return;
    }

    on = value ? onAdd : onRemove;
    if (capture == null) capture = false;
    for (i = 0; i < n; ++i) this.each(on(typenames[i], value, capture));
    return this;
  }

  function dispatchEvent(node, type, params) {
    var window = defaultView(node),
        event = window.CustomEvent;

    if (typeof event === "function") {
      event = new event(type, params);
    } else {
      event = window.document.createEvent("Event");
      if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
      else event.initEvent(type, false, false);
    }

    node.dispatchEvent(event);
  }

  function dispatchConstant(type, params) {
    return function() {
      return dispatchEvent(this, type, params);
    };
  }

  function dispatchFunction(type, params) {
    return function() {
      return dispatchEvent(this, type, params.apply(this, arguments));
    };
  }

  function selection_dispatch(type, params) {
    return this.each((typeof params === "function"
        ? dispatchFunction
        : dispatchConstant)(type, params));
  }

  var root = [null];

  function Selection$1(groups, parents) {
    this._groups = groups;
    this._parents = parents;
  }

  function selection() {
    return new Selection$1([[document.documentElement]], root);
  }

  Selection$1.prototype = selection.prototype = {
    constructor: Selection$1,
    select: selection_select,
    selectAll: selection_selectAll,
    filter: selection_filter,
    data: selection_data,
    enter: selection_enter,
    exit: selection_exit,
    join: selection_join,
    merge: selection_merge,
    order: selection_order,
    sort: selection_sort,
    call: selection_call,
    nodes: selection_nodes,
    node: selection_node,
    size: selection_size,
    empty: selection_empty,
    each: selection_each,
    attr: selection_attr,
    style: selection_style,
    property: selection_property,
    classed: selection_classed,
    text: selection_text,
    html: selection_html,
    raise: selection_raise,
    lower: selection_lower,
    append: selection_append,
    insert: selection_insert,
    remove: selection_remove,
    clone: selection_clone,
    datum: selection_datum,
    on: selection_on,
    dispatch: selection_dispatch
  };

  function select(selector) {
    return typeof selector === "string"
        ? new Selection$1([[document.querySelector(selector)]], [document.documentElement])
        : new Selection$1([[selector]], root);
  }

  function selectAll(selector) {
    return typeof selector === "string"
        ? new Selection$1([document.querySelectorAll(selector)], [document.documentElement])
        : new Selection$1([selector == null ? [] : selector], root);
  }

  function define(constructor, factory, prototype) {
    constructor.prototype = factory.prototype = prototype;
    prototype.constructor = constructor;
  }

  function extend(parent, definition) {
    var prototype = Object.create(parent.prototype);
    for (var key in definition) prototype[key] = definition[key];
    return prototype;
  }

  function Color() {}

  var darker = 0.7;
  var brighter = 1 / darker;

  var reI = "\\s*([+-]?\\d+)\\s*",
      reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
      reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
      reHex = /^#([0-9a-f]{3,8})$/,
      reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$"),
      reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$"),
      reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$"),
      reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$"),
      reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$"),
      reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

  var named = {
    aliceblue: 0xf0f8ff,
    antiquewhite: 0xfaebd7,
    aqua: 0x00ffff,
    aquamarine: 0x7fffd4,
    azure: 0xf0ffff,
    beige: 0xf5f5dc,
    bisque: 0xffe4c4,
    black: 0x000000,
    blanchedalmond: 0xffebcd,
    blue: 0x0000ff,
    blueviolet: 0x8a2be2,
    brown: 0xa52a2a,
    burlywood: 0xdeb887,
    cadetblue: 0x5f9ea0,
    chartreuse: 0x7fff00,
    chocolate: 0xd2691e,
    coral: 0xff7f50,
    cornflowerblue: 0x6495ed,
    cornsilk: 0xfff8dc,
    crimson: 0xdc143c,
    cyan: 0x00ffff,
    darkblue: 0x00008b,
    darkcyan: 0x008b8b,
    darkgoldenrod: 0xb8860b,
    darkgray: 0xa9a9a9,
    darkgreen: 0x006400,
    darkgrey: 0xa9a9a9,
    darkkhaki: 0xbdb76b,
    darkmagenta: 0x8b008b,
    darkolivegreen: 0x556b2f,
    darkorange: 0xff8c00,
    darkorchid: 0x9932cc,
    darkred: 0x8b0000,
    darksalmon: 0xe9967a,
    darkseagreen: 0x8fbc8f,
    darkslateblue: 0x483d8b,
    darkslategray: 0x2f4f4f,
    darkslategrey: 0x2f4f4f,
    darkturquoise: 0x00ced1,
    darkviolet: 0x9400d3,
    deeppink: 0xff1493,
    deepskyblue: 0x00bfff,
    dimgray: 0x696969,
    dimgrey: 0x696969,
    dodgerblue: 0x1e90ff,
    firebrick: 0xb22222,
    floralwhite: 0xfffaf0,
    forestgreen: 0x228b22,
    fuchsia: 0xff00ff,
    gainsboro: 0xdcdcdc,
    ghostwhite: 0xf8f8ff,
    gold: 0xffd700,
    goldenrod: 0xdaa520,
    gray: 0x808080,
    green: 0x008000,
    greenyellow: 0xadff2f,
    grey: 0x808080,
    honeydew: 0xf0fff0,
    hotpink: 0xff69b4,
    indianred: 0xcd5c5c,
    indigo: 0x4b0082,
    ivory: 0xfffff0,
    khaki: 0xf0e68c,
    lavender: 0xe6e6fa,
    lavenderblush: 0xfff0f5,
    lawngreen: 0x7cfc00,
    lemonchiffon: 0xfffacd,
    lightblue: 0xadd8e6,
    lightcoral: 0xf08080,
    lightcyan: 0xe0ffff,
    lightgoldenrodyellow: 0xfafad2,
    lightgray: 0xd3d3d3,
    lightgreen: 0x90ee90,
    lightgrey: 0xd3d3d3,
    lightpink: 0xffb6c1,
    lightsalmon: 0xffa07a,
    lightseagreen: 0x20b2aa,
    lightskyblue: 0x87cefa,
    lightslategray: 0x778899,
    lightslategrey: 0x778899,
    lightsteelblue: 0xb0c4de,
    lightyellow: 0xffffe0,
    lime: 0x00ff00,
    limegreen: 0x32cd32,
    linen: 0xfaf0e6,
    magenta: 0xff00ff,
    maroon: 0x800000,
    mediumaquamarine: 0x66cdaa,
    mediumblue: 0x0000cd,
    mediumorchid: 0xba55d3,
    mediumpurple: 0x9370db,
    mediumseagreen: 0x3cb371,
    mediumslateblue: 0x7b68ee,
    mediumspringgreen: 0x00fa9a,
    mediumturquoise: 0x48d1cc,
    mediumvioletred: 0xc71585,
    midnightblue: 0x191970,
    mintcream: 0xf5fffa,
    mistyrose: 0xffe4e1,
    moccasin: 0xffe4b5,
    navajowhite: 0xffdead,
    navy: 0x000080,
    oldlace: 0xfdf5e6,
    olive: 0x808000,
    olivedrab: 0x6b8e23,
    orange: 0xffa500,
    orangered: 0xff4500,
    orchid: 0xda70d6,
    palegoldenrod: 0xeee8aa,
    palegreen: 0x98fb98,
    paleturquoise: 0xafeeee,
    palevioletred: 0xdb7093,
    papayawhip: 0xffefd5,
    peachpuff: 0xffdab9,
    peru: 0xcd853f,
    pink: 0xffc0cb,
    plum: 0xdda0dd,
    powderblue: 0xb0e0e6,
    purple: 0x800080,
    rebeccapurple: 0x663399,
    red: 0xff0000,
    rosybrown: 0xbc8f8f,
    royalblue: 0x4169e1,
    saddlebrown: 0x8b4513,
    salmon: 0xfa8072,
    sandybrown: 0xf4a460,
    seagreen: 0x2e8b57,
    seashell: 0xfff5ee,
    sienna: 0xa0522d,
    silver: 0xc0c0c0,
    skyblue: 0x87ceeb,
    slateblue: 0x6a5acd,
    slategray: 0x708090,
    slategrey: 0x708090,
    snow: 0xfffafa,
    springgreen: 0x00ff7f,
    steelblue: 0x4682b4,
    tan: 0xd2b48c,
    teal: 0x008080,
    thistle: 0xd8bfd8,
    tomato: 0xff6347,
    turquoise: 0x40e0d0,
    violet: 0xee82ee,
    wheat: 0xf5deb3,
    white: 0xffffff,
    whitesmoke: 0xf5f5f5,
    yellow: 0xffff00,
    yellowgreen: 0x9acd32
  };

  define(Color, color, {
    copy: function(channels) {
      return Object.assign(new this.constructor, this, channels);
    },
    displayable: function() {
      return this.rgb().displayable();
    },
    hex: color_formatHex, // Deprecated! Use color.formatHex.
    formatHex: color_formatHex,
    formatHsl: color_formatHsl,
    formatRgb: color_formatRgb,
    toString: color_formatRgb
  });

  function color_formatHex() {
    return this.rgb().formatHex();
  }

  function color_formatHsl() {
    return hslConvert(this).formatHsl();
  }

  function color_formatRgb() {
    return this.rgb().formatRgb();
  }

  function color(format) {
    var m, l;
    format = (format + "").trim().toLowerCase();
    return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
        : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
        : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
        : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
        : null) // invalid hex
        : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
        : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
        : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
        : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
        : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
        : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
        : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
        : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
        : null;
  }

  function rgbn(n) {
    return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
  }

  function rgba(r, g, b, a) {
    if (a <= 0) r = g = b = NaN;
    return new Rgb(r, g, b, a);
  }

  function rgbConvert(o) {
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Rgb;
    o = o.rgb();
    return new Rgb(o.r, o.g, o.b, o.opacity);
  }

  function rgb(r, g, b, opacity) {
    return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
  }

  function Rgb(r, g, b, opacity) {
    this.r = +r;
    this.g = +g;
    this.b = +b;
    this.opacity = +opacity;
  }

  define(Rgb, rgb, extend(Color, {
    brighter: function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    darker: function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    rgb: function() {
      return this;
    },
    displayable: function() {
      return (-0.5 <= this.r && this.r < 255.5)
          && (-0.5 <= this.g && this.g < 255.5)
          && (-0.5 <= this.b && this.b < 255.5)
          && (0 <= this.opacity && this.opacity <= 1);
    },
    hex: rgb_formatHex, // Deprecated! Use color.formatHex.
    formatHex: rgb_formatHex,
    formatRgb: rgb_formatRgb,
    toString: rgb_formatRgb
  }));

  function rgb_formatHex() {
    return "#" + hex(this.r) + hex(this.g) + hex(this.b);
  }

  function rgb_formatRgb() {
    var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "rgb(" : "rgba(")
        + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.b) || 0))
        + (a === 1 ? ")" : ", " + a + ")");
  }

  function hex(value) {
    value = Math.max(0, Math.min(255, Math.round(value) || 0));
    return (value < 16 ? "0" : "") + value.toString(16);
  }

  function hsla(h, s, l, a) {
    if (a <= 0) h = s = l = NaN;
    else if (l <= 0 || l >= 1) h = s = NaN;
    else if (s <= 0) h = NaN;
    return new Hsl(h, s, l, a);
  }

  function hslConvert(o) {
    if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Hsl;
    if (o instanceof Hsl) return o;
    o = o.rgb();
    var r = o.r / 255,
        g = o.g / 255,
        b = o.b / 255,
        min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        h = NaN,
        s = max - min,
        l = (max + min) / 2;
    if (s) {
      if (r === max) h = (g - b) / s + (g < b) * 6;
      else if (g === max) h = (b - r) / s + 2;
      else h = (r - g) / s + 4;
      s /= l < 0.5 ? max + min : 2 - max - min;
      h *= 60;
    } else {
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new Hsl(h, s, l, o.opacity);
  }

  function hsl(h, s, l, opacity) {
    return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
  }

  function Hsl(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }

  define(Hsl, hsl, extend(Color, {
    brighter: function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    darker: function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    rgb: function() {
      var h = this.h % 360 + (this.h < 0) * 360,
          s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
          l = this.l,
          m2 = l + (l < 0.5 ? l : 1 - l) * s,
          m1 = 2 * l - m2;
      return new Rgb(
        hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
        hsl2rgb(h, m1, m2),
        hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
        this.opacity
      );
    },
    displayable: function() {
      return (0 <= this.s && this.s <= 1 || isNaN(this.s))
          && (0 <= this.l && this.l <= 1)
          && (0 <= this.opacity && this.opacity <= 1);
    },
    formatHsl: function() {
      var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
      return (a === 1 ? "hsl(" : "hsla(")
          + (this.h || 0) + ", "
          + (this.s || 0) * 100 + "%, "
          + (this.l || 0) * 100 + "%"
          + (a === 1 ? ")" : ", " + a + ")");
    }
  }));

  /* From FvD 13.37, CSS Color Module Level 3 */
  function hsl2rgb(h, m1, m2) {
    return (h < 60 ? m1 + (m2 - m1) * h / 60
        : h < 180 ? m2
        : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
        : m1) * 255;
  }

  function constant(x) {
    return function() {
      return x;
    };
  }

  function linear(a, d) {
    return function(t) {
      return a + t * d;
    };
  }

  function exponential(a, b, y) {
    return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
      return Math.pow(a + t * b, y);
    };
  }

  function gamma(y) {
    return (y = +y) === 1 ? nogamma : function(a, b) {
      return b - a ? exponential(a, b, y) : constant(isNaN(a) ? b : a);
    };
  }

  function nogamma(a, b) {
    var d = b - a;
    return d ? linear(a, d) : constant(isNaN(a) ? b : a);
  }

  var interpolateRgb = (function rgbGamma(y) {
    var color = gamma(y);

    function rgb$1(start, end) {
      var r = color((start = rgb(start)).r, (end = rgb(end)).r),
          g = color(start.g, end.g),
          b = color(start.b, end.b),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.r = r(t);
        start.g = g(t);
        start.b = b(t);
        start.opacity = opacity(t);
        return start + "";
      };
    }

    rgb$1.gamma = rgbGamma;

    return rgb$1;
  })(1);

  function interpolateNumber(a, b) {
    return a = +a, b = +b, function(t) {
      return a * (1 - t) + b * t;
    };
  }

  var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
      reB = new RegExp(reA.source, "g");

  function zero(b) {
    return function() {
      return b;
    };
  }

  function one(b) {
    return function(t) {
      return b(t) + "";
    };
  }

  function interpolateString(a, b) {
    var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
        am, // current match in a
        bm, // current match in b
        bs, // string preceding current number in b, if any
        i = -1, // index in s
        s = [], // string constants and placeholders
        q = []; // number interpolators

    // Coerce inputs to strings.
    a = a + "", b = b + "";

    // Interpolate pairs of numbers in a & b.
    while ((am = reA.exec(a))
        && (bm = reB.exec(b))) {
      if ((bs = bm.index) > bi) { // a string precedes the next number in b
        bs = b.slice(bi, bs);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
        if (s[i]) s[i] += bm; // coalesce with previous string
        else s[++i] = bm;
      } else { // interpolate non-matching numbers
        s[++i] = null;
        q.push({i: i, x: interpolateNumber(am, bm)});
      }
      bi = reB.lastIndex;
    }

    // Add remains of b.
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }

    // Special optimization for only a single match.
    // Otherwise, interpolate each of the numbers and rejoin the string.
    return s.length < 2 ? (q[0]
        ? one(q[0].x)
        : zero(b))
        : (b = q.length, function(t) {
            for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
            return s.join("");
          });
  }

  var degrees = 180 / Math.PI;

  var identity$1 = {
    translateX: 0,
    translateY: 0,
    rotate: 0,
    skewX: 0,
    scaleX: 1,
    scaleY: 1
  };

  function decompose(a, b, c, d, e, f) {
    var scaleX, scaleY, skewX;
    if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
    if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
    if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
    if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
    return {
      translateX: e,
      translateY: f,
      rotate: Math.atan2(b, a) * degrees,
      skewX: Math.atan(skewX) * degrees,
      scaleX: scaleX,
      scaleY: scaleY
    };
  }

  var cssNode,
      cssRoot,
      cssView,
      svgNode;

  function parseCss(value) {
    if (value === "none") return identity$1;
    if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
    cssNode.style.transform = value;
    value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
    cssRoot.removeChild(cssNode);
    value = value.slice(7, -1).split(",");
    return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
  }

  function parseSvg(value) {
    if (value == null) return identity$1;
    if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svgNode.setAttribute("transform", value);
    if (!(value = svgNode.transform.baseVal.consolidate())) return identity$1;
    value = value.matrix;
    return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
  }

  function interpolateTransform(parse, pxComma, pxParen, degParen) {

    function pop(s) {
      return s.length ? s.pop() + " " : "";
    }

    function translate(xa, ya, xb, yb, s, q) {
      if (xa !== xb || ya !== yb) {
        var i = s.push("translate(", null, pxComma, null, pxParen);
        q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
      } else if (xb || yb) {
        s.push("translate(" + xb + pxComma + yb + pxParen);
      }
    }

    function rotate(a, b, s, q) {
      if (a !== b) {
        if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
        q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
      } else if (b) {
        s.push(pop(s) + "rotate(" + b + degParen);
      }
    }

    function skewX(a, b, s, q) {
      if (a !== b) {
        q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
      } else if (b) {
        s.push(pop(s) + "skewX(" + b + degParen);
      }
    }

    function scale(xa, ya, xb, yb, s, q) {
      if (xa !== xb || ya !== yb) {
        var i = s.push(pop(s) + "scale(", null, ",", null, ")");
        q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
      } else if (xb !== 1 || yb !== 1) {
        s.push(pop(s) + "scale(" + xb + "," + yb + ")");
      }
    }

    return function(a, b) {
      var s = [], // string constants and placeholders
          q = []; // number interpolators
      a = parse(a), b = parse(b);
      translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
      rotate(a.rotate, b.rotate, s, q);
      skewX(a.skewX, b.skewX, s, q);
      scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
      a = b = null; // gc
      return function(t) {
        var i = -1, n = q.length, o;
        while (++i < n) s[(o = q[i]).i] = o.x(t);
        return s.join("");
      };
    };
  }

  var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
  var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

  var frame = 0, // is an animation frame pending?
      timeout$1 = 0, // is a timeout pending?
      interval = 0, // are any timers active?
      pokeDelay = 1000, // how frequently we check for clock skew
      taskHead,
      taskTail,
      clockLast = 0,
      clockNow = 0,
      clockSkew = 0,
      clock = typeof performance === "object" && performance.now ? performance : Date,
      setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

  function now() {
    return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
  }

  function clearNow() {
    clockNow = 0;
  }

  function Timer() {
    this._call =
    this._time =
    this._next = null;
  }

  Timer.prototype = timer.prototype = {
    constructor: Timer,
    restart: function(callback, delay, time) {
      if (typeof callback !== "function") throw new TypeError("callback is not a function");
      time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
      if (!this._next && taskTail !== this) {
        if (taskTail) taskTail._next = this;
        else taskHead = this;
        taskTail = this;
      }
      this._call = callback;
      this._time = time;
      sleep();
    },
    stop: function() {
      if (this._call) {
        this._call = null;
        this._time = Infinity;
        sleep();
      }
    }
  };

  function timer(callback, delay, time) {
    var t = new Timer;
    t.restart(callback, delay, time);
    return t;
  }

  function timerFlush() {
    now(); // Get the current time, if not already set.
    ++frame; // Pretend we’ve set an alarm, if we haven’t already.
    var t = taskHead, e;
    while (t) {
      if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
      t = t._next;
    }
    --frame;
  }

  function wake() {
    clockNow = (clockLast = clock.now()) + clockSkew;
    frame = timeout$1 = 0;
    try {
      timerFlush();
    } finally {
      frame = 0;
      nap();
      clockNow = 0;
    }
  }

  function poke() {
    var now = clock.now(), delay = now - clockLast;
    if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
  }

  function nap() {
    var t0, t1 = taskHead, t2, time = Infinity;
    while (t1) {
      if (t1._call) {
        if (time > t1._time) time = t1._time;
        t0 = t1, t1 = t1._next;
      } else {
        t2 = t1._next, t1._next = null;
        t1 = t0 ? t0._next = t2 : taskHead = t2;
      }
    }
    taskTail = t0;
    sleep(time);
  }

  function sleep(time) {
    if (frame) return; // Soonest alarm already set, or will be.
    if (timeout$1) timeout$1 = clearTimeout(timeout$1);
    var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
    if (delay > 24) {
      if (time < Infinity) timeout$1 = setTimeout(wake, time - clock.now() - clockSkew);
      if (interval) interval = clearInterval(interval);
    } else {
      if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
      frame = 1, setFrame(wake);
    }
  }

  function timeout(callback, delay, time) {
    var t = new Timer;
    delay = delay == null ? 0 : +delay;
    t.restart(function(elapsed) {
      t.stop();
      callback(elapsed + delay);
    }, delay, time);
    return t;
  }

  var emptyOn = dispatch("start", "end", "cancel", "interrupt");
  var emptyTween = [];

  var CREATED = 0;
  var SCHEDULED = 1;
  var STARTING = 2;
  var STARTED = 3;
  var RUNNING = 4;
  var ENDING = 5;
  var ENDED = 6;

  function schedule(node, name, id, index, group, timing) {
    var schedules = node.__transition;
    if (!schedules) node.__transition = {};
    else if (id in schedules) return;
    create(node, id, {
      name: name,
      index: index, // For context during callback.
      group: group, // For context during callback.
      on: emptyOn,
      tween: emptyTween,
      time: timing.time,
      delay: timing.delay,
      duration: timing.duration,
      ease: timing.ease,
      timer: null,
      state: CREATED
    });
  }

  function init(node, id) {
    var schedule = get(node, id);
    if (schedule.state > CREATED) throw new Error("too late; already scheduled");
    return schedule;
  }

  function set(node, id) {
    var schedule = get(node, id);
    if (schedule.state > STARTED) throw new Error("too late; already running");
    return schedule;
  }

  function get(node, id) {
    var schedule = node.__transition;
    if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
    return schedule;
  }

  function create(node, id, self) {
    var schedules = node.__transition,
        tween;

    // Initialize the self timer when the transition is created.
    // Note the actual delay is not known until the first callback!
    schedules[id] = self;
    self.timer = timer(schedule, 0, self.time);

    function schedule(elapsed) {
      self.state = SCHEDULED;
      self.timer.restart(start, self.delay, self.time);

      // If the elapsed delay is less than our first sleep, start immediately.
      if (self.delay <= elapsed) start(elapsed - self.delay);
    }

    function start(elapsed) {
      var i, j, n, o;

      // If the state is not SCHEDULED, then we previously errored on start.
      if (self.state !== SCHEDULED) return stop();

      for (i in schedules) {
        o = schedules[i];
        if (o.name !== self.name) continue;

        // While this element already has a starting transition during this frame,
        // defer starting an interrupting transition until that transition has a
        // chance to tick (and possibly end); see d3/d3-transition#54!
        if (o.state === STARTED) return timeout(start);

        // Interrupt the active transition, if any.
        if (o.state === RUNNING) {
          o.state = ENDED;
          o.timer.stop();
          o.on.call("interrupt", node, node.__data__, o.index, o.group);
          delete schedules[i];
        }

        // Cancel any pre-empted transitions.
        else if (+i < id) {
          o.state = ENDED;
          o.timer.stop();
          o.on.call("cancel", node, node.__data__, o.index, o.group);
          delete schedules[i];
        }
      }

      // Defer the first tick to end of the current frame; see d3/d3#1576.
      // Note the transition may be canceled after start and before the first tick!
      // Note this must be scheduled before the start event; see d3/d3-transition#16!
      // Assuming this is successful, subsequent callbacks go straight to tick.
      timeout(function() {
        if (self.state === STARTED) {
          self.state = RUNNING;
          self.timer.restart(tick, self.delay, self.time);
          tick(elapsed);
        }
      });

      // Dispatch the start event.
      // Note this must be done before the tween are initialized.
      self.state = STARTING;
      self.on.call("start", node, node.__data__, self.index, self.group);
      if (self.state !== STARTING) return; // interrupted
      self.state = STARTED;

      // Initialize the tween, deleting null tween.
      tween = new Array(n = self.tween.length);
      for (i = 0, j = -1; i < n; ++i) {
        if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
          tween[++j] = o;
        }
      }
      tween.length = j + 1;
    }

    function tick(elapsed) {
      var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
          i = -1,
          n = tween.length;

      while (++i < n) {
        tween[i].call(node, t);
      }

      // Dispatch the end event.
      if (self.state === ENDING) {
        self.on.call("end", node, node.__data__, self.index, self.group);
        stop();
      }
    }

    function stop() {
      self.state = ENDED;
      self.timer.stop();
      delete schedules[id];
      for (var i in schedules) return; // eslint-disable-line no-unused-vars
      delete node.__transition;
    }
  }

  function interrupt(node, name) {
    var schedules = node.__transition,
        schedule,
        active,
        empty = true,
        i;

    if (!schedules) return;

    name = name == null ? null : name + "";

    for (i in schedules) {
      if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
      active = schedule.state > STARTING && schedule.state < ENDING;
      schedule.state = ENDED;
      schedule.timer.stop();
      schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
      delete schedules[i];
    }

    if (empty) delete node.__transition;
  }

  function selection_interrupt(name) {
    return this.each(function() {
      interrupt(this, name);
    });
  }

  function tweenRemove(id, name) {
    var tween0, tween1;
    return function() {
      var schedule = set(this, id),
          tween = schedule.tween;

      // If this node shared tween with the previous node,
      // just assign the updated shared tween and we’re done!
      // Otherwise, copy-on-write.
      if (tween !== tween0) {
        tween1 = tween0 = tween;
        for (var i = 0, n = tween1.length; i < n; ++i) {
          if (tween1[i].name === name) {
            tween1 = tween1.slice();
            tween1.splice(i, 1);
            break;
          }
        }
      }

      schedule.tween = tween1;
    };
  }

  function tweenFunction(id, name, value) {
    var tween0, tween1;
    if (typeof value !== "function") throw new Error;
    return function() {
      var schedule = set(this, id),
          tween = schedule.tween;

      // If this node shared tween with the previous node,
      // just assign the updated shared tween and we’re done!
      // Otherwise, copy-on-write.
      if (tween !== tween0) {
        tween1 = (tween0 = tween).slice();
        for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
          if (tween1[i].name === name) {
            tween1[i] = t;
            break;
          }
        }
        if (i === n) tween1.push(t);
      }

      schedule.tween = tween1;
    };
  }

  function transition_tween(name, value) {
    var id = this._id;

    name += "";

    if (arguments.length < 2) {
      var tween = get(this.node(), id).tween;
      for (var i = 0, n = tween.length, t; i < n; ++i) {
        if ((t = tween[i]).name === name) {
          return t.value;
        }
      }
      return null;
    }

    return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
  }

  function tweenValue(transition, name, value) {
    var id = transition._id;

    transition.each(function() {
      var schedule = set(this, id);
      (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
    });

    return function(node) {
      return get(node, id).value[name];
    };
  }

  function interpolate(a, b) {
    var c;
    return (typeof b === "number" ? interpolateNumber
        : b instanceof color ? interpolateRgb
        : (c = color(b)) ? (b = c, interpolateRgb)
        : interpolateString)(a, b);
  }

  function attrRemove(name) {
    return function() {
      this.removeAttribute(name);
    };
  }

  function attrRemoveNS(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }

  function attrConstant(name, interpolate, value1) {
    var string00,
        string1 = value1 + "",
        interpolate0;
    return function() {
      var string0 = this.getAttribute(name);
      return string0 === string1 ? null
          : string0 === string00 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, value1);
    };
  }

  function attrConstantNS(fullname, interpolate, value1) {
    var string00,
        string1 = value1 + "",
        interpolate0;
    return function() {
      var string0 = this.getAttributeNS(fullname.space, fullname.local);
      return string0 === string1 ? null
          : string0 === string00 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, value1);
    };
  }

  function attrFunction(name, interpolate, value) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0, value1 = value(this), string1;
      if (value1 == null) return void this.removeAttribute(name);
      string0 = this.getAttribute(name);
      string1 = value1 + "";
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }

  function attrFunctionNS(fullname, interpolate, value) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0, value1 = value(this), string1;
      if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
      string0 = this.getAttributeNS(fullname.space, fullname.local);
      string1 = value1 + "";
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }

  function transition_attr(name, value) {
    var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
    return this.attrTween(name, typeof value === "function"
        ? (fullname.local ? attrFunctionNS : attrFunction)(fullname, i, tweenValue(this, "attr." + name, value))
        : value == null ? (fullname.local ? attrRemoveNS : attrRemove)(fullname)
        : (fullname.local ? attrConstantNS : attrConstant)(fullname, i, value));
  }

  function attrInterpolate(name, i) {
    return function(t) {
      this.setAttribute(name, i.call(this, t));
    };
  }

  function attrInterpolateNS(fullname, i) {
    return function(t) {
      this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
    };
  }

  function attrTweenNS(fullname, value) {
    var t0, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
      return t0;
    }
    tween._value = value;
    return tween;
  }

  function attrTween(name, value) {
    var t0, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
      return t0;
    }
    tween._value = value;
    return tween;
  }

  function transition_attrTween(name, value) {
    var key = "attr." + name;
    if (arguments.length < 2) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    var fullname = namespace(name);
    return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
  }

  function delayFunction(id, value) {
    return function() {
      init(this, id).delay = +value.apply(this, arguments);
    };
  }

  function delayConstant(id, value) {
    return value = +value, function() {
      init(this, id).delay = value;
    };
  }

  function transition_delay(value) {
    var id = this._id;

    return arguments.length
        ? this.each((typeof value === "function"
            ? delayFunction
            : delayConstant)(id, value))
        : get(this.node(), id).delay;
  }

  function durationFunction(id, value) {
    return function() {
      set(this, id).duration = +value.apply(this, arguments);
    };
  }

  function durationConstant(id, value) {
    return value = +value, function() {
      set(this, id).duration = value;
    };
  }

  function transition_duration(value) {
    var id = this._id;

    return arguments.length
        ? this.each((typeof value === "function"
            ? durationFunction
            : durationConstant)(id, value))
        : get(this.node(), id).duration;
  }

  function easeConstant(id, value) {
    if (typeof value !== "function") throw new Error;
    return function() {
      set(this, id).ease = value;
    };
  }

  function transition_ease(value) {
    var id = this._id;

    return arguments.length
        ? this.each(easeConstant(id, value))
        : get(this.node(), id).ease;
  }

  function transition_filter(match) {
    if (typeof match !== "function") match = matcher(match);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }

    return new Transition(subgroups, this._parents, this._name, this._id);
  }

  function transition_merge(transition) {
    if (transition._id !== this._id) throw new Error;

    for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }

    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }

    return new Transition(merges, this._parents, this._name, this._id);
  }

  function start(name) {
    return (name + "").trim().split(/^|\s+/).every(function(t) {
      var i = t.indexOf(".");
      if (i >= 0) t = t.slice(0, i);
      return !t || t === "start";
    });
  }

  function onFunction(id, name, listener) {
    var on0, on1, sit = start(name) ? init : set;
    return function() {
      var schedule = sit(this, id),
          on = schedule.on;

      // If this node shared a dispatch with the previous node,
      // just assign the updated shared dispatch and we’re done!
      // Otherwise, copy-on-write.
      if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

      schedule.on = on1;
    };
  }

  function transition_on(name, listener) {
    var id = this._id;

    return arguments.length < 2
        ? get(this.node(), id).on.on(name)
        : this.each(onFunction(id, name, listener));
  }

  function removeFunction(id) {
    return function() {
      var parent = this.parentNode;
      for (var i in this.__transition) if (+i !== id) return;
      if (parent) parent.removeChild(this);
    };
  }

  function transition_remove() {
    return this.on("end.remove", removeFunction(this._id));
  }

  function transition_select(select) {
    var name = this._name,
        id = this._id;

    if (typeof select !== "function") select = selector(select);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
          schedule(subgroup[i], name, id, i, subgroup, get(node, id));
        }
      }
    }

    return new Transition(subgroups, this._parents, name, id);
  }

  function transition_selectAll(select) {
    var name = this._name,
        id = this._id;

    if (typeof select !== "function") select = selectorAll(select);

    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          for (var children = select.call(node, node.__data__, i, group), child, inherit = get(node, id), k = 0, l = children.length; k < l; ++k) {
            if (child = children[k]) {
              schedule(child, name, id, k, children, inherit);
            }
          }
          subgroups.push(children);
          parents.push(node);
        }
      }
    }

    return new Transition(subgroups, parents, name, id);
  }

  var Selection = selection.prototype.constructor;

  function transition_selection() {
    return new Selection(this._groups, this._parents);
  }

  function styleNull(name, interpolate) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0 = styleValue(this, name),
          string1 = (this.style.removeProperty(name), styleValue(this, name));
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, string10 = string1);
    };
  }

  function styleRemove(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }

  function styleConstant(name, interpolate, value1) {
    var string00,
        string1 = value1 + "",
        interpolate0;
    return function() {
      var string0 = styleValue(this, name);
      return string0 === string1 ? null
          : string0 === string00 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, value1);
    };
  }

  function styleFunction(name, interpolate, value) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0 = styleValue(this, name),
          value1 = value(this),
          string1 = value1 + "";
      if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }

  function styleMaybeRemove(id, name) {
    var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
    return function() {
      var schedule = set(this, id),
          on = schedule.on,
          listener = schedule.value[key] == null ? remove || (remove = styleRemove(name)) : undefined;

      // If this node shared a dispatch with the previous node,
      // just assign the updated shared dispatch and we’re done!
      // Otherwise, copy-on-write.
      if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

      schedule.on = on1;
    };
  }

  function transition_style(name, value, priority) {
    var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
    return value == null ? this
        .styleTween(name, styleNull(name, i))
        .on("end.style." + name, styleRemove(name))
      : typeof value === "function" ? this
        .styleTween(name, styleFunction(name, i, tweenValue(this, "style." + name, value)))
        .each(styleMaybeRemove(this._id, name))
      : this
        .styleTween(name, styleConstant(name, i, value), priority)
        .on("end.style." + name, null);
  }

  function styleInterpolate(name, i, priority) {
    return function(t) {
      this.style.setProperty(name, i.call(this, t), priority);
    };
  }

  function styleTween(name, value, priority) {
    var t, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
      return t;
    }
    tween._value = value;
    return tween;
  }

  function transition_styleTween(name, value, priority) {
    var key = "style." + (name += "");
    if (arguments.length < 2) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
  }

  function textConstant(value) {
    return function() {
      this.textContent = value;
    };
  }

  function textFunction(value) {
    return function() {
      var value1 = value(this);
      this.textContent = value1 == null ? "" : value1;
    };
  }

  function transition_text(value) {
    return this.tween("text", typeof value === "function"
        ? textFunction(tweenValue(this, "text", value))
        : textConstant(value == null ? "" : value + ""));
  }

  function textInterpolate(i) {
    return function(t) {
      this.textContent = i.call(this, t);
    };
  }

  function textTween(value) {
    var t0, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
      return t0;
    }
    tween._value = value;
    return tween;
  }

  function transition_textTween(value) {
    var key = "text";
    if (arguments.length < 1) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    return this.tween(key, textTween(value));
  }

  function transition_transition() {
    var name = this._name,
        id0 = this._id,
        id1 = newId();

    for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          var inherit = get(node, id0);
          schedule(node, name, id1, i, group, {
            time: inherit.time + inherit.delay + inherit.duration,
            delay: 0,
            duration: inherit.duration,
            ease: inherit.ease
          });
        }
      }
    }

    return new Transition(groups, this._parents, name, id1);
  }

  function transition_end() {
    var on0, on1, that = this, id = that._id, size = that.size();
    return new Promise(function(resolve, reject) {
      var cancel = {value: reject},
          end = {value: function() { if (--size === 0) resolve(); }};

      that.each(function() {
        var schedule = set(this, id),
            on = schedule.on;

        // If this node shared a dispatch with the previous node,
        // just assign the updated shared dispatch and we’re done!
        // Otherwise, copy-on-write.
        if (on !== on0) {
          on1 = (on0 = on).copy();
          on1._.cancel.push(cancel);
          on1._.interrupt.push(cancel);
          on1._.end.push(end);
        }

        schedule.on = on1;
      });
    });
  }

  var id = 0;

  function Transition(groups, parents, name, id) {
    this._groups = groups;
    this._parents = parents;
    this._name = name;
    this._id = id;
  }

  function newId() {
    return ++id;
  }

  var selection_prototype = selection.prototype;

  Transition.prototype = {
    constructor: Transition,
    select: transition_select,
    selectAll: transition_selectAll,
    filter: transition_filter,
    merge: transition_merge,
    selection: transition_selection,
    transition: transition_transition,
    call: selection_prototype.call,
    nodes: selection_prototype.nodes,
    node: selection_prototype.node,
    size: selection_prototype.size,
    empty: selection_prototype.empty,
    each: selection_prototype.each,
    on: transition_on,
    attr: transition_attr,
    attrTween: transition_attrTween,
    style: transition_style,
    styleTween: transition_styleTween,
    text: transition_text,
    textTween: transition_textTween,
    remove: transition_remove,
    tween: transition_tween,
    delay: transition_delay,
    duration: transition_duration,
    ease: transition_ease,
    end: transition_end
  };

  function cubicInOut(t) {
    return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
  }

  var defaultTiming = {
    time: null, // Set on use.
    delay: 0,
    duration: 250,
    ease: cubicInOut
  };

  function inherit(node, id) {
    var timing;
    while (!(timing = node.__transition) || !(timing = timing[id])) {
      if (!(node = node.parentNode)) {
        return defaultTiming.time = now(), defaultTiming;
      }
    }
    return timing;
  }

  function selection_transition(name) {
    var id,
        timing;

    if (name instanceof Transition) {
      id = name._id, name = name._name;
    } else {
      id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
    }

    for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          schedule(node, name, id, i, group, timing || inherit(node, id));
        }
      }
    }

    return new Transition(groups, this._parents, name, id);
  }

  selection.prototype.interrupt = selection_interrupt;
  selection.prototype.transition = selection_transition;

  var prefix = "$";

  function Map() {}

  Map.prototype = map$1.prototype = {
    constructor: Map,
    has: function(key) {
      return (prefix + key) in this;
    },
    get: function(key) {
      return this[prefix + key];
    },
    set: function(key, value) {
      this[prefix + key] = value;
      return this;
    },
    remove: function(key) {
      var property = prefix + key;
      return property in this && delete this[property];
    },
    clear: function() {
      for (var property in this) if (property[0] === prefix) delete this[property];
    },
    keys: function() {
      var keys = [];
      for (var property in this) if (property[0] === prefix) keys.push(property.slice(1));
      return keys;
    },
    values: function() {
      var values = [];
      for (var property in this) if (property[0] === prefix) values.push(this[property]);
      return values;
    },
    entries: function() {
      var entries = [];
      for (var property in this) if (property[0] === prefix) entries.push({key: property.slice(1), value: this[property]});
      return entries;
    },
    size: function() {
      var size = 0;
      for (var property in this) if (property[0] === prefix) ++size;
      return size;
    },
    empty: function() {
      for (var property in this) if (property[0] === prefix) return false;
      return true;
    },
    each: function(f) {
      for (var property in this) if (property[0] === prefix) f(this[property], property.slice(1), this);
    }
  };

  function map$1(object, f) {
    var map = new Map;

    // Copy constructor.
    if (object instanceof Map) object.each(function(value, key) { map.set(key, value); });

    // Index array by numeric index or specified key function.
    else if (Array.isArray(object)) {
      var i = -1,
          n = object.length,
          o;

      if (f == null) while (++i < n) map.set(i, object[i]);
      else while (++i < n) map.set(f(o = object[i], i, object), o);
    }

    // Convert object to map.
    else if (object) for (var key in object) map.set(key, object[key]);

    return map;
  }

  function Set() {}

  var proto = map$1.prototype;

  Set.prototype = {
    constructor: Set,
    has: proto.has,
    add: function(value) {
      value += "";
      this[prefix + value] = value;
      return this;
    },
    remove: proto.remove,
    clear: proto.clear,
    values: proto.keys,
    size: proto.size,
    empty: proto.empty,
    each: proto.each
  };

  function formatDecimal(x) {
    return Math.abs(x = Math.round(x)) >= 1e21
        ? x.toLocaleString("en").replace(/,/g, "")
        : x.toString(10);
  }

  // Computes the decimal coefficient and exponent of the specified number x with
  // significant digits p, where x is positive and p is in [1, 21] or undefined.
  // For example, formatDecimalParts(1.23) returns ["123", 0].
  function formatDecimalParts(x, p) {
    if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
    var i, coefficient = x.slice(0, i);

    // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
    // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
    return [
      coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
      +x.slice(i + 1)
    ];
  }

  function exponent(x) {
    return x = formatDecimalParts(Math.abs(x)), x ? x[1] : NaN;
  }

  function formatGroup(grouping, thousands) {
    return function(value, width) {
      var i = value.length,
          t = [],
          j = 0,
          g = grouping[0],
          length = 0;

      while (i > 0 && g > 0) {
        if (length + g + 1 > width) g = Math.max(1, width - length);
        t.push(value.substring(i -= g, i + g));
        if ((length += g + 1) > width) break;
        g = grouping[j = (j + 1) % grouping.length];
      }

      return t.reverse().join(thousands);
    };
  }

  function formatNumerals(numerals) {
    return function(value) {
      return value.replace(/[0-9]/g, function(i) {
        return numerals[+i];
      });
    };
  }

  // [[fill]align][sign][symbol][0][width][,][.precision][~][type]
  var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

  function formatSpecifier(specifier) {
    if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
    var match;
    return new FormatSpecifier({
      fill: match[1],
      align: match[2],
      sign: match[3],
      symbol: match[4],
      zero: match[5],
      width: match[6],
      comma: match[7],
      precision: match[8] && match[8].slice(1),
      trim: match[9],
      type: match[10]
    });
  }

  formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

  function FormatSpecifier(specifier) {
    this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
    this.align = specifier.align === undefined ? ">" : specifier.align + "";
    this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
    this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
    this.zero = !!specifier.zero;
    this.width = specifier.width === undefined ? undefined : +specifier.width;
    this.comma = !!specifier.comma;
    this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
    this.trim = !!specifier.trim;
    this.type = specifier.type === undefined ? "" : specifier.type + "";
  }

  FormatSpecifier.prototype.toString = function() {
    return this.fill
        + this.align
        + this.sign
        + this.symbol
        + (this.zero ? "0" : "")
        + (this.width === undefined ? "" : Math.max(1, this.width | 0))
        + (this.comma ? "," : "")
        + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0))
        + (this.trim ? "~" : "")
        + this.type;
  };

  // Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
  function formatTrim(s) {
    out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
      switch (s[i]) {
        case ".": i0 = i1 = i; break;
        case "0": if (i0 === 0) i0 = i; i1 = i; break;
        default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break;
      }
    }
    return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
  }

  var prefixExponent;

  function formatPrefixAuto(x, p) {
    var d = formatDecimalParts(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1],
        i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
        n = coefficient.length;
    return i === n ? coefficient
        : i > n ? coefficient + new Array(i - n + 1).join("0")
        : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
        : "0." + new Array(1 - i).join("0") + formatDecimalParts(x, Math.max(0, p + i - 1))[0]; // less than 1y!
  }

  function formatRounded(x, p) {
    var d = formatDecimalParts(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1];
    return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
        : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
        : coefficient + new Array(exponent - coefficient.length + 2).join("0");
  }

  var formatTypes = {
    "%": function(x, p) { return (x * 100).toFixed(p); },
    "b": function(x) { return Math.round(x).toString(2); },
    "c": function(x) { return x + ""; },
    "d": formatDecimal,
    "e": function(x, p) { return x.toExponential(p); },
    "f": function(x, p) { return x.toFixed(p); },
    "g": function(x, p) { return x.toPrecision(p); },
    "o": function(x) { return Math.round(x).toString(8); },
    "p": function(x, p) { return formatRounded(x * 100, p); },
    "r": formatRounded,
    "s": formatPrefixAuto,
    "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
    "x": function(x) { return Math.round(x).toString(16); }
  };

  function identity(x) {
    return x;
  }

  var map = Array.prototype.map,
      prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

  function formatLocale(locale) {
    var group = locale.grouping === undefined || locale.thousands === undefined ? identity : formatGroup(map.call(locale.grouping, Number), locale.thousands + ""),
        currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
        currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
        decimal = locale.decimal === undefined ? "." : locale.decimal + "",
        numerals = locale.numerals === undefined ? identity : formatNumerals(map.call(locale.numerals, String)),
        percent = locale.percent === undefined ? "%" : locale.percent + "",
        minus = locale.minus === undefined ? "-" : locale.minus + "",
        nan = locale.nan === undefined ? "NaN" : locale.nan + "";

    function newFormat(specifier) {
      specifier = formatSpecifier(specifier);

      var fill = specifier.fill,
          align = specifier.align,
          sign = specifier.sign,
          symbol = specifier.symbol,
          zero = specifier.zero,
          width = specifier.width,
          comma = specifier.comma,
          precision = specifier.precision,
          trim = specifier.trim,
          type = specifier.type;

      // The "n" type is an alias for ",g".
      if (type === "n") comma = true, type = "g";

      // The "" type, and any invalid type, is an alias for ".12~g".
      else if (!formatTypes[type]) precision === undefined && (precision = 12), trim = true, type = "g";

      // If zero fill is specified, padding goes after sign and before digits.
      if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

      // Compute the prefix and suffix.
      // For SI-prefix, the suffix is lazily computed.
      var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
          suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";

      // What format function should we use?
      // Is this an integer type?
      // Can this type generate exponential notation?
      var formatType = formatTypes[type],
          maybeSuffix = /[defgprs%]/.test(type);

      // Set the default precision if not specified,
      // or clamp the specified precision to the supported range.
      // For significant precision, it must be in [1, 21].
      // For fixed precision, it must be in [0, 20].
      precision = precision === undefined ? 6
          : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
          : Math.max(0, Math.min(20, precision));

      function format(value) {
        var valuePrefix = prefix,
            valueSuffix = suffix,
            i, n, c;

        if (type === "c") {
          valueSuffix = formatType(value) + valueSuffix;
          value = "";
        } else {
          value = +value;

          // Determine the sign. -0 is not less than 0, but 1 / -0 is!
          var valueNegative = value < 0 || 1 / value < 0;

          // Perform the initial formatting.
          value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

          // Trim insignificant zeros.
          if (trim) value = formatTrim(value);

          // If a negative value rounds to zero after formatting, and no explicit positive sign is requested, hide the sign.
          if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;

          // Compute the prefix and suffix.
          valuePrefix = (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
          valueSuffix = (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

          // Break the formatted value into the integer “value” part that can be
          // grouped, and fractional or exponential “suffix” part that is not.
          if (maybeSuffix) {
            i = -1, n = value.length;
            while (++i < n) {
              if (c = value.charCodeAt(i), 48 > c || c > 57) {
                valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                value = value.slice(0, i);
                break;
              }
            }
          }
        }

        // If the fill character is not "0", grouping is applied before padding.
        if (comma && !zero) value = group(value, Infinity);

        // Compute the padding.
        var length = valuePrefix.length + value.length + valueSuffix.length,
            padding = length < width ? new Array(width - length + 1).join(fill) : "";

        // If the fill character is "0", grouping is applied after padding.
        if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

        // Reconstruct the final output based on the desired alignment.
        switch (align) {
          case "<": value = valuePrefix + value + valueSuffix + padding; break;
          case "=": value = valuePrefix + padding + value + valueSuffix; break;
          case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
          default: value = padding + valuePrefix + value + valueSuffix; break;
        }

        return numerals(value);
      }

      format.toString = function() {
        return specifier + "";
      };

      return format;
    }

    function formatPrefix(specifier, value) {
      var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
          e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
          k = Math.pow(10, -e),
          prefix = prefixes[8 + e / 3];
      return function(value) {
        return f(k * value) + prefix;
      };
    }

    return {
      format: newFormat,
      formatPrefix: formatPrefix
    };
  }

  var locale;
  var format;

  defaultLocale({
    decimal: ".",
    thousands: ",",
    grouping: [3],
    currency: ["$", ""],
    minus: "-"
  });

  function defaultLocale(definition) {
    locale = formatLocale(definition);
    format = locale.format;
    locale.formatPrefix;
    return locale;
  }

  /* global values filterDim, roiDim, lakes, agencies, jurisdictions, stateProv, species_list, strains, lifestages, stockingMethods */

  var commaFormat = format(",d");
  var firstYear = "";
  var lastYear = "";
  var month_lookup = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December",
    0: "Unknown/Not Reported"
  }; // a little scrubbing:

  values.forEach(function (d) {
    d.month = d.month ? "" + d.month : "0";
    d.year = parseInt(d.year);
    d.events = parseInt(d.events);
    d.strain = d.strain + "";
    return d;
  }); // create our lookup tables

  var lake_lookup = lakes.reduce(function (accumulator, d) {
    accumulator[d[0]] = d[1];
    return accumulator;
  }, {});
  var agency_lookup = agencies.reduce(function (accumulator, d) {
    accumulator[d[0]] = d[1];
    return accumulator;
  }, {});
  var jurisdiction_lookup = jurisdictions.reduce(function (accumulator, d) {
    accumulator[d[0]] = d[1];
    return accumulator;
  }, {});
  var stateProv_lookup = stateProv.reduce(function (accumulator, d) {
    accumulator[d[0]] = d[1];
    return accumulator;
  }, {});
  var species_lookup = species_list.reduce(function (accumulator, d) {
    accumulator[d[0]] = d[1];
    return accumulator;
  }, {});
  var strain_lookup = strains.reduce(function (accumulator, d) {
    accumulator[d[0]] = d[1];
    return accumulator;
  }, {});
  var lifestage_lookup = lifestages.reduce(function (accumulator, d) {
    accumulator[d[0]] = d[1];
    return accumulator;
  }, {});
  var method_lookup = stockingMethods.reduce(function (accumulator, d) {
    accumulator[d[0]] = d[1];
    return accumulator;
  }, {}); // let manUnit_lookup = {};
  // managementUnits.forEach(
  //   d => (manUnit_lookup[d.slug] = `${d.description} (${d.label})`)
  // );

  var get_selections = function get_selections(widget) {
    var what = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "value";
    var selected = [];

    if (widget.selectedIndex >= 0) {
      for (var i = widget.selectedIndex; i < widget.length; i++) {
        if (widget.options[i].selected) {
          selected.push(widget.options[i][what]);
        }
      }
    }

    return selected;
  }; //=============================================
  //           Helper Functions
  // get the options that are still available in a group
  // given the active filters:


  var get_options = function get_options(grp) {
    return grp.top(Infinity).filter(function (d) {
      return d.value > 0;
    }).map(function (d) {
      return d.key;
    });
  }; // update the options given a selector, the options, and a lookup table


  var update_options = function update_options(selector, option_data, lookup) {
    var sortKey = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "label";
    var options = select(selector).selectAll("option").data(option_data, function (d) {
      return d ? d : this.value;
    });
    options.exit().remove();
    var optionsEnter = options.enter().append("option").text(function (d) {
      return lookup[d];
    }).attr("value", function (d) {
      return d;
    });
    options = options.merge(optionsEnter);

    if (sortKey === "label") {
      options.sort(function (a, b) {
        return lookup[a].localeCompare(lookup[b]);
      });
    } else {
      options.sort(function (a, b) {
        return a - b;
      });
    }
  }; //const filterDim = (dimension, selected) => {
  //  if (selected.length) {
  //    dimension.filter((d) => selected.indexOf(d) > -1);
  //  } else {
  //    dimension.filterAll();
  //  }
  //};
  //
  // now we are going to set up our crossfilter


  var ndx = crossfilter(values);
  var all = ndx.groupAll().reduceSum(function (d) {
    return d.events;
  });
  var yearDim = ndx.dimension(function (d) {
    return d.year;
  });
  var monthDim = ndx.dimension(function (d) {
    return d.month;
  });
  var lakeDim = ndx.dimension(function (d) {
    return d.lake;
  });
  var jurisdictionDim = ndx.dimension(function (d) {
    return d.jurisd;
  }); //roiDim = ndx.dimension((d) => d.jurisd);

  roiDim = ndx.dimension(function (d) {
    return d.manUnit;
  });
  var stateDim = ndx.dimension(function (d) {
    return d.state;
  });
  var agencyDim = ndx.dimension(function (d) {
    return d.agency_code;
  });
  var speciesDim = ndx.dimension(function (d) {
    return d.spc;
  });
  var strainDim = ndx.dimension(function (d) {
    return d.strain;
  });
  var markDim = ndx.dimension(function (d) {
    return d.mark;
  });
  var methodDim = ndx.dimension(function (d) {
    return d.method;
  });
  var stageDim = ndx.dimension(function (d) {
    return d.stage;
  }); // set up our groups

  yearDim.group().reduceSum(function (d) {
    return d.events;
  });
  var monthGroup = monthDim.group().reduceSum(function (d) {
    return d.events;
  });
  var lakeGroup = lakeDim.group().reduceSum(function (d) {
    return d.events;
  });
  var jurisdictionGroup = jurisdictionDim.group().reduceSum(function (d) {
    return d.events;
  });
  roiDim.group().reduceSum(function (d) {
    return d.events;
  });
  var stateGroup = stateDim.group().reduceSum(function (d) {
    return d.events;
  });
  var agencyGroup = agencyDim.group().reduceSum(function (d) {
    return d.events;
  });
  var speciesGroup = speciesDim.group().reduceSum(function (d) {
    return d.events;
  });
  var strainGroup = strainDim.group().reduceSum(function (d) {
    return d.events;
  });
  markDim.group().reduceSum(function (d) {
    return d.events;
  });
  var methodGroup = methodDim.group().reduceSum(function (d) {
    return d.events;
  });
  var stageGroup = stageDim.group().reduceSum(function (d) {
    return d.events;
  });

  var update_total = function update_total() {
    var total = all.value();
    select("#event-total").text(commaFormat(total)).classed("total-zero", total <= 0 ? true : false);
  };

  var update_widgets = function update_widgets() {
    var options = get_options(lakeGroup);
    update_options("#id_lake", options, lake_lookup);
    options = get_options(monthGroup);
    update_options("#id_months", options, month_lookup, "id");
    options = get_options(stateGroup);
    update_options("#id_stateprov", options, stateProv_lookup);
    options = get_options(jurisdictionGroup);
    update_options("#id_jurisdiction", options, jurisdiction_lookup);
    options = get_options(agencyGroup);
    update_options("#id_agency", options, agency_lookup);
    options = get_options(speciesGroup);
    update_options("#id_species", options, species_lookup);
    options = get_options(strainGroup);
    update_options("#id_strain", options, strain_lookup); //options = get_options(markGroup);
    //update_options("#id_mark", options, mark_lookup);

    options = get_options(stageGroup);
    update_options("#id_life_stage", options, lifestage_lookup);
    options = get_options(methodGroup);
    update_options("#id_stocking_method", options, method_lookup);
    update_total();
  };

  ndx.onChange(function () {
    update_widgets();
  }); //initalize everything:

  update_widgets();

  var filterYears = function filterYears(firstYear, lastYear) {
    //clear any existing filters on year:
    if (firstYear && lastYear) {
      var top = parseInt(lastYear) + 1;
      yearDim.filter([parseInt(firstYear), top]);
    } else if (firstYear && lastYear === "") {
      yearDim.filterFunction(function (d) {
        return d >= parseInt(firstYear);
      });
    } else if (firstYear === "" && lastYear) {
      yearDim.filterFunction(function (d) {
        return d <= parseInt(lastYear);
      });
    } else {
      yearDim.filterAll();
    }
  };

  var checkYears = function checkYears(firstYear, lastYear) {
    var yearInputs = selectAll(".year-input");

    if (firstYear !== "" && lastYear !== "" && firstYear > lastYear) {
      yearInputs.classed("error", true);
    } else {
      yearInputs.classed("error", false);
    }
  }; //=============================================
  // create listeners for each of our form widgets


  select("#id_lake").on("change", function () {
    var selected = get_selections(this);
    filterDim(lakeDim, selected);
  });
  select("#id_stateprov").on("change", function () {
    var selected = get_selections(this);
    filterDim(stateDim, selected);
  });
  select("#id_jurisdiction").on("change", function () {
    var selected = get_selections(this);
    filterDim(jurisdictionDim, selected);
  });
  select("#id_first_year").on("change", function () {
    firstYear = this.value || "";
    checkYears(firstYear, lastYear);
    filterYears(firstYear, lastYear);
  });
  select("#id_last_year").on("change", function () {
    lastYear = this.value || "";
    checkYears(firstYear, lastYear);
    filterYears(firstYear, lastYear);
  });
  select("#id_months").on("change", function () {
    var selected = get_selections(this);
    filterDim(monthDim, selected);
  });
  select("#id_agency").on("change", function () {
    var selected = get_selections(this);
    filterDim(agencyDim, selected);
  });
  select("#id_species").on("change", function () {
    var selected = get_selections(this);
    filterDim(speciesDim, selected);
  });
  select("#id_strain").on("change", function () {
    var selected = get_selections(this);
    filterDim(strainDim, selected);
  });
  select("#id_life_stage").on("change", function () {
    var selected = get_selections(this);
    filterDim(stageDim, selected);
  });
  select("#id_stocking_method").on("change", function () {
    var selected = get_selections(this);
    filterDim(methodDim, selected);
  });
  select("#reset-button").on("click", function () {
    $("#find-events-form").form("reset"); // TODO:  remove roi from leaflet map

    yearDim.filterAll();
    monthDim.filterAll();
    lakeDim.filterAll();
    jurisdictionDim.filterAll();
    roiDim.filterAll();
    stateDim.filterAll();
    agencyDim.filterAll();
    speciesDim.filterAll();
    strainDim.filterAll();
    markDim.filterAll();
    methodDim.filterAll();
    stageDim.filterAll();
  });

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZEV2ZW50c0Zvcm0uanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL2FycmF5LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9zcmMvZmlsdGVyLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9zcmMvaWRlbnRpdHkuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvY3Jvc3NmaWx0ZXIyL3NyYy9udWxsLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9zcmMvemVyby5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL2hlYXAuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvY3Jvc3NmaWx0ZXIyL3NyYy9oZWFwc2VsZWN0LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9zcmMvYmlzZWN0LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9zcmMvcGVybXV0ZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL3JlZHVjZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AcmFuZmRldi9kZWVwb2JqL2Rpc3QvZGVlcG9iai5tLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9zcmMvcmVzdWx0LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9zcmMvaW5kZXguanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtYXJyYXkvc3JjL2FzY2VuZGluZy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1hcnJheS9zcmMvYmlzZWN0b3IuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtYXJyYXkvc3JjL2Jpc2VjdC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1kaXNwYXRjaC9zcmMvZGlzcGF0Y2guanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtc2VsZWN0aW9uL3NyYy9uYW1lc3BhY2VzLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvbmFtZXNwYWNlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvY3JlYXRvci5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1zZWxlY3Rpb24vc3JjL3NlbGVjdG9yLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL3NlbGVjdC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1zZWxlY3Rpb24vc3JjL3NlbGVjdG9yQWxsLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL3NlbGVjdEFsbC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1zZWxlY3Rpb24vc3JjL21hdGNoZXIuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtc2VsZWN0aW9uL3NyYy9zZWxlY3Rpb24vZmlsdGVyLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL3NwYXJzZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1zZWxlY3Rpb24vc3JjL3NlbGVjdGlvbi9lbnRlci5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1zZWxlY3Rpb24vc3JjL2NvbnN0YW50LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL2RhdGEuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtc2VsZWN0aW9uL3NyYy9zZWxlY3Rpb24vZXhpdC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1zZWxlY3Rpb24vc3JjL3NlbGVjdGlvbi9qb2luLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL21lcmdlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL29yZGVyLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL3NvcnQuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtc2VsZWN0aW9uL3NyYy9zZWxlY3Rpb24vY2FsbC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1zZWxlY3Rpb24vc3JjL3NlbGVjdGlvbi9ub2Rlcy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1zZWxlY3Rpb24vc3JjL3NlbGVjdGlvbi9ub2RlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL3NpemUuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtc2VsZWN0aW9uL3NyYy9zZWxlY3Rpb24vZW1wdHkuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtc2VsZWN0aW9uL3NyYy9zZWxlY3Rpb24vZWFjaC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1zZWxlY3Rpb24vc3JjL3NlbGVjdGlvbi9hdHRyLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvd2luZG93LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL3N0eWxlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL3Byb3BlcnR5LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL2NsYXNzZWQuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtc2VsZWN0aW9uL3NyYy9zZWxlY3Rpb24vdGV4dC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1zZWxlY3Rpb24vc3JjL3NlbGVjdGlvbi9odG1sLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL3JhaXNlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL2xvd2VyLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL2FwcGVuZC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1zZWxlY3Rpb24vc3JjL3NlbGVjdGlvbi9pbnNlcnQuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtc2VsZWN0aW9uL3NyYy9zZWxlY3Rpb24vcmVtb3ZlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL2Nsb25lLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL2RhdHVtLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL29uLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL2Rpc3BhdGNoLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0aW9uL2luZGV4LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXNlbGVjdGlvbi9zcmMvc2VsZWN0QWxsLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLWNvbG9yL3NyYy9kZWZpbmUuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtY29sb3Ivc3JjL2NvbG9yLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLWludGVycG9sYXRlL3NyYy9jb25zdGFudC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1pbnRlcnBvbGF0ZS9zcmMvY29sb3IuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtaW50ZXJwb2xhdGUvc3JjL3JnYi5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1pbnRlcnBvbGF0ZS9zcmMvbnVtYmVyLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLWludGVycG9sYXRlL3NyYy9zdHJpbmcuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtaW50ZXJwb2xhdGUvc3JjL3RyYW5zZm9ybS9kZWNvbXBvc2UuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtaW50ZXJwb2xhdGUvc3JjL3RyYW5zZm9ybS9wYXJzZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1pbnRlcnBvbGF0ZS9zcmMvdHJhbnNmb3JtL2luZGV4LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXRpbWVyL3NyYy90aW1lci5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy10aW1lci9zcmMvdGltZW91dC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy10cmFuc2l0aW9uL3NyYy90cmFuc2l0aW9uL3NjaGVkdWxlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXRyYW5zaXRpb24vc3JjL2ludGVycnVwdC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy10cmFuc2l0aW9uL3NyYy9zZWxlY3Rpb24vaW50ZXJydXB0LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXRyYW5zaXRpb24vc3JjL3RyYW5zaXRpb24vdHdlZW4uanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtdHJhbnNpdGlvbi9zcmMvdHJhbnNpdGlvbi9pbnRlcnBvbGF0ZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy10cmFuc2l0aW9uL3NyYy90cmFuc2l0aW9uL2F0dHIuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtdHJhbnNpdGlvbi9zcmMvdHJhbnNpdGlvbi9hdHRyVHdlZW4uanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtdHJhbnNpdGlvbi9zcmMvdHJhbnNpdGlvbi9kZWxheS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy10cmFuc2l0aW9uL3NyYy90cmFuc2l0aW9uL2R1cmF0aW9uLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXRyYW5zaXRpb24vc3JjL3RyYW5zaXRpb24vZWFzZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy10cmFuc2l0aW9uL3NyYy90cmFuc2l0aW9uL2ZpbHRlci5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy10cmFuc2l0aW9uL3NyYy90cmFuc2l0aW9uL21lcmdlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXRyYW5zaXRpb24vc3JjL3RyYW5zaXRpb24vb24uanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtdHJhbnNpdGlvbi9zcmMvdHJhbnNpdGlvbi9yZW1vdmUuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtdHJhbnNpdGlvbi9zcmMvdHJhbnNpdGlvbi9zZWxlY3QuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtdHJhbnNpdGlvbi9zcmMvdHJhbnNpdGlvbi9zZWxlY3RBbGwuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtdHJhbnNpdGlvbi9zcmMvdHJhbnNpdGlvbi9zZWxlY3Rpb24uanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtdHJhbnNpdGlvbi9zcmMvdHJhbnNpdGlvbi9zdHlsZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy10cmFuc2l0aW9uL3NyYy90cmFuc2l0aW9uL3N0eWxlVHdlZW4uanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtdHJhbnNpdGlvbi9zcmMvdHJhbnNpdGlvbi90ZXh0LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXRyYW5zaXRpb24vc3JjL3RyYW5zaXRpb24vdGV4dFR3ZWVuLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXRyYW5zaXRpb24vc3JjL3RyYW5zaXRpb24vdHJhbnNpdGlvbi5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy10cmFuc2l0aW9uL3NyYy90cmFuc2l0aW9uL2VuZC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy10cmFuc2l0aW9uL3NyYy90cmFuc2l0aW9uL2luZGV4LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLWVhc2Uvc3JjL2N1YmljLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXRyYW5zaXRpb24vc3JjL3NlbGVjdGlvbi90cmFuc2l0aW9uLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLXRyYW5zaXRpb24vc3JjL3NlbGVjdGlvbi9pbmRleC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1jb2xsZWN0aW9uL3NyYy9tYXAuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtY29sbGVjdGlvbi9zcmMvc2V0LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzL25vZGVfbW9kdWxlcy9kMy1mb3JtYXQvc3JjL2Zvcm1hdERlY2ltYWwuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMvbm9kZV9tb2R1bGVzL2QzLWZvcm1hdC9zcmMvZXhwb25lbnQuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMvbm9kZV9tb2R1bGVzL2QzLWZvcm1hdC9zcmMvZm9ybWF0R3JvdXAuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMvbm9kZV9tb2R1bGVzL2QzLWZvcm1hdC9zcmMvZm9ybWF0TnVtZXJhbHMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMvbm9kZV9tb2R1bGVzL2QzLWZvcm1hdC9zcmMvZm9ybWF0U3BlY2lmaWVyLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzL25vZGVfbW9kdWxlcy9kMy1mb3JtYXQvc3JjL2Zvcm1hdFRyaW0uanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMvbm9kZV9tb2R1bGVzL2QzLWZvcm1hdC9zcmMvZm9ybWF0UHJlZml4QXV0by5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy9ub2RlX21vZHVsZXMvZDMtZm9ybWF0L3NyYy9mb3JtYXRSb3VuZGVkLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzL25vZGVfbW9kdWxlcy9kMy1mb3JtYXQvc3JjL2Zvcm1hdFR5cGVzLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzL25vZGVfbW9kdWxlcy9kMy1mb3JtYXQvc3JjL2lkZW50aXR5LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzL25vZGVfbW9kdWxlcy9kMy1mb3JtYXQvc3JjL2xvY2FsZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy9ub2RlX21vZHVsZXMvZDMtZm9ybWF0L3NyYy9kZWZhdWx0TG9jYWxlLmpzIiwiLi4vLi4vanNfc3JjL2ZpbmRFdmVudHNGb3JtLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImxldCBhcnJheTggPSBhcnJheVVudHlwZWQsXG4gICAgYXJyYXkxNiA9IGFycmF5VW50eXBlZCxcbiAgICBhcnJheTMyID0gYXJyYXlVbnR5cGVkLFxuICAgIGFycmF5TGVuZ3RoZW4gPSBhcnJheUxlbmd0aGVuVW50eXBlZCxcbiAgICBhcnJheVdpZGVuID0gYXJyYXlXaWRlblVudHlwZWQ7XG5pZiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgYXJyYXk4ID0gZnVuY3Rpb24obikgeyByZXR1cm4gbmV3IFVpbnQ4QXJyYXkobik7IH07XG4gIGFycmF5MTYgPSBmdW5jdGlvbihuKSB7IHJldHVybiBuZXcgVWludDE2QXJyYXkobik7IH07XG4gIGFycmF5MzIgPSBmdW5jdGlvbihuKSB7IHJldHVybiBuZXcgVWludDMyQXJyYXkobik7IH07XG5cbiAgYXJyYXlMZW5ndGhlbiA9IGZ1bmN0aW9uKGFycmF5LCBsZW5ndGgpIHtcbiAgICBpZiAoYXJyYXkubGVuZ3RoID49IGxlbmd0aCkgcmV0dXJuIGFycmF5O1xuICAgIHZhciBjb3B5ID0gbmV3IGFycmF5LmNvbnN0cnVjdG9yKGxlbmd0aCk7XG4gICAgY29weS5zZXQoYXJyYXkpO1xuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gIGFycmF5V2lkZW4gPSBmdW5jdGlvbihhcnJheSwgd2lkdGgpIHtcbiAgICB2YXIgY29weTtcbiAgICBzd2l0Y2ggKHdpZHRoKSB7XG4gICAgICBjYXNlIDE2OiBjb3B5ID0gYXJyYXkxNihhcnJheS5sZW5ndGgpOyBicmVhaztcbiAgICAgIGNhc2UgMzI6IGNvcHkgPSBhcnJheTMyKGFycmF5Lmxlbmd0aCk7IGJyZWFrO1xuICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBhcnJheSB3aWR0aCFcIik7XG4gICAgfVxuICAgIGNvcHkuc2V0KGFycmF5KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gYXJyYXlVbnR5cGVkKG4pIHtcbiAgdmFyIGFycmF5ID0gbmV3IEFycmF5KG4pLCBpID0gLTE7XG4gIHdoaWxlICgrK2kgPCBuKSBhcnJheVtpXSA9IDA7XG4gIHJldHVybiBhcnJheTtcbn1cblxuZnVuY3Rpb24gYXJyYXlMZW5ndGhlblVudHlwZWQoYXJyYXksIGxlbmd0aCkge1xuICB2YXIgbiA9IGFycmF5Lmxlbmd0aDtcbiAgd2hpbGUgKG4gPCBsZW5ndGgpIGFycmF5W24rK10gPSAwO1xuICByZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIGFycmF5V2lkZW5VbnR5cGVkKGFycmF5LCB3aWR0aCkge1xuICBpZiAod2lkdGggPiAzMikgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBhcnJheSB3aWR0aCFcIik7XG4gIHJldHVybiBhcnJheTtcbn1cblxuLy8gQW4gYXJiaXRyYXJpbHktd2lkZSBhcnJheSBvZiBiaXRtYXNrc1xuZnVuY3Rpb24gYml0YXJyYXkobikge1xuICB0aGlzLmxlbmd0aCA9IG47XG4gIHRoaXMuc3ViYXJyYXlzID0gMTtcbiAgdGhpcy53aWR0aCA9IDg7XG4gIHRoaXMubWFza3MgPSB7XG4gICAgMDogMFxuICB9XG5cbiAgdGhpc1swXSA9IGFycmF5OChuKTtcbn1cblxuYml0YXJyYXkucHJvdG90eXBlLmxlbmd0aGVuID0gZnVuY3Rpb24obikge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgdGhpc1tpXSA9IGFycmF5TGVuZ3RoZW4odGhpc1tpXSwgbik7XG4gIH1cbiAgdGhpcy5sZW5ndGggPSBuO1xufTtcblxuLy8gUmVzZXJ2ZSBhIG5ldyBiaXQgaW5kZXggaW4gdGhlIGFycmF5LCByZXR1cm5zIHtvZmZzZXQsIG9uZX1cbmJpdGFycmF5LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG0sIHcsIG9uZSwgaSwgbGVuO1xuXG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICBtID0gdGhpcy5tYXNrc1tpXTtcbiAgICB3ID0gdGhpcy53aWR0aCAtICgzMiAqIGkpO1xuICAgIC8vIGlzb2xhdGUgdGhlIHJpZ2h0bW9zdCB6ZXJvIGJpdCBhbmQgcmV0dXJuIGl0IGFzIGFuIHVuc2lnbmVkIGludCBvZiAzMiBiaXRzLCBpZiBOYU4gb3IgLTEsIHJldHVybiBhIDAgXG4gICAgb25lID0gKH5tICYgKG0gKyAxKSkgPj4+IDA7XG5cbiAgICBpZiAodyA+PSAzMiAmJiAhb25lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAodyA8IDMyICYmIChvbmUgJiAoMSA8PCB3KSkpIHtcbiAgICAgIC8vIHdpZGVuIHRoaXMgc3ViYXJyYXlcbiAgICAgIHRoaXNbaV0gPSBhcnJheVdpZGVuKHRoaXNbaV0sIHcgPDw9IDEpO1xuICAgICAgdGhpcy53aWR0aCA9IDMyICogaSArIHc7XG4gICAgfVxuXG4gICAgdGhpcy5tYXNrc1tpXSB8PSBvbmU7XG5cbiAgICByZXR1cm4ge1xuICAgICAgb2Zmc2V0OiBpLFxuICAgICAgb25lOiBvbmVcbiAgICB9O1xuICB9XG5cbiAgLy8gYWRkIGEgbmV3IHN1YmFycmF5XG4gIHRoaXNbdGhpcy5zdWJhcnJheXNdID0gYXJyYXk4KHRoaXMubGVuZ3RoKTtcbiAgdGhpcy5tYXNrc1t0aGlzLnN1YmFycmF5c10gPSAxO1xuICB0aGlzLndpZHRoICs9IDg7XG4gIHJldHVybiB7XG4gICAgb2Zmc2V0OiB0aGlzLnN1YmFycmF5cysrLFxuICAgIG9uZTogMVxuICB9O1xufTtcblxuLy8gQ29weSByZWNvcmQgZnJvbSBpbmRleCBzcmMgdG8gaW5kZXggZGVzdFxuYml0YXJyYXkucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbihkZXN0LCBzcmMpIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIHRoaXNbaV1bZGVzdF0gPSB0aGlzW2ldW3NyY107XG4gIH1cbn07XG5cbi8vIFRydW5jYXRlIHRoZSBhcnJheSB0byB0aGUgZ2l2ZW4gbGVuZ3RoXG5iaXRhcnJheS5wcm90b3R5cGUudHJ1bmNhdGUgPSBmdW5jdGlvbihuKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICBmb3IgKHZhciBqID0gdGhpcy5sZW5ndGggLSAxOyBqID49IG47IGotLSkge1xuICAgICAgdGhpc1tpXVtqXSA9IDA7XG4gICAgfVxuICB9XG4gIHRoaXMubGVuZ3RoID0gbjtcbn07XG5cbi8vIENoZWNrcyB0aGF0IGFsbCBiaXRzIGZvciB0aGUgZ2l2ZW4gaW5kZXggYXJlIDBcbmJpdGFycmF5LnByb3RvdHlwZS56ZXJvID0gZnVuY3Rpb24obikge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNbaV1bbl0pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vLyBDaGVja3MgdGhhdCBhbGwgYml0cyBmb3IgdGhlIGdpdmVuIGluZGV4IGFyZSAwIGV4Y2VwdCBmb3IgcG9zc2libHkgb25lXG5iaXRhcnJheS5wcm90b3R5cGUuemVyb0V4Y2VwdCA9IGZ1bmN0aW9uKG4sIG9mZnNldCwgemVybykge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGkgPT09IG9mZnNldCA/IHRoaXNbaV1bbl0gJiB6ZXJvIDogdGhpc1tpXVtuXSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8vIENoZWNrcyB0aGF0IGFsbCBiaXRzIGZvciB0aGUgZ2l2ZW4gaW5kZXggYXJlIDAgZXhjZXB0IGZvciB0aGUgc3BlY2lmaWVkIG1hc2suXG4vLyBUaGUgbWFzayBzaG91bGQgYmUgYW4gYXJyYXkgb2YgdGhlIHNhbWUgc2l6ZSBhcyB0aGUgZmlsdGVyIHN1YmFycmF5cyB3aWR0aC5cbmJpdGFycmF5LnByb3RvdHlwZS56ZXJvRXhjZXB0TWFzayA9IGZ1bmN0aW9uKG4sIG1hc2spIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICh0aGlzW2ldW25dICYgbWFza1tpXSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gQ2hlY2tzIHRoYXQgb25seSB0aGUgc3BlY2lmaWVkIGJpdCBpcyBzZXQgZm9yIHRoZSBnaXZlbiBpbmRleFxuYml0YXJyYXkucHJvdG90eXBlLm9ubHkgPSBmdW5jdGlvbihuLCBvZmZzZXQsIG9uZSkge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNbaV1bbl0gIT0gKGkgPT09IG9mZnNldCA/IG9uZSA6IDApKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufTtcblxuLy8gQ2hlY2tzIHRoYXQgb25seSB0aGUgc3BlY2lmaWVkIGJpdCBpcyBzZXQgZm9yIHRoZSBnaXZlbiBpbmRleCBleGNlcHQgZm9yIHBvc3NpYmx5IG9uZSBvdGhlclxuYml0YXJyYXkucHJvdG90eXBlLm9ubHlFeGNlcHQgPSBmdW5jdGlvbihuLCBvZmZzZXQsIHplcm8sIG9ubHlPZmZzZXQsIG9ubHlPbmUpIHtcbiAgdmFyIG1hc2s7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICBtYXNrID0gdGhpc1tpXVtuXTtcbiAgICBpZiAoaSA9PT0gb2Zmc2V0KVxuICAgICAgbWFzayA9IChtYXNrICYgemVybykgPj4+IDA7XG4gICAgaWYgKG1hc2sgIT0gKGkgPT09IG9ubHlPZmZzZXQgPyBvbmx5T25lIDogMCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGFycmF5ODogYXJyYXlVbnR5cGVkLFxuICBhcnJheTE2OiBhcnJheVVudHlwZWQsXG4gIGFycmF5MzI6IGFycmF5VW50eXBlZCxcbiAgYXJyYXlMZW5ndGhlbjogYXJyYXlMZW5ndGhlblVudHlwZWQsXG4gIGFycmF5V2lkZW46IGFycmF5V2lkZW5VbnR5cGVkLFxuICBiaXRhcnJheTogYml0YXJyYXlcbn07XG4iLCJjb25zdCBmaWx0ZXJFeGFjdCA9IChiaXNlY3QsIHZhbHVlKSA9PiB7XG4gIHJldHVybiBmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICB2YXIgbiA9IHZhbHVlcy5sZW5ndGg7XG4gICAgcmV0dXJuIFtiaXNlY3QubGVmdCh2YWx1ZXMsIHZhbHVlLCAwLCBuKSwgYmlzZWN0LnJpZ2h0KHZhbHVlcywgdmFsdWUsIDAsIG4pXTtcbiAgfTtcbn1cblxuY29uc3QgZmlsdGVyUmFuZ2UgPSAoYmlzZWN0LCByYW5nZSkgPT4ge1xuICB2YXIgbWluID0gcmFuZ2VbMF0sXG4gICAgICBtYXggPSByYW5nZVsxXTtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlcykge1xuICAgIHZhciBuID0gdmFsdWVzLmxlbmd0aDtcbiAgICByZXR1cm4gW2Jpc2VjdC5sZWZ0KHZhbHVlcywgbWluLCAwLCBuKSwgYmlzZWN0LmxlZnQodmFsdWVzLCBtYXgsIDAsIG4pXTtcbiAgfTtcbn1cblxuY29uc3QgZmlsdGVyQWxsID0gdmFsdWVzID0+IHtcbiAgcmV0dXJuIFswLCB2YWx1ZXMubGVuZ3RoXTtcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICBmaWx0ZXJFeGFjdCxcbiAgZmlsdGVyUmFuZ2UsXG4gIGZpbHRlckFsbFxufTtcbiIsImV4cG9ydCBkZWZhdWx0IGQgPT4ge1xuICByZXR1cm4gZDtcbn07XG4iLCJleHBvcnQgZGVmYXVsdCAoKSA9PiAge1xuICByZXR1cm4gbnVsbDtcbn1cbiIsImV4cG9ydCBkZWZhdWx0ICgpID0+IHtcbiAgcmV0dXJuIDA7XG59XG4iLCJpbXBvcnQgaWRlbnRpdHkgZnJvbSAnLi9pZGVudGl0eSc7XG5cbmZ1bmN0aW9uIGhlYXBfYnkoZikge1xuXG4gIC8vIEJ1aWxkcyBhIGJpbmFyeSBoZWFwIHdpdGhpbiB0aGUgc3BlY2lmaWVkIGFycmF5IGFbbG86aGldLiBUaGUgaGVhcCBoYXMgdGhlXG4gIC8vIHByb3BlcnR5IHN1Y2ggdGhhdCB0aGUgcGFyZW50IGFbbG8raV0gaXMgYWx3YXlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byBpdHNcbiAgLy8gdHdvIGNoaWxkcmVuOiBhW2xvKzIqaSsxXSBhbmQgYVtsbysyKmkrMl0uXG4gIGZ1bmN0aW9uIGhlYXAoYSwgbG8sIGhpKSB7XG4gICAgdmFyIG4gPSBoaSAtIGxvLFxuICAgICAgICBpID0gKG4gPj4+IDEpICsgMTtcbiAgICB3aGlsZSAoLS1pID4gMCkgc2lmdChhLCBpLCBuLCBsbyk7XG4gICAgcmV0dXJuIGE7XG4gIH1cblxuICAvLyBTb3J0cyB0aGUgc3BlY2lmaWVkIGFycmF5IGFbbG86aGldIGluIGRlc2NlbmRpbmcgb3JkZXIsIGFzc3VtaW5nIGl0IGlzXG4gIC8vIGFscmVhZHkgYSBoZWFwLlxuICBmdW5jdGlvbiBzb3J0KGEsIGxvLCBoaSkge1xuICAgIHZhciBuID0gaGkgLSBsbyxcbiAgICAgICAgdDtcbiAgICB3aGlsZSAoLS1uID4gMCkgdCA9IGFbbG9dLCBhW2xvXSA9IGFbbG8gKyBuXSwgYVtsbyArIG5dID0gdCwgc2lmdChhLCAxLCBuLCBsbyk7XG4gICAgcmV0dXJuIGE7XG4gIH1cblxuICAvLyBTaWZ0cyB0aGUgZWxlbWVudCBhW2xvK2ktMV0gZG93biB0aGUgaGVhcCwgd2hlcmUgdGhlIGhlYXAgaXMgdGhlIGNvbnRpZ3VvdXNcbiAgLy8gc2xpY2Ugb2YgYXJyYXkgYVtsbzpsbytuXS4gVGhpcyBtZXRob2QgY2FuIGFsc28gYmUgdXNlZCB0byB1cGRhdGUgdGhlIGhlYXBcbiAgLy8gaW5jcmVtZW50YWxseSwgd2l0aG91dCBpbmN1cnJpbmcgdGhlIGZ1bGwgY29zdCBvZiByZWNvbnN0cnVjdGluZyB0aGUgaGVhcC5cbiAgZnVuY3Rpb24gc2lmdChhLCBpLCBuLCBsbykge1xuICAgIHZhciBkID0gYVstLWxvICsgaV0sXG4gICAgICAgIHggPSBmKGQpLFxuICAgICAgICBjaGlsZDtcbiAgICB3aGlsZSAoKGNoaWxkID0gaSA8PCAxKSA8PSBuKSB7XG4gICAgICBpZiAoY2hpbGQgPCBuICYmIGYoYVtsbyArIGNoaWxkXSkgPiBmKGFbbG8gKyBjaGlsZCArIDFdKSkgY2hpbGQrKztcbiAgICAgIGlmICh4IDw9IGYoYVtsbyArIGNoaWxkXSkpIGJyZWFrO1xuICAgICAgYVtsbyArIGldID0gYVtsbyArIGNoaWxkXTtcbiAgICAgIGkgPSBjaGlsZDtcbiAgICB9XG4gICAgYVtsbyArIGldID0gZDtcbiAgfVxuXG4gIGhlYXAuc29ydCA9IHNvcnQ7XG4gIHJldHVybiBoZWFwO1xufVxuXG5jb25zdCBoID0gaGVhcF9ieShpZGVudGl0eSk7XG5oLmJ5ID0gaGVhcF9ieTtcblxuZXhwb3J0IGRlZmF1bHQgaDtcbiIsImltcG9ydCBpZGVudGl0eSBmcm9tICcuL2lkZW50aXR5JztcbmltcG9ydCB4RmlsdGVySGVhcCBmcm9tICcuL2hlYXAnO1xuXG5mdW5jdGlvbiBoZWFwc2VsZWN0X2J5KGYpIHtcbiAgdmFyIGhlYXAgPSB4RmlsdGVySGVhcC5ieShmKTtcblxuICAvLyBSZXR1cm5zIGEgbmV3IGFycmF5IGNvbnRhaW5pbmcgdGhlIHRvcCBrIGVsZW1lbnRzIGluIHRoZSBhcnJheSBhW2xvOmhpXS5cbiAgLy8gVGhlIHJldHVybmVkIGFycmF5IGlzIG5vdCBzb3J0ZWQsIGJ1dCBtYWludGFpbnMgdGhlIGhlYXAgcHJvcGVydHkuIElmIGsgaXNcbiAgLy8gZ3JlYXRlciB0aGFuIGhpIC0gbG8sIHRoZW4gZmV3ZXIgdGhhbiBrIGVsZW1lbnRzIHdpbGwgYmUgcmV0dXJuZWQuIFRoZVxuICAvLyBvcmRlciBvZiBlbGVtZW50cyBpbiBhIGlzIHVuY2hhbmdlZCBieSB0aGlzIG9wZXJhdGlvbi5cbiAgZnVuY3Rpb24gaGVhcHNlbGVjdChhLCBsbywgaGksIGspIHtcbiAgICB2YXIgcXVldWUgPSBuZXcgQXJyYXkoayA9IE1hdGgubWluKGhpIC0gbG8sIGspKSxcbiAgICAgICAgbWluLFxuICAgICAgICBpLFxuICAgICAgICBkO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGs7ICsraSkgcXVldWVbaV0gPSBhW2xvKytdO1xuICAgIGhlYXAocXVldWUsIDAsIGspO1xuXG4gICAgaWYgKGxvIDwgaGkpIHtcbiAgICAgIG1pbiA9IGYocXVldWVbMF0pO1xuICAgICAgZG8ge1xuICAgICAgICBpZiAoZihkID0gYVtsb10pID4gbWluKSB7XG4gICAgICAgICAgcXVldWVbMF0gPSBkO1xuICAgICAgICAgIG1pbiA9IGYoaGVhcChxdWV1ZSwgMCwgaylbMF0pO1xuICAgICAgICB9XG4gICAgICB9IHdoaWxlICgrK2xvIDwgaGkpO1xuICAgIH1cblxuICAgIHJldHVybiBxdWV1ZTtcbiAgfVxuXG4gIHJldHVybiBoZWFwc2VsZWN0O1xufVxuXG5cbmNvbnN0IGggPSBoZWFwc2VsZWN0X2J5KGlkZW50aXR5KTtcbmguYnkgPSBoZWFwc2VsZWN0X2J5OyAvLyBhc3NpZ24gdGhlIHJhdyBmdW5jdGlvbiB0byB0aGUgZXhwb3J0IGFzIHdlbGxcblxuZXhwb3J0IGRlZmF1bHQgaDtcbiIsImltcG9ydCBpZGVudGl0eSBmcm9tICcuL2lkZW50aXR5JztcblxuZnVuY3Rpb24gYmlzZWN0X2J5KGYpIHtcblxuICAvLyBMb2NhdGUgdGhlIGluc2VydGlvbiBwb2ludCBmb3IgeCBpbiBhIHRvIG1haW50YWluIHNvcnRlZCBvcmRlci4gVGhlXG4gIC8vIGFyZ3VtZW50cyBsbyBhbmQgaGkgbWF5IGJlIHVzZWQgdG8gc3BlY2lmeSBhIHN1YnNldCBvZiB0aGUgYXJyYXkgd2hpY2hcbiAgLy8gc2hvdWxkIGJlIGNvbnNpZGVyZWQ7IGJ5IGRlZmF1bHQgdGhlIGVudGlyZSBhcnJheSBpcyB1c2VkLiBJZiB4IGlzIGFscmVhZHlcbiAgLy8gcHJlc2VudCBpbiBhLCB0aGUgaW5zZXJ0aW9uIHBvaW50IHdpbGwgYmUgYmVmb3JlICh0byB0aGUgbGVmdCBvZikgYW55XG4gIC8vIGV4aXN0aW5nIGVudHJpZXMuIFRoZSByZXR1cm4gdmFsdWUgaXMgc3VpdGFibGUgZm9yIHVzZSBhcyB0aGUgZmlyc3RcbiAgLy8gYXJndW1lbnQgdG8gYGFycmF5LnNwbGljZWAgYXNzdW1pbmcgdGhhdCBhIGlzIGFscmVhZHkgc29ydGVkLlxuICAvL1xuICAvLyBUaGUgcmV0dXJuZWQgaW5zZXJ0aW9uIHBvaW50IGkgcGFydGl0aW9ucyB0aGUgYXJyYXkgYSBpbnRvIHR3byBoYWx2ZXMgc29cbiAgLy8gdGhhdCBhbGwgdiA8IHggZm9yIHYgaW4gYVtsbzppXSBmb3IgdGhlIGxlZnQgc2lkZSBhbmQgYWxsIHYgPj0geCBmb3IgdiBpblxuICAvLyBhW2k6aGldIGZvciB0aGUgcmlnaHQgc2lkZS5cbiAgZnVuY3Rpb24gYmlzZWN0TGVmdChhLCB4LCBsbywgaGkpIHtcbiAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgdmFyIG1pZCA9IGxvICsgaGkgPj4+IDE7XG4gICAgICBpZiAoZihhW21pZF0pIDwgeCkgbG8gPSBtaWQgKyAxO1xuICAgICAgZWxzZSBoaSA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvO1xuICB9XG5cbiAgLy8gU2ltaWxhciB0byBiaXNlY3RMZWZ0LCBidXQgcmV0dXJucyBhbiBpbnNlcnRpb24gcG9pbnQgd2hpY2ggY29tZXMgYWZ0ZXIgKHRvXG4gIC8vIHRoZSByaWdodCBvZikgYW55IGV4aXN0aW5nIGVudHJpZXMgb2YgeCBpbiBhLlxuICAvL1xuICAvLyBUaGUgcmV0dXJuZWQgaW5zZXJ0aW9uIHBvaW50IGkgcGFydGl0aW9ucyB0aGUgYXJyYXkgaW50byB0d28gaGFsdmVzIHNvIHRoYXRcbiAgLy8gYWxsIHYgPD0geCBmb3IgdiBpbiBhW2xvOmldIGZvciB0aGUgbGVmdCBzaWRlIGFuZCBhbGwgdiA+IHggZm9yIHYgaW5cbiAgLy8gYVtpOmhpXSBmb3IgdGhlIHJpZ2h0IHNpZGUuXG4gIGZ1bmN0aW9uIGJpc2VjdFJpZ2h0KGEsIHgsIGxvLCBoaSkge1xuICAgIHdoaWxlIChsbyA8IGhpKSB7XG4gICAgICB2YXIgbWlkID0gbG8gKyBoaSA+Pj4gMTtcbiAgICAgIGlmICh4IDwgZihhW21pZF0pKSBoaSA9IG1pZDtcbiAgICAgIGVsc2UgbG8gPSBtaWQgKyAxO1xuICAgIH1cbiAgICByZXR1cm4gbG87XG4gIH1cblxuICBiaXNlY3RSaWdodC5yaWdodCA9IGJpc2VjdFJpZ2h0O1xuICBiaXNlY3RSaWdodC5sZWZ0ID0gYmlzZWN0TGVmdDtcbiAgcmV0dXJuIGJpc2VjdFJpZ2h0O1xufVxuXG5jb25zdCBiaXNlY3QgPSBiaXNlY3RfYnkoaWRlbnRpdHkpO1xuYmlzZWN0LmJ5ID0gYmlzZWN0X2J5OyAvLyBhc3NpZ24gdGhlIHJhdyBmdW5jdGlvbiB0byB0aGUgZXhwb3J0IGFzIHdlbGxcblxuZXhwb3J0IGRlZmF1bHQgYmlzZWN0O1xuXG4iLCJleHBvcnQgZGVmYXVsdCAoYXJyYXksIGluZGV4LCBkZWVwKSA9PiB7XG4gIGZvciAodmFyIGkgPSAwLCBuID0gaW5kZXgubGVuZ3RoLCBjb3B5ID0gZGVlcCA/IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoYXJyYXkpKSA6IG5ldyBBcnJheShuKTsgaSA8IG47ICsraSkge1xuICAgIGNvcHlbaV0gPSBhcnJheVtpbmRleFtpXV07XG4gIH1cbiAgcmV0dXJuIGNvcHk7XG59XG4iLCJjb25zdCByZWR1Y2VJbmNyZW1lbnQgPSBwID0+IHtcbiAgcmV0dXJuIHAgKyAxO1xufVxuXG5jb25zdCByZWR1Y2VEZWNyZW1lbnQgPSBwID0+IHtcbiAgcmV0dXJuIHAgLSAxO1xufVxuXG5jb25zdCByZWR1Y2VBZGQgPSBmID0+IHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHAsIHYpIHtcbiAgICByZXR1cm4gcCArICtmKHYpO1xuICB9O1xufVxuXG5jb25zdCByZWR1Y2VTdWJ0cmFjdCA9IGYgPT4ge1xuICByZXR1cm4gZnVuY3Rpb24ocCwgdikge1xuICAgIHJldHVybiBwIC0gZih2KTtcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICByZWR1Y2VJbmNyZW1lbnQsXG4gIHJlZHVjZURlY3JlbWVudCxcbiAgcmVkdWNlQWRkLFxuICByZWR1Y2VTdWJ0cmFjdFxufTtcbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHQsZSxpLG4scil7Zm9yKHIgaW4gbj0oaT1pLnNwbGl0KFwiLlwiKSkuc3BsaWNlKC0xLDEpLGkpZT1lW2lbcl1dPWVbaVtyXV18fHt9O3JldHVybiB0KGUsbil9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGVlcG9iai5tLmpzLm1hcFxuIiwiaW1wb3J0IGRlZXAgZnJvbSBcIkByYW5mZGV2L2RlZXBvYmpcIlxuLy8gTm90ZShjZyk6IHJlc3VsdCB3YXMgcHJldmlzb3VseSB1c2luZyBsb2Rhc2gucmVzdWx0LCBub3QgRVNNIGNvbXBhdGlibGUuXG4gXG5jb25zdCBnZXQgPSAob2JqLCBwcm9wKSA9PiB7XG4gIGNvbnN0IHZhbHVlID0gb2JqW3Byb3BdO1xuICByZXR1cm4gKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykgPyB2YWx1ZS5jYWxsKG9iaikgOiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBnZXQgdmFsdWUgb2Ygb2JqZWN0IGF0IGEgZGVlcCBwYXRoLlxuICogaWYgdGhlIHJlc29sdmVkIHZhbHVlIGlzIGEgZnVuY3Rpb24sXG4gKiBpdCdzIGludm9rZWQgd2l0aCB0aGUgYHRoaXNgIGJpbmRpbmcgb2YgXG4gKiBpdHMgcGFyZW50IG9iamVjdCBhbmQgaXRzIHJlc3VsdCBpcyByZXR1cm5lZC4gXG4gKiAgXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9iaiAgdGhlIG9iamVjdCAoZS5nLiB7ICdhJzogW3sgJ2InOiB7ICdjMSc6IDMsICdjMic6IDR9IH1dLCAnZCc6IHtlOjF9IH07IClcbiAqIEBwYXJhbSAge1N0cmluZ30gcGF0aCBkZWVwIHBhdGggKGUuZy4gYGQuZWBgIG9yIGBhWzBdLmIuYzFgLiBEb3Qgbm90YXRpb24gKGEuMC5iKWlzIGFsc28gc3VwcG9ydGVkKVxuICogQHJldHVybiB7QW55fSAgICAgIHRoZSByZXNvbHZlZCB2YWx1ZVxuICovXG5jb25zdCByZWcgPSAvXFxbKFtcXHdcXGRdKylcXF0vZztcbmV4cG9ydCBkZWZhdWx0IChvYmosIHBhdGgpID0+IHtcbiAgcmV0dXJuIGRlZXAoZ2V0LCBvYmosIHBhdGgucmVwbGFjZShyZWcsICcuJDEnKSlcbn1cbiIsImltcG9ydCB4ZmlsdGVyQXJyYXkgZnJvbSAnLi9hcnJheSc7XG5pbXBvcnQgeGZpbHRlckZpbHRlciBmcm9tICcuL2ZpbHRlcic7XG5pbXBvcnQgY3JfaWRlbnRpdHkgZnJvbSAnLi9pZGVudGl0eSc7XG5pbXBvcnQgY3JfbnVsbCBmcm9tICcuL251bGwnO1xuaW1wb3J0IGNyX3plcm8gZnJvbSAnLi96ZXJvJztcbmltcG9ydCB4ZmlsdGVySGVhcHNlbGVjdCBmcm9tICcuL2hlYXBzZWxlY3QnO1xuaW1wb3J0IHhmaWx0ZXJIZWFwIGZyb20gJy4vaGVhcCc7XG5pbXBvcnQgYmlzZWN0IGZyb20gJy4vYmlzZWN0JztcbmltcG9ydCBwZXJtdXRlIGZyb20gJy4vcGVybXV0ZSc7XG5pbXBvcnQgeGZpbHRlclJlZHVjZSBmcm9tICcuL3JlZHVjZSc7XG5pbXBvcnQgcmVzdWx0IGZyb20gJy4vcmVzdWx0JztcblxuLy8gY29uc3RhbnRzXG52YXIgUkVNT1ZFRF9JTkRFWCA9IC0xO1xuXG5jcm9zc2ZpbHRlci5oZWFwID0geGZpbHRlckhlYXA7XG5jcm9zc2ZpbHRlci5oZWFwc2VsZWN0ID0geGZpbHRlckhlYXBzZWxlY3Q7XG5jcm9zc2ZpbHRlci5iaXNlY3QgPSBiaXNlY3Q7XG5jcm9zc2ZpbHRlci5wZXJtdXRlID0gcGVybXV0ZTtcbmV4cG9ydCBkZWZhdWx0IGNyb3NzZmlsdGVyO1xuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcigpIHtcbiAgdmFyIGNyb3NzZmlsdGVyID0ge1xuICAgIGFkZDogYWRkLFxuICAgIHJlbW92ZTogcmVtb3ZlRGF0YSxcbiAgICBkaW1lbnNpb246IGRpbWVuc2lvbixcbiAgICBncm91cEFsbDogZ3JvdXBBbGwsXG4gICAgc2l6ZTogc2l6ZSxcbiAgICBhbGw6IGFsbCxcbiAgICBhbGxGaWx0ZXJlZDogYWxsRmlsdGVyZWQsXG4gICAgb25DaGFuZ2U6IG9uQ2hhbmdlLFxuICAgIGlzRWxlbWVudEZpbHRlcmVkOiBpc0VsZW1lbnRGaWx0ZXJlZFxuICB9O1xuXG4gIHZhciBkYXRhID0gW10sIC8vIHRoZSByZWNvcmRzXG4gICAgICBuID0gMCwgLy8gdGhlIG51bWJlciBvZiByZWNvcmRzOyBkYXRhLmxlbmd0aFxuICAgICAgZmlsdGVycywgLy8gMSBpcyBmaWx0ZXJlZCBvdXRcbiAgICAgIGZpbHRlckxpc3RlbmVycyA9IFtdLCAvLyB3aGVuIHRoZSBmaWx0ZXJzIGNoYW5nZVxuICAgICAgZGF0YUxpc3RlbmVycyA9IFtdLCAvLyB3aGVuIGRhdGEgaXMgYWRkZWRcbiAgICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMgPSBbXSwgLy8gd2hlbiBkYXRhIGlzIHJlbW92ZWRcbiAgICAgIGNhbGxiYWNrcyA9IFtdO1xuXG4gIGZpbHRlcnMgPSBuZXcgeGZpbHRlckFycmF5LmJpdGFycmF5KDApO1xuXG4gIC8vIEFkZHMgdGhlIHNwZWNpZmllZCBuZXcgcmVjb3JkcyB0byB0aGlzIGNyb3NzZmlsdGVyLlxuICBmdW5jdGlvbiBhZGQobmV3RGF0YSkge1xuICAgIHZhciBuMCA9IG4sXG4gICAgICAgIG4xID0gbmV3RGF0YS5sZW5ndGg7XG5cbiAgICAvLyBJZiB0aGVyZSdzIGFjdHVhbGx5IG5ldyBkYXRhIHRvIGFkZOKAplxuICAgIC8vIE1lcmdlIHRoZSBuZXcgZGF0YSBpbnRvIHRoZSBleGlzdGluZyBkYXRhLlxuICAgIC8vIExlbmd0aGVuIHRoZSBmaWx0ZXIgYml0c2V0IHRvIGhhbmRsZSB0aGUgbmV3IHJlY29yZHMuXG4gICAgLy8gTm90aWZ5IGxpc3RlbmVycyAoZGltZW5zaW9ucyBhbmQgZ3JvdXBzKSB0aGF0IG5ldyBkYXRhIGlzIGF2YWlsYWJsZS5cbiAgICBpZiAobjEpIHtcbiAgICAgIGRhdGEgPSBkYXRhLmNvbmNhdChuZXdEYXRhKTtcbiAgICAgIGZpbHRlcnMubGVuZ3RoZW4obiArPSBuMSk7XG4gICAgICBkYXRhTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG5ld0RhdGEsIG4wLCBuMSk7IH0pO1xuICAgICAgdHJpZ2dlck9uQ2hhbmdlKCdkYXRhQWRkZWQnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY3Jvc3NmaWx0ZXI7XG4gIH1cblxuICAvLyBSZW1vdmVzIGFsbCByZWNvcmRzIHRoYXQgbWF0Y2ggdGhlIGN1cnJlbnQgZmlsdGVycywgb3IgaWYgYSBwcmVkaWNhdGUgZnVuY3Rpb24gaXMgcGFzc2VkLFxuICAvLyByZW1vdmVzIGFsbCByZWNvcmRzIG1hdGNoaW5nIHRoZSBwcmVkaWNhdGUgKGlnbm9yaW5nIGZpbHRlcnMpLlxuICBmdW5jdGlvbiByZW1vdmVEYXRhKHByZWRpY2F0ZSkge1xuICAgIHZhciAvLyBNYXBwaW5nIGZyb20gb2xkIHJlY29yZCBpbmRleGVzIHRvIG5ldyBpbmRleGVzIChhZnRlciByZWNvcmRzIHJlbW92ZWQpXG4gICAgICAgIG5ld0luZGV4ID0gbmV3IEFycmF5KG4pLFxuICAgICAgICByZW1vdmVkID0gW10sXG4gICAgICAgIHVzZVByZWQgPSB0eXBlb2YgcHJlZGljYXRlID09PSAnZnVuY3Rpb24nLFxuICAgICAgICBzaG91bGRSZW1vdmUgPSBmdW5jdGlvbiAoaSkge1xuICAgICAgICAgIHJldHVybiB1c2VQcmVkID8gcHJlZGljYXRlKGRhdGFbaV0sIGkpIDogZmlsdGVycy56ZXJvKGkpXG4gICAgICAgIH07XG5cbiAgICBmb3IgKHZhciBpbmRleDEgPSAwLCBpbmRleDIgPSAwOyBpbmRleDEgPCBuOyArK2luZGV4MSkge1xuICAgICAgaWYgKCBzaG91bGRSZW1vdmUoaW5kZXgxKSApIHtcbiAgICAgICAgcmVtb3ZlZC5wdXNoKGluZGV4MSk7XG4gICAgICAgIG5ld0luZGV4W2luZGV4MV0gPSBSRU1PVkVEX0lOREVYO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3SW5kZXhbaW5kZXgxXSA9IGluZGV4MisrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlbW92ZSBhbGwgbWF0Y2hpbmcgcmVjb3JkcyBmcm9tIGdyb3Vwcy5cbiAgICBmaWx0ZXJMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwoLTEsIC0xLCBbXSwgcmVtb3ZlZCwgdHJ1ZSk7IH0pO1xuXG4gICAgLy8gVXBkYXRlIGluZGV4ZXMuXG4gICAgcmVtb3ZlRGF0YUxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChuZXdJbmRleCk7IH0pO1xuXG4gICAgLy8gUmVtb3ZlIG9sZCBmaWx0ZXJzIGFuZCBkYXRhIGJ5IG92ZXJ3cml0aW5nLlxuICAgIGZvciAodmFyIGluZGV4MyA9IDAsIGluZGV4NCA9IDA7IGluZGV4MyA8IG47ICsraW5kZXgzKSB7XG4gICAgICBpZiAoIG5ld0luZGV4W2luZGV4M10gIT09IFJFTU9WRURfSU5ERVggKSB7XG4gICAgICAgIGlmIChpbmRleDMgIT09IGluZGV4NCkgZmlsdGVycy5jb3B5KGluZGV4NCwgaW5kZXgzKSwgZGF0YVtpbmRleDRdID0gZGF0YVtpbmRleDNdO1xuICAgICAgICArK2luZGV4NDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBkYXRhLmxlbmd0aCA9IG4gPSBpbmRleDQ7XG4gICAgZmlsdGVycy50cnVuY2F0ZShpbmRleDQpO1xuICAgIHRyaWdnZXJPbkNoYW5nZSgnZGF0YVJlbW92ZWQnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1hc2tGb3JEaW1lbnNpb25zKGRpbWVuc2lvbnMpIHtcbiAgICB2YXIgbixcbiAgICAgICAgZCxcbiAgICAgICAgbGVuLFxuICAgICAgICBpZCxcbiAgICAgICAgbWFzayA9IEFycmF5KGZpbHRlcnMuc3ViYXJyYXlzKTtcbiAgICBmb3IgKG4gPSAwOyBuIDwgZmlsdGVycy5zdWJhcnJheXM7IG4rKykgeyBtYXNrW25dID0gfjA7IH1cbiAgICBmb3IgKGQgPSAwLCBsZW4gPSBkaW1lbnNpb25zLmxlbmd0aDsgZCA8IGxlbjsgZCsrKSB7XG4gICAgICAvLyBUaGUgdG9wIGJpdHMgb2YgdGhlIElEIGFyZSB0aGUgc3ViYXJyYXkgb2Zmc2V0IGFuZCB0aGUgbG93ZXIgYml0cyBhcmUgdGhlIGJpdFxuICAgICAgLy8gb2Zmc2V0IG9mIHRoZSBcIm9uZVwiIG1hc2suXG4gICAgICBpZCA9IGRpbWVuc2lvbnNbZF0uaWQoKTtcbiAgICAgIG1hc2tbaWQgPj4gN10gJj0gfigweDEgPDwgKGlkICYgMHgzZikpO1xuICAgIH1cbiAgICByZXR1cm4gbWFzaztcbiAgfVxuXG4gIC8vIFJldHVybiB0cnVlIGlmIHRoZSBkYXRhIGVsZW1lbnQgYXQgaW5kZXggaSBpcyBmaWx0ZXJlZCBJTi5cbiAgLy8gT3B0aW9uYWxseSwgaWdub3JlIHRoZSBmaWx0ZXJzIG9mIGFueSBkaW1lbnNpb25zIGluIHRoZSBpZ25vcmVfZGltZW5zaW9ucyBsaXN0LlxuICBmdW5jdGlvbiBpc0VsZW1lbnRGaWx0ZXJlZChpLCBpZ25vcmVfZGltZW5zaW9ucykge1xuICAgIHZhciBtYXNrID0gbWFza0ZvckRpbWVuc2lvbnMoaWdub3JlX2RpbWVuc2lvbnMgfHwgW10pO1xuICAgIHJldHVybiBmaWx0ZXJzLnplcm9FeGNlcHRNYXNrKGksbWFzayk7XG4gIH1cblxuICAvLyBBZGRzIGEgbmV3IGRpbWVuc2lvbiB3aXRoIHRoZSBzcGVjaWZpZWQgdmFsdWUgYWNjZXNzb3IgZnVuY3Rpb24uXG4gIGZ1bmN0aW9uIGRpbWVuc2lvbih2YWx1ZSwgaXRlcmFibGUpIHtcblxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICB2YXIgYWNjZXNzb3JQYXRoID0gdmFsdWU7XG4gICAgICB2YWx1ZSA9IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHJlc3VsdChkLCBhY2Nlc3NvclBhdGgpOyB9O1xuICAgIH1cblxuICAgIHZhciBkaW1lbnNpb24gPSB7XG4gICAgICBmaWx0ZXI6IGZpbHRlcixcbiAgICAgIGZpbHRlckV4YWN0OiBmaWx0ZXJFeGFjdCxcbiAgICAgIGZpbHRlclJhbmdlOiBmaWx0ZXJSYW5nZSxcbiAgICAgIGZpbHRlckZ1bmN0aW9uOiBmaWx0ZXJGdW5jdGlvbixcbiAgICAgIGZpbHRlckFsbDogZmlsdGVyQWxsLFxuICAgICAgY3VycmVudEZpbHRlcjogY3VycmVudEZpbHRlcixcbiAgICAgIGhhc0N1cnJlbnRGaWx0ZXI6IGhhc0N1cnJlbnRGaWx0ZXIsXG4gICAgICB0b3A6IHRvcCxcbiAgICAgIGJvdHRvbTogYm90dG9tLFxuICAgICAgZ3JvdXA6IGdyb3VwLFxuICAgICAgZ3JvdXBBbGw6IGdyb3VwQWxsLFxuICAgICAgZGlzcG9zZTogZGlzcG9zZSxcbiAgICAgIHJlbW92ZTogZGlzcG9zZSwgLy8gZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5XG4gICAgICBhY2Nlc3NvcjogdmFsdWUsXG4gICAgICBpZDogZnVuY3Rpb24oKSB7IHJldHVybiBpZDsgfVxuICAgIH07XG5cbiAgICB2YXIgb25lLCAvLyBsb3dlc3QgdW5zZXQgYml0IGFzIG1hc2ssIGUuZy4sIDAwMDAxMDAwXG4gICAgICAgIHplcm8sIC8vIGludmVydGVkIG9uZSwgZS5nLiwgMTExMTAxMTFcbiAgICAgICAgb2Zmc2V0LCAvLyBvZmZzZXQgaW50byB0aGUgZmlsdGVycyBhcnJheXNcbiAgICAgICAgaWQsIC8vIHVuaXF1ZSBJRCBmb3IgdGhpcyBkaW1lbnNpb24gKHJldXNlZCB3aGVuIGRpbWVuc2lvbnMgYXJlIGRpc3Bvc2VkKVxuICAgICAgICB2YWx1ZXMsIC8vIHNvcnRlZCwgY2FjaGVkIGFycmF5XG4gICAgICAgIGluZGV4LCAvLyBtYXBzIHNvcnRlZCB2YWx1ZSBpbmRleCAtPiByZWNvcmQgaW5kZXggKGluIGRhdGEpXG4gICAgICAgIG5ld1ZhbHVlcywgLy8gdGVtcG9yYXJ5IGFycmF5IHN0b3JpbmcgbmV3bHktYWRkZWQgdmFsdWVzXG4gICAgICAgIG5ld0luZGV4LCAvLyB0ZW1wb3JhcnkgYXJyYXkgc3RvcmluZyBuZXdseS1hZGRlZCBpbmRleFxuICAgICAgICBpdGVyYWJsZXNJbmRleENvdW50LFxuICAgICAgICBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyxcbiAgICAgICAgaXRlcmFibGVzRW1wdHlSb3dzID0gW10sXG4gICAgICAgIHNvcnRSYW5nZSA9IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgICByZXR1cm4gY3JfcmFuZ2Uobikuc29ydChmdW5jdGlvbihBLCBCKSB7XG4gICAgICAgICAgICB2YXIgYSA9IG5ld1ZhbHVlc1tBXSwgYiA9IG5ld1ZhbHVlc1tCXTtcbiAgICAgICAgICAgIHJldHVybiBhIDwgYiA/IC0xIDogYSA+IGIgPyAxIDogQSAtIEI7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlZmlsdGVyID0geGZpbHRlckZpbHRlci5maWx0ZXJBbGwsIC8vIGZvciByZWNvbXB1dGluZyBmaWx0ZXJcbiAgICAgICAgcmVmaWx0ZXJGdW5jdGlvbiwgLy8gdGhlIGN1c3RvbSBmaWx0ZXIgZnVuY3Rpb24gaW4gdXNlXG4gICAgICAgIGZpbHRlclZhbHVlLCAvLyB0aGUgdmFsdWUgdXNlZCBmb3IgZmlsdGVyaW5nICh2YWx1ZSwgYXJyYXksIGZ1bmN0aW9uIG9yIHVuZGVmaW5lZClcbiAgICAgICAgZmlsdGVyVmFsdWVQcmVzZW50LCAvLyB0cnVlIGlmIGZpbHRlclZhbHVlIGNvbnRhaW5zIHNvbWV0aGluZ1xuICAgICAgICBpbmRleExpc3RlbmVycyA9IFtdLCAvLyB3aGVuIGRhdGEgaXMgYWRkZWRcbiAgICAgICAgZGltZW5zaW9uR3JvdXBzID0gW10sXG4gICAgICAgIGxvMCA9IDAsXG4gICAgICAgIGhpMCA9IDAsXG4gICAgICAgIHQgPSAwLFxuICAgICAgICBrO1xuXG4gICAgLy8gVXBkYXRpbmcgYSBkaW1lbnNpb24gaXMgYSB0d28tc3RhZ2UgcHJvY2Vzcy4gRmlyc3QsIHdlIG11c3QgdXBkYXRlIHRoZVxuICAgIC8vIGFzc29jaWF0ZWQgZmlsdGVycyBmb3IgdGhlIG5ld2x5LWFkZGVkIHJlY29yZHMuIE9uY2UgYWxsIGRpbWVuc2lvbnMgaGF2ZVxuICAgIC8vIHVwZGF0ZWQgdGhlaXIgZmlsdGVycywgdGhlIGdyb3VwcyBhcmUgbm90aWZpZWQgdG8gdXBkYXRlLlxuICAgIGRhdGFMaXN0ZW5lcnMudW5zaGlmdChwcmVBZGQpO1xuICAgIGRhdGFMaXN0ZW5lcnMucHVzaChwb3N0QWRkKTtcblxuICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMucHVzaChyZW1vdmVEYXRhKTtcblxuICAgIC8vIEFkZCBhIG5ldyBkaW1lbnNpb24gaW4gdGhlIGZpbHRlciBiaXRtYXAgYW5kIHN0b3JlIHRoZSBvZmZzZXQgYW5kIGJpdG1hc2suXG4gICAgdmFyIHRtcCA9IGZpbHRlcnMuYWRkKCk7XG4gICAgb2Zmc2V0ID0gdG1wLm9mZnNldDtcbiAgICBvbmUgPSB0bXAub25lO1xuICAgIHplcm8gPSB+b25lO1xuXG4gICAgLy8gQ3JlYXRlIGEgdW5pcXVlIElEIGZvciB0aGUgZGltZW5zaW9uXG4gICAgLy8gSURzIHdpbGwgYmUgcmUtdXNlZCBpZiBkaW1lbnNpb25zIGFyZSBkaXNwb3NlZC5cbiAgICAvLyBGb3IgaW50ZXJuYWwgdXNlIHRoZSBJRCBpcyB0aGUgc3ViYXJyYXkgb2Zmc2V0IHNoaWZ0ZWQgbGVmdCA3IGJpdHMgb3InZCB3aXRoIHRoZVxuICAgIC8vIGJpdCBvZmZzZXQgb2YgdGhlIHNldCBiaXQgaW4gdGhlIGRpbWVuc2lvbidzIFwib25lXCIgbWFzay5cbiAgICBpZCA9IChvZmZzZXQgPDwgNykgfCAoTWF0aC5sb2cob25lKSAvIE1hdGgubG9nKDIpKTtcblxuICAgIHByZUFkZChkYXRhLCAwLCBuKTtcbiAgICBwb3N0QWRkKGRhdGEsIDAsIG4pO1xuXG4gICAgLy8gSW5jb3Jwb3JhdGVzIHRoZSBzcGVjaWZpZWQgbmV3IHJlY29yZHMgaW50byB0aGlzIGRpbWVuc2lvbi5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciB1cGRhdGluZyBmaWx0ZXJzLCB2YWx1ZXMsIGFuZCBpbmRleC5cbiAgICBmdW5jdGlvbiBwcmVBZGQobmV3RGF0YSwgbjAsIG4xKSB7XG4gICAgICB2YXIgbmV3SXRlcmFibGVzSW5kZXhDb3VudCxcbiAgICAgICAgICBuZXdJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cztcblxuICAgICAgaWYgKGl0ZXJhYmxlKXtcbiAgICAgICAgLy8gQ291bnQgYWxsIHRoZSB2YWx1ZXNcbiAgICAgICAgdCA9IDA7XG4gICAgICAgIGogPSAwO1xuICAgICAgICBrID0gW107XG5cbiAgICAgICAgZm9yICh2YXIgaTAgPSAwOyBpMCA8IG5ld0RhdGEubGVuZ3RoOyBpMCsrKSB7XG4gICAgICAgICAgZm9yKGogPSAwLCBrID0gdmFsdWUobmV3RGF0YVtpMF0pOyBqIDwgay5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdCsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG5ld1ZhbHVlcyA9IFtdO1xuICAgICAgICBuZXdJdGVyYWJsZXNJbmRleENvdW50ID0gY3JfcmFuZ2UobmV3RGF0YS5sZW5ndGgpO1xuICAgICAgICBuZXdJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyA9IGNyX2luZGV4KHQsMSk7XG4gICAgICAgIHZhciB1bnNvcnRlZEluZGV4ID0gY3JfcmFuZ2UodCk7XG5cbiAgICAgICAgZm9yICh2YXIgbCA9IDAsIGluZGV4MSA9IDA7IGluZGV4MSA8IG5ld0RhdGEubGVuZ3RoOyBpbmRleDErKykge1xuICAgICAgICAgIGsgPSB2YWx1ZShuZXdEYXRhW2luZGV4MV0pXG4gICAgICAgICAgLy9cbiAgICAgICAgICBpZighay5sZW5ndGgpe1xuICAgICAgICAgICAgbmV3SXRlcmFibGVzSW5kZXhDb3VudFtpbmRleDFdID0gMDtcbiAgICAgICAgICAgIGl0ZXJhYmxlc0VtcHR5Um93cy5wdXNoKGluZGV4MSArIG4wKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBuZXdJdGVyYWJsZXNJbmRleENvdW50W2luZGV4MV0gPSBrLmxlbmd0aFxuICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBrLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBuZXdWYWx1ZXMucHVzaChrW2pdKTtcbiAgICAgICAgICAgIHVuc29ydGVkSW5kZXhbbF0gPSBpbmRleDE7XG4gICAgICAgICAgICBsKys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBTb3J0IG1hcCB1c2VkIHRvIHNvcnQgYm90aCB0aGUgdmFsdWVzIGFuZCB0aGUgdmFsdWVUb0RhdGEgaW5kaWNlc1xuICAgICAgICB2YXIgc29ydE1hcCA9IHNvcnRSYW5nZSh0KTtcblxuICAgICAgICAvLyBVc2UgdGhlIHNvcnRNYXAgdG8gc29ydCB0aGUgbmV3VmFsdWVzXG4gICAgICAgIG5ld1ZhbHVlcyA9IHBlcm11dGUobmV3VmFsdWVzLCBzb3J0TWFwKTtcblxuXG4gICAgICAgIC8vIFVzZSB0aGUgc29ydE1hcCB0byBzb3J0IHRoZSB1bnNvcnRlZEluZGV4IG1hcFxuICAgICAgICAvLyBuZXdJbmRleCBzaG91bGQgYmUgYSBtYXAgb2Ygc29ydGVkVmFsdWUgLT4gY3Jvc3NmaWx0ZXJEYXRhXG4gICAgICAgIG5ld0luZGV4ID0gcGVybXV0ZSh1bnNvcnRlZEluZGV4LCBzb3J0TWFwKVxuXG4gICAgICB9IGVsc2V7XG4gICAgICAgIC8vIFBlcm11dGUgbmV3IHZhbHVlcyBpbnRvIG5hdHVyYWwgb3JkZXIgdXNpbmcgYSBzdGFuZGFyZCBzb3J0ZWQgaW5kZXguXG4gICAgICAgIG5ld1ZhbHVlcyA9IG5ld0RhdGEubWFwKHZhbHVlKTtcbiAgICAgICAgbmV3SW5kZXggPSBzb3J0UmFuZ2UobjEpO1xuICAgICAgICBuZXdWYWx1ZXMgPSBwZXJtdXRlKG5ld1ZhbHVlcywgbmV3SW5kZXgpO1xuICAgICAgfVxuXG4gICAgICAvLyBCaXNlY3QgbmV3VmFsdWVzIHRvIGRldGVybWluZSB3aGljaCBuZXcgcmVjb3JkcyBhcmUgc2VsZWN0ZWQuXG4gICAgICB2YXIgYm91bmRzID0gcmVmaWx0ZXIobmV3VmFsdWVzKSwgbG8xID0gYm91bmRzWzBdLCBoaTEgPSBib3VuZHNbMV07XG5cbiAgICAgIHZhciBpbmRleDIsIGluZGV4MywgaW5kZXg0O1xuICAgICAgaWYoaXRlcmFibGUpIHtcbiAgICAgICAgbjEgPSB0O1xuICAgICAgICBpZiAocmVmaWx0ZXJGdW5jdGlvbikge1xuICAgICAgICAgIGZvciAoaW5kZXgyID0gMDsgaW5kZXgyIDwgbjE7ICsraW5kZXgyKSB7XG4gICAgICAgICAgICBpZiAoIXJlZmlsdGVyRnVuY3Rpb24obmV3VmFsdWVzW2luZGV4Ml0sIGluZGV4MikpIHtcbiAgICAgICAgICAgICAgaWYoLS1uZXdJdGVyYWJsZXNJbmRleENvdW50W25ld0luZGV4W2luZGV4Ml1dID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW25ld0luZGV4W2luZGV4Ml0gKyBuMF0gfD0gb25lO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIG5ld0l0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2luZGV4Ml0gPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmb3IgKGluZGV4MyA9IDA7IGluZGV4MyA8IGxvMTsgKytpbmRleDMpIHtcbiAgICAgICAgICAgIGlmKC0tbmV3SXRlcmFibGVzSW5kZXhDb3VudFtuZXdJbmRleFtpbmRleDNdXSA9PT0gMCkge1xuICAgICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bbmV3SW5kZXhbaW5kZXgzXSArIG4wXSB8PSBvbmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuZXdJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpbmRleDNdID0gMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChpbmRleDQgPSBoaTE7IGluZGV4NCA8IG4xOyArK2luZGV4NCkge1xuICAgICAgICAgICAgaWYoLS1uZXdJdGVyYWJsZXNJbmRleENvdW50W25ld0luZGV4W2luZGV4NF1dID09PSAwKSB7XG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtuZXdJbmRleFtpbmRleDRdICsgbjBdIHw9IG9uZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5ld0l0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2luZGV4NF0gPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHJlZmlsdGVyRnVuY3Rpb24pIHtcbiAgICAgICAgICBmb3IgKGluZGV4MiA9IDA7IGluZGV4MiA8IG4xOyArK2luZGV4Mikge1xuICAgICAgICAgICAgaWYgKCFyZWZpbHRlckZ1bmN0aW9uKG5ld1ZhbHVlc1tpbmRleDJdLCBpbmRleDIpKSB7XG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtuZXdJbmRleFtpbmRleDJdICsgbjBdIHw9IG9uZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm9yIChpbmRleDMgPSAwOyBpbmRleDMgPCBsbzE7ICsraW5kZXgzKSB7XG4gICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bbmV3SW5kZXhbaW5kZXgzXSArIG4wXSB8PSBvbmU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAoaW5kZXg0ID0gaGkxOyBpbmRleDQgPCBuMTsgKytpbmRleDQpIHtcbiAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtuZXdJbmRleFtpbmRleDRdICsgbjBdIHw9IG9uZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhpcyBkaW1lbnNpb24gcHJldmlvdXNseSBoYWQgbm8gZGF0YSwgdGhlbiB3ZSBkb24ndCBuZWVkIHRvIGRvIHRoZVxuICAgICAgLy8gbW9yZSBleHBlbnNpdmUgbWVyZ2Ugb3BlcmF0aW9uOyB1c2UgdGhlIG5ldyB2YWx1ZXMgYW5kIGluZGV4IGFzLWlzLlxuICAgICAgaWYgKCFuMCkge1xuICAgICAgICB2YWx1ZXMgPSBuZXdWYWx1ZXM7XG4gICAgICAgIGluZGV4ID0gbmV3SW5kZXg7XG4gICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnQgPSBuZXdJdGVyYWJsZXNJbmRleENvdW50O1xuICAgICAgICBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyA9IG5ld0l0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzO1xuICAgICAgICBsbzAgPSBsbzE7XG4gICAgICAgIGhpMCA9IGhpMTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG5cblxuICAgICAgdmFyIG9sZFZhbHVlcyA9IHZhbHVlcyxcbiAgICAgICAgb2xkSW5kZXggPSBpbmRleCxcbiAgICAgICAgb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXMgPSBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyxcbiAgICAgICAgb2xkX24wLFxuICAgICAgICBpMSA9IDA7XG5cbiAgICAgIGkwID0gMDtcblxuICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICBvbGRfbjAgPSBuMFxuICAgICAgICBuMCA9IG9sZFZhbHVlcy5sZW5ndGg7XG4gICAgICAgIG4xID0gdFxuICAgICAgfVxuXG4gICAgICAvLyBPdGhlcndpc2UsIGNyZWF0ZSBuZXcgYXJyYXlzIGludG8gd2hpY2ggdG8gbWVyZ2UgbmV3IGFuZCBvbGQuXG4gICAgICB2YWx1ZXMgPSBpdGVyYWJsZSA/IG5ldyBBcnJheShuMCArIG4xKSA6IG5ldyBBcnJheShuKTtcbiAgICAgIGluZGV4ID0gaXRlcmFibGUgPyBuZXcgQXJyYXkobjAgKyBuMSkgOiBjcl9pbmRleChuLCBuKTtcbiAgICAgIGlmKGl0ZXJhYmxlKSBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyA9IGNyX2luZGV4KG4wICsgbjEsIDEpO1xuXG4gICAgICAvLyBDb25jYXRlbmF0ZSB0aGUgbmV3SXRlcmFibGVzSW5kZXhDb3VudCBvbnRvIHRoZSBvbGQgb25lLlxuICAgICAgaWYoaXRlcmFibGUpIHtcbiAgICAgICAgdmFyIG9sZGlpY2xlbmd0aCA9IGl0ZXJhYmxlc0luZGV4Q291bnQubGVuZ3RoO1xuICAgICAgICBpdGVyYWJsZXNJbmRleENvdW50ID0geGZpbHRlckFycmF5LmFycmF5TGVuZ3RoZW4oaXRlcmFibGVzSW5kZXhDb3VudCwgbik7XG4gICAgICAgIGZvcih2YXIgaj0wOyBqK29sZGlpY2xlbmd0aCA8IG47IGorKykge1xuICAgICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnRbaitvbGRpaWNsZW5ndGhdID0gbmV3SXRlcmFibGVzSW5kZXhDb3VudFtqXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBNZXJnZSB0aGUgb2xkIGFuZCBuZXcgc29ydGVkIHZhbHVlcywgYW5kIG9sZCBhbmQgbmV3IGluZGV4LlxuICAgICAgdmFyIGluZGV4NSA9IDA7XG4gICAgICBmb3IgKDsgaTAgPCBuMCAmJiBpMSA8IG4xOyArK2luZGV4NSkge1xuICAgICAgICBpZiAob2xkVmFsdWVzW2kwXSA8IG5ld1ZhbHVlc1tpMV0pIHtcbiAgICAgICAgICB2YWx1ZXNbaW5kZXg1XSA9IG9sZFZhbHVlc1tpMF07XG4gICAgICAgICAgaWYoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2luZGV4NV0gPSBvbGRJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpMF07XG4gICAgICAgICAgaW5kZXhbaW5kZXg1XSA9IG9sZEluZGV4W2kwKytdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlc1tpbmRleDVdID0gbmV3VmFsdWVzW2kxXTtcbiAgICAgICAgICBpZihpdGVyYWJsZSkgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaW5kZXg1XSA9IG5ld0l0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2kxXTtcbiAgICAgICAgICBpbmRleFtpbmRleDVdID0gbmV3SW5kZXhbaTErK10gKyAoaXRlcmFibGUgPyBvbGRfbjAgOiBuMCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGFueSByZW1haW5pbmcgb2xkIHZhbHVlcy5cbiAgICAgIGZvciAoOyBpMCA8IG4wOyArK2kwLCArK2luZGV4NSkge1xuICAgICAgICB2YWx1ZXNbaW5kZXg1XSA9IG9sZFZhbHVlc1tpMF07XG4gICAgICAgIGlmKGl0ZXJhYmxlKSBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpbmRleDVdID0gb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaTBdO1xuICAgICAgICBpbmRleFtpbmRleDVdID0gb2xkSW5kZXhbaTBdO1xuICAgICAgfVxuXG4gICAgICAvLyBBZGQgYW55IHJlbWFpbmluZyBuZXcgdmFsdWVzLlxuICAgICAgZm9yICg7IGkxIDwgbjE7ICsraTEsICsraW5kZXg1KSB7XG4gICAgICAgIHZhbHVlc1tpbmRleDVdID0gbmV3VmFsdWVzW2kxXTtcbiAgICAgICAgaWYoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2luZGV4NV0gPSBuZXdJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpMV07XG4gICAgICAgIGluZGV4W2luZGV4NV0gPSBuZXdJbmRleFtpMV0gKyAoaXRlcmFibGUgPyBvbGRfbjAgOiBuMCk7XG4gICAgICB9XG5cbiAgICAgIC8vIEJpc2VjdCBhZ2FpbiB0byByZWNvbXB1dGUgbG8wIGFuZCBoaTAuXG4gICAgICBib3VuZHMgPSByZWZpbHRlcih2YWx1ZXMpLCBsbzAgPSBib3VuZHNbMF0sIGhpMCA9IGJvdW5kc1sxXTtcbiAgICB9XG5cbiAgICAvLyBXaGVuIGFsbCBmaWx0ZXJzIGhhdmUgdXBkYXRlZCwgbm90aWZ5IGluZGV4IGxpc3RlbmVycyBvZiB0aGUgbmV3IHZhbHVlcy5cbiAgICBmdW5jdGlvbiBwb3N0QWRkKG5ld0RhdGEsIG4wLCBuMSkge1xuICAgICAgaW5kZXhMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwobmV3VmFsdWVzLCBuZXdJbmRleCwgbjAsIG4xKTsgfSk7XG4gICAgICBuZXdWYWx1ZXMgPSBuZXdJbmRleCA9IG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVtb3ZlRGF0YShyZUluZGV4KSB7XG4gICAgICBpZiAoaXRlcmFibGUpIHtcbiAgICAgICAgZm9yICh2YXIgaTAgPSAwLCBpMSA9IDA7IGkwIDwgaXRlcmFibGVzRW1wdHlSb3dzLmxlbmd0aDsgaTArKykge1xuICAgICAgICAgIGlmIChyZUluZGV4W2l0ZXJhYmxlc0VtcHR5Um93c1tpMF1dICE9PSBSRU1PVkVEX0lOREVYKSB7XG4gICAgICAgICAgICBpdGVyYWJsZXNFbXB0eVJvd3NbaTFdID0gcmVJbmRleFtpdGVyYWJsZXNFbXB0eVJvd3NbaTBdXTtcbiAgICAgICAgICAgIGkxKys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGggPSBpMTtcbiAgICAgICAgZm9yIChpMCA9IDAsIGkxID0gMDsgaTAgPCBuOyBpMCsrKSB7XG4gICAgICAgICAgaWYgKHJlSW5kZXhbaTBdICE9PSBSRU1PVkVEX0lOREVYKSB7XG4gICAgICAgICAgICBpZiAoaTEgIT09IGkwKSBpdGVyYWJsZXNJbmRleENvdW50W2kxXSA9IGl0ZXJhYmxlc0luZGV4Q291bnRbaTBdO1xuICAgICAgICAgICAgaTErKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudCA9IGl0ZXJhYmxlc0luZGV4Q291bnQuc2xpY2UoMCwgaTEpO1xuICAgICAgfVxuICAgICAgLy8gUmV3cml0ZSBvdXIgaW5kZXgsIG92ZXJ3cml0aW5nIHJlbW92ZWQgdmFsdWVzXG4gICAgICB2YXIgbjAgPSB2YWx1ZXMubGVuZ3RoO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSAwLCBvbGREYXRhSW5kZXg7IGkgPCBuMDsgKytpKSB7XG4gICAgICAgIG9sZERhdGFJbmRleCA9IGluZGV4W2ldO1xuICAgICAgICBpZiAocmVJbmRleFtvbGREYXRhSW5kZXhdICE9PSBSRU1PVkVEX0lOREVYKSB7XG4gICAgICAgICAgaWYgKGkgIT09IGopIHZhbHVlc1tqXSA9IHZhbHVlc1tpXTtcbiAgICAgICAgICBpbmRleFtqXSA9IHJlSW5kZXhbb2xkRGF0YUluZGV4XTtcbiAgICAgICAgICBpZiAoaXRlcmFibGUpIHtcbiAgICAgICAgICAgIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2pdID0gaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaV07XG4gICAgICAgICAgfVxuICAgICAgICAgICsrajtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdmFsdWVzLmxlbmd0aCA9IGo7XG4gICAgICBpZiAoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzID0gaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXMuc2xpY2UoMCwgaik7XG4gICAgICB3aGlsZSAoaiA8IG4wKSBpbmRleFtqKytdID0gMDtcblxuICAgICAgLy8gQmlzZWN0IGFnYWluIHRvIHJlY29tcHV0ZSBsbzAgYW5kIGhpMC5cbiAgICAgIHZhciBib3VuZHMgPSByZWZpbHRlcih2YWx1ZXMpO1xuICAgICAgbG8wID0gYm91bmRzWzBdLCBoaTAgPSBib3VuZHNbMV07XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlcyB0aGUgc2VsZWN0ZWQgdmFsdWVzIGJhc2VkIG9uIHRoZSBzcGVjaWZpZWQgYm91bmRzIFtsbywgaGldLlxuICAgIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gaXMgdXNlZCBieSBhbGwgdGhlIHB1YmxpYyBmaWx0ZXIgbWV0aG9kcy5cbiAgICBmdW5jdGlvbiBmaWx0ZXJJbmRleEJvdW5kcyhib3VuZHMpIHtcblxuICAgICAgdmFyIGxvMSA9IGJvdW5kc1swXSxcbiAgICAgICAgICBoaTEgPSBib3VuZHNbMV07XG5cbiAgICAgIGlmIChyZWZpbHRlckZ1bmN0aW9uKSB7XG4gICAgICAgIHJlZmlsdGVyRnVuY3Rpb24gPSBudWxsO1xuICAgICAgICBmaWx0ZXJJbmRleEZ1bmN0aW9uKGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGxvMSA8PSBpICYmIGkgPCBoaTE7IH0sIGJvdW5kc1swXSA9PT0gMCAmJiBib3VuZHNbMV0gPT09IHZhbHVlcy5sZW5ndGgpO1xuICAgICAgICBsbzAgPSBsbzE7XG4gICAgICAgIGhpMCA9IGhpMTtcbiAgICAgICAgcmV0dXJuIGRpbWVuc2lvbjtcbiAgICAgIH1cblxuICAgICAgdmFyIGksXG4gICAgICAgICAgaixcbiAgICAgICAgICBrLFxuICAgICAgICAgIGFkZGVkID0gW10sXG4gICAgICAgICAgcmVtb3ZlZCA9IFtdLFxuICAgICAgICAgIHZhbHVlSW5kZXhBZGRlZCA9IFtdLFxuICAgICAgICAgIHZhbHVlSW5kZXhSZW1vdmVkID0gW107XG5cblxuICAgICAgLy8gRmFzdCBpbmNyZW1lbnRhbCB1cGRhdGUgYmFzZWQgb24gcHJldmlvdXMgbG8gaW5kZXguXG4gICAgICBpZiAobG8xIDwgbG8wKSB7XG4gICAgICAgIGZvciAoaSA9IGxvMSwgaiA9IE1hdGgubWluKGxvMCwgaGkxKTsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIGFkZGVkLnB1c2goaW5kZXhbaV0pO1xuICAgICAgICAgIHZhbHVlSW5kZXhBZGRlZC5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGxvMSA+IGxvMCkge1xuICAgICAgICBmb3IgKGkgPSBsbzAsIGogPSBNYXRoLm1pbihsbzEsIGhpMCk7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICByZW1vdmVkLnB1c2goaW5kZXhbaV0pO1xuICAgICAgICAgIHZhbHVlSW5kZXhSZW1vdmVkLnB1c2goaSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gRmFzdCBpbmNyZW1lbnRhbCB1cGRhdGUgYmFzZWQgb24gcHJldmlvdXMgaGkgaW5kZXguXG4gICAgICBpZiAoaGkxID4gaGkwKSB7XG4gICAgICAgIGZvciAoaSA9IE1hdGgubWF4KGxvMSwgaGkwKSwgaiA9IGhpMTsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIGFkZGVkLnB1c2goaW5kZXhbaV0pO1xuICAgICAgICAgIHZhbHVlSW5kZXhBZGRlZC5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGhpMSA8IGhpMCkge1xuICAgICAgICBmb3IgKGkgPSBNYXRoLm1heChsbzAsIGhpMSksIGogPSBoaTA7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICByZW1vdmVkLnB1c2goaW5kZXhbaV0pO1xuICAgICAgICAgIHZhbHVlSW5kZXhSZW1vdmVkLnB1c2goaSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoIWl0ZXJhYmxlKSB7XG4gICAgICAgIC8vIEZsaXAgZmlsdGVycyBub3JtYWxseS5cblxuICAgICAgICBmb3IoaT0wOyBpPGFkZGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW2FkZGVkW2ldXSBePSBvbmU7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoaT0wOyBpPHJlbW92ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bcmVtb3ZlZFtpXV0gXj0gb25lO1xuICAgICAgICB9XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZvciBpdGVyYWJsZXMsIHdlIG5lZWQgdG8gZmlndXJlIG91dCBpZiB0aGUgcm93IGhhcyBiZWVuIGNvbXBsZXRlbHkgcmVtb3ZlZCB2cyBwYXJ0aWFsbHkgaW5jbHVkZWRcbiAgICAgICAgLy8gT25seSBjb3VudCBhIHJvdyBhcyBhZGRlZCBpZiBpdCBpcyBub3QgYWxyZWFkeSBiZWluZyBhZ2dyZWdhdGVkLiBPbmx5IGNvdW50IGEgcm93XG4gICAgICAgIC8vIGFzIHJlbW92ZWQgaWYgdGhlIGxhc3QgZWxlbWVudCBiZWluZyBhZ2dyZWdhdGVkIGlzIHJlbW92ZWQuXG5cbiAgICAgICAgdmFyIG5ld0FkZGVkID0gW107XG4gICAgICAgIHZhciBuZXdSZW1vdmVkID0gW107XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBhZGRlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnRbYWRkZWRbaV1dKytcbiAgICAgICAgICBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1t2YWx1ZUluZGV4QWRkZWRbaV1dID0gMDtcbiAgICAgICAgICBpZihpdGVyYWJsZXNJbmRleENvdW50W2FkZGVkW2ldXSA9PT0gMSkge1xuICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW2FkZGVkW2ldXSBePSBvbmU7XG4gICAgICAgICAgICBuZXdBZGRlZC5wdXNoKGFkZGVkW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHJlbW92ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpdGVyYWJsZXNJbmRleENvdW50W3JlbW92ZWRbaV1dLS1cbiAgICAgICAgICBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1t2YWx1ZUluZGV4UmVtb3ZlZFtpXV0gPSAxO1xuICAgICAgICAgIGlmKGl0ZXJhYmxlc0luZGV4Q291bnRbcmVtb3ZlZFtpXV0gPT09IDApIHtcbiAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtyZW1vdmVkW2ldXSBePSBvbmU7XG4gICAgICAgICAgICBuZXdSZW1vdmVkLnB1c2gocmVtb3ZlZFtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYWRkZWQgPSBuZXdBZGRlZDtcbiAgICAgICAgcmVtb3ZlZCA9IG5ld1JlbW92ZWQ7XG5cbiAgICAgICAgLy8gTm93IGhhbmRsZSBlbXB0eSByb3dzLlxuICAgICAgICBpZihyZWZpbHRlciA9PT0geGZpbHRlckZpbHRlci5maWx0ZXJBbGwpIHtcbiAgICAgICAgICBmb3IoaSA9IDA7IGkgPCBpdGVyYWJsZXNFbXB0eVJvd3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmKChmaWx0ZXJzW29mZnNldF1bayA9IGl0ZXJhYmxlc0VtcHR5Um93c1tpXV0gJiBvbmUpKSB7XG4gICAgICAgICAgICAgIC8vIFdhcyBub3QgaW4gdGhlIGZpbHRlciwgc28gc2V0IHRoZSBmaWx0ZXIgYW5kIGFkZFxuICAgICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1ba10gXj0gb25lO1xuICAgICAgICAgICAgICBhZGRlZC5wdXNoKGspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBmaWx0ZXIgaW4gcGxhY2UgLSByZW1vdmUgZW1wdHkgcm93cyBpZiBuZWNlc3NhcnlcbiAgICAgICAgICBmb3IoaSA9IDA7IGkgPCBpdGVyYWJsZXNFbXB0eVJvd3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmKCEoZmlsdGVyc1tvZmZzZXRdW2sgPSBpdGVyYWJsZXNFbXB0eVJvd3NbaV1dICYgb25lKSkge1xuICAgICAgICAgICAgICAvLyBXYXMgaW4gdGhlIGZpbHRlciwgc28gc2V0IHRoZSBmaWx0ZXIgYW5kIHJlbW92ZVxuICAgICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1ba10gXj0gb25lO1xuICAgICAgICAgICAgICByZW1vdmVkLnB1c2goayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGxvMCA9IGxvMTtcbiAgICAgIGhpMCA9IGhpMTtcbiAgICAgIGZpbHRlckxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChvbmUsIG9mZnNldCwgYWRkZWQsIHJlbW92ZWQpOyB9KTtcbiAgICAgIHRyaWdnZXJPbkNoYW5nZSgnZmlsdGVyZWQnKTtcbiAgICAgIHJldHVybiBkaW1lbnNpb247XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB1c2luZyB0aGUgc3BlY2lmaWVkIHJhbmdlLCB2YWx1ZSwgb3IgbnVsbC5cbiAgICAvLyBJZiB0aGUgcmFuZ2UgaXMgbnVsbCwgdGhpcyBpcyBlcXVpdmFsZW50IHRvIGZpbHRlckFsbC5cbiAgICAvLyBJZiB0aGUgcmFuZ2UgaXMgYW4gYXJyYXksIHRoaXMgaXMgZXF1aXZhbGVudCB0byBmaWx0ZXJSYW5nZS5cbiAgICAvLyBPdGhlcndpc2UsIHRoaXMgaXMgZXF1aXZhbGVudCB0byBmaWx0ZXJFeGFjdC5cbiAgICBmdW5jdGlvbiBmaWx0ZXIocmFuZ2UpIHtcbiAgICAgIHJldHVybiByYW5nZSA9PSBudWxsXG4gICAgICAgICAgPyBmaWx0ZXJBbGwoKSA6IEFycmF5LmlzQXJyYXkocmFuZ2UpXG4gICAgICAgICAgPyBmaWx0ZXJSYW5nZShyYW5nZSkgOiB0eXBlb2YgcmFuZ2UgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICAgID8gZmlsdGVyRnVuY3Rpb24ocmFuZ2UpXG4gICAgICAgICAgOiBmaWx0ZXJFeGFjdChyYW5nZSk7XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB0byBzZWxlY3QgdGhlIGV4YWN0IHZhbHVlLlxuICAgIGZ1bmN0aW9uIGZpbHRlckV4YWN0KHZhbHVlKSB7XG4gICAgICBmaWx0ZXJWYWx1ZSA9IHZhbHVlO1xuICAgICAgZmlsdGVyVmFsdWVQcmVzZW50ID0gdHJ1ZTtcbiAgICAgIHJldHVybiBmaWx0ZXJJbmRleEJvdW5kcygocmVmaWx0ZXIgPSB4ZmlsdGVyRmlsdGVyLmZpbHRlckV4YWN0KGJpc2VjdCwgdmFsdWUpKSh2YWx1ZXMpKTtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHRvIHNlbGVjdCB0aGUgc3BlY2lmaWVkIHJhbmdlIFtsbywgaGldLlxuICAgIC8vIFRoZSBsb3dlciBib3VuZCBpcyBpbmNsdXNpdmUsIGFuZCB0aGUgdXBwZXIgYm91bmQgaXMgZXhjbHVzaXZlLlxuICAgIGZ1bmN0aW9uIGZpbHRlclJhbmdlKHJhbmdlKSB7XG4gICAgICBmaWx0ZXJWYWx1ZSA9IHJhbmdlO1xuICAgICAgZmlsdGVyVmFsdWVQcmVzZW50ID0gdHJ1ZTtcbiAgICAgIHJldHVybiBmaWx0ZXJJbmRleEJvdW5kcygocmVmaWx0ZXIgPSB4ZmlsdGVyRmlsdGVyLmZpbHRlclJhbmdlKGJpc2VjdCwgcmFuZ2UpKSh2YWx1ZXMpKTtcbiAgICB9XG5cbiAgICAvLyBDbGVhcnMgYW55IGZpbHRlcnMgb24gdGhpcyBkaW1lbnNpb24uXG4gICAgZnVuY3Rpb24gZmlsdGVyQWxsKCkge1xuICAgICAgZmlsdGVyVmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICBmaWx0ZXJWYWx1ZVByZXNlbnQgPSBmYWxzZTtcbiAgICAgIHJldHVybiBmaWx0ZXJJbmRleEJvdW5kcygocmVmaWx0ZXIgPSB4ZmlsdGVyRmlsdGVyLmZpbHRlckFsbCkodmFsdWVzKSk7XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB1c2luZyBhbiBhcmJpdHJhcnkgZnVuY3Rpb24uXG4gICAgZnVuY3Rpb24gZmlsdGVyRnVuY3Rpb24oZikge1xuICAgICAgZmlsdGVyVmFsdWUgPSBmO1xuICAgICAgZmlsdGVyVmFsdWVQcmVzZW50ID0gdHJ1ZTtcblxuICAgICAgcmVmaWx0ZXJGdW5jdGlvbiA9IGY7XG4gICAgICByZWZpbHRlciA9IHhmaWx0ZXJGaWx0ZXIuZmlsdGVyQWxsO1xuXG4gICAgICBmaWx0ZXJJbmRleEZ1bmN0aW9uKGYsIGZhbHNlKTtcblxuICAgICAgdmFyIGJvdW5kcyA9IHJlZmlsdGVyKHZhbHVlcyk7XG4gICAgICBsbzAgPSBib3VuZHNbMF0sIGhpMCA9IGJvdW5kc1sxXTtcblxuICAgICAgcmV0dXJuIGRpbWVuc2lvbjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaWx0ZXJJbmRleEZ1bmN0aW9uKGYsIGZpbHRlckFsbCkge1xuICAgICAgdmFyIGksXG4gICAgICAgICAgayxcbiAgICAgICAgICB4LFxuICAgICAgICAgIGFkZGVkID0gW10sXG4gICAgICAgICAgcmVtb3ZlZCA9IFtdLFxuICAgICAgICAgIHZhbHVlSW5kZXhBZGRlZCA9IFtdLFxuICAgICAgICAgIHZhbHVlSW5kZXhSZW1vdmVkID0gW10sXG4gICAgICAgICAgaW5kZXhMZW5ndGggPSB2YWx1ZXMubGVuZ3RoO1xuXG4gICAgICBpZighaXRlcmFibGUpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGluZGV4TGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBpZiAoIShmaWx0ZXJzW29mZnNldF1bayA9IGluZGV4W2ldXSAmIG9uZSkgXiAhISh4ID0gZih2YWx1ZXNbaV0sIGkpKSkge1xuICAgICAgICAgICAgaWYgKHgpIGFkZGVkLnB1c2goayk7XG4gICAgICAgICAgICBlbHNlIHJlbW92ZWQucHVzaChrKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoaXRlcmFibGUpIHtcbiAgICAgICAgZm9yKGk9MDsgaSA8IGluZGV4TGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBpZihmKHZhbHVlc1tpXSwgaSkpIHtcbiAgICAgICAgICAgIGFkZGVkLnB1c2goaW5kZXhbaV0pO1xuICAgICAgICAgICAgdmFsdWVJbmRleEFkZGVkLnB1c2goaSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlbW92ZWQucHVzaChpbmRleFtpXSk7XG4gICAgICAgICAgICB2YWx1ZUluZGV4UmVtb3ZlZC5wdXNoKGkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZighaXRlcmFibGUpIHtcbiAgICAgICAgZm9yKGk9MDsgaTxhZGRlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmKGZpbHRlcnNbb2Zmc2V0XVthZGRlZFtpXV0gJiBvbmUpIGZpbHRlcnNbb2Zmc2V0XVthZGRlZFtpXV0gJj0gemVybztcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihpPTA7IGk8cmVtb3ZlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmKCEoZmlsdGVyc1tvZmZzZXRdW3JlbW92ZWRbaV1dICYgb25lKSkgZmlsdGVyc1tvZmZzZXRdW3JlbW92ZWRbaV1dIHw9IG9uZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICB2YXIgbmV3QWRkZWQgPSBbXTtcbiAgICAgICAgdmFyIG5ld1JlbW92ZWQgPSBbXTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGFkZGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgLy8gRmlyc3QgY2hlY2sgdGhpcyBwYXJ0aWN1bGFyIHZhbHVlIG5lZWRzIHRvIGJlIGFkZGVkXG4gICAgICAgICAgaWYoaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbdmFsdWVJbmRleEFkZGVkW2ldXSA9PT0gMSkge1xuICAgICAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudFthZGRlZFtpXV0rK1xuICAgICAgICAgICAgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbdmFsdWVJbmRleEFkZGVkW2ldXSA9IDA7XG4gICAgICAgICAgICBpZihpdGVyYWJsZXNJbmRleENvdW50W2FkZGVkW2ldXSA9PT0gMSkge1xuICAgICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bYWRkZWRbaV1dIF49IG9uZTtcbiAgICAgICAgICAgICAgbmV3QWRkZWQucHVzaChhZGRlZFtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCByZW1vdmVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgLy8gRmlyc3QgY2hlY2sgdGhpcyBwYXJ0aWN1bGFyIHZhbHVlIG5lZWRzIHRvIGJlIHJlbW92ZWRcbiAgICAgICAgICBpZihpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1t2YWx1ZUluZGV4UmVtb3ZlZFtpXV0gPT09IDApIHtcbiAgICAgICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnRbcmVtb3ZlZFtpXV0tLVxuICAgICAgICAgICAgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbdmFsdWVJbmRleFJlbW92ZWRbaV1dID0gMTtcbiAgICAgICAgICAgIGlmKGl0ZXJhYmxlc0luZGV4Q291bnRbcmVtb3ZlZFtpXV0gPT09IDApIHtcbiAgICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW3JlbW92ZWRbaV1dIF49IG9uZTtcbiAgICAgICAgICAgICAgbmV3UmVtb3ZlZC5wdXNoKHJlbW92ZWRbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGFkZGVkID0gbmV3QWRkZWQ7XG4gICAgICAgIHJlbW92ZWQgPSBuZXdSZW1vdmVkO1xuXG4gICAgICAgIC8vIE5vdyBoYW5kbGUgZW1wdHkgcm93cy5cbiAgICAgICAgaWYoZmlsdGVyQWxsKSB7XG4gICAgICAgICAgZm9yKGkgPSAwOyBpIDwgaXRlcmFibGVzRW1wdHlSb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZigoZmlsdGVyc1tvZmZzZXRdW2sgPSBpdGVyYWJsZXNFbXB0eVJvd3NbaV1dICYgb25lKSkge1xuICAgICAgICAgICAgICAvLyBXYXMgbm90IGluIHRoZSBmaWx0ZXIsIHNvIHNldCB0aGUgZmlsdGVyIGFuZCBhZGRcbiAgICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW2tdIF49IG9uZTtcbiAgICAgICAgICAgICAgYWRkZWQucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gZmlsdGVyIGluIHBsYWNlIC0gcmVtb3ZlIGVtcHR5IHJvd3MgaWYgbmVjZXNzYXJ5XG4gICAgICAgICAgZm9yKGkgPSAwOyBpIDwgaXRlcmFibGVzRW1wdHlSb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZighKGZpbHRlcnNbb2Zmc2V0XVtrID0gaXRlcmFibGVzRW1wdHlSb3dzW2ldXSAmIG9uZSkpIHtcbiAgICAgICAgICAgICAgLy8gV2FzIGluIHRoZSBmaWx0ZXIsIHNvIHNldCB0aGUgZmlsdGVyIGFuZCByZW1vdmVcbiAgICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW2tdIF49IG9uZTtcbiAgICAgICAgICAgICAgcmVtb3ZlZC5wdXNoKGspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmaWx0ZXJMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwob25lLCBvZmZzZXQsIGFkZGVkLCByZW1vdmVkKTsgfSk7XG4gICAgICB0cmlnZ2VyT25DaGFuZ2UoJ2ZpbHRlcmVkJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3VycmVudEZpbHRlcigpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJWYWx1ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYXNDdXJyZW50RmlsdGVyKCkge1xuICAgICAgcmV0dXJuIGZpbHRlclZhbHVlUHJlc2VudDtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSB0b3AgSyBzZWxlY3RlZCByZWNvcmRzIGJhc2VkIG9uIHRoaXMgZGltZW5zaW9uJ3Mgb3JkZXIuXG4gICAgLy8gTm90ZTogb2JzZXJ2ZXMgdGhpcyBkaW1lbnNpb24ncyBmaWx0ZXIsIHVubGlrZSBncm91cCBhbmQgZ3JvdXBBbGwuXG4gICAgZnVuY3Rpb24gdG9wKGssIHRvcF9vZmZzZXQpIHtcbiAgICAgIHZhciBhcnJheSA9IFtdLFxuICAgICAgICAgIGkgPSBoaTAsXG4gICAgICAgICAgaixcbiAgICAgICAgICB0b1NraXAgPSAwO1xuXG4gICAgICBpZih0b3Bfb2Zmc2V0ICYmIHRvcF9vZmZzZXQgPiAwKSB0b1NraXAgPSB0b3Bfb2Zmc2V0O1xuXG4gICAgICB3aGlsZSAoLS1pID49IGxvMCAmJiBrID4gMCkge1xuICAgICAgICBpZiAoZmlsdGVycy56ZXJvKGogPSBpbmRleFtpXSkpIHtcbiAgICAgICAgICBpZih0b1NraXAgPiAwKSB7XG4gICAgICAgICAgICAvL3NraXAgbWF0Y2hpbmcgcm93XG4gICAgICAgICAgICAtLXRvU2tpcDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXJyYXkucHVzaChkYXRhW2pdKTtcbiAgICAgICAgICAgIC0taztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICBmb3IoaSA9IDA7IGkgPCBpdGVyYWJsZXNFbXB0eVJvd3MubGVuZ3RoICYmIGsgPiAwOyBpKyspIHtcbiAgICAgICAgICAvLyBBZGQgcm93IHdpdGggZW1wdHkgaXRlcmFibGUgY29sdW1uIGF0IHRoZSBlbmRcbiAgICAgICAgICBpZihmaWx0ZXJzLnplcm8oaiA9IGl0ZXJhYmxlc0VtcHR5Um93c1tpXSkpIHtcbiAgICAgICAgICAgIGlmKHRvU2tpcCA+IDApIHtcbiAgICAgICAgICAgICAgLy9za2lwIG1hdGNoaW5nIHJvd1xuICAgICAgICAgICAgICAtLXRvU2tpcDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGFycmF5LnB1c2goZGF0YVtqXSk7XG4gICAgICAgICAgICAgIC0taztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cblxuICAgIC8vIFJldHVybnMgdGhlIGJvdHRvbSBLIHNlbGVjdGVkIHJlY29yZHMgYmFzZWQgb24gdGhpcyBkaW1lbnNpb24ncyBvcmRlci5cbiAgICAvLyBOb3RlOiBvYnNlcnZlcyB0aGlzIGRpbWVuc2lvbidzIGZpbHRlciwgdW5saWtlIGdyb3VwIGFuZCBncm91cEFsbC5cbiAgICBmdW5jdGlvbiBib3R0b20oaywgYm90dG9tX29mZnNldCkge1xuICAgICAgdmFyIGFycmF5ID0gW10sXG4gICAgICAgICAgaSxcbiAgICAgICAgICBqLFxuICAgICAgICAgIHRvU2tpcCA9IDA7XG5cbiAgICAgIGlmKGJvdHRvbV9vZmZzZXQgJiYgYm90dG9tX29mZnNldCA+IDApIHRvU2tpcCA9IGJvdHRvbV9vZmZzZXQ7XG5cbiAgICAgIGlmKGl0ZXJhYmxlKSB7XG4gICAgICAgIC8vIEFkZCByb3cgd2l0aCBlbXB0eSBpdGVyYWJsZSBjb2x1bW4gYXQgdGhlIHRvcFxuICAgICAgICBmb3IoaSA9IDA7IGkgPCBpdGVyYWJsZXNFbXB0eVJvd3MubGVuZ3RoICYmIGsgPiAwOyBpKyspIHtcbiAgICAgICAgICBpZihmaWx0ZXJzLnplcm8oaiA9IGl0ZXJhYmxlc0VtcHR5Um93c1tpXSkpIHtcbiAgICAgICAgICAgIGlmKHRvU2tpcCA+IDApIHtcbiAgICAgICAgICAgICAgLy9za2lwIG1hdGNoaW5nIHJvd1xuICAgICAgICAgICAgICAtLXRvU2tpcDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGFycmF5LnB1c2goZGF0YVtqXSk7XG4gICAgICAgICAgICAgIC0taztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaSA9IGxvMDtcblxuICAgICAgd2hpbGUgKGkgPCBoaTAgJiYgayA+IDApIHtcbiAgICAgICAgaWYgKGZpbHRlcnMuemVybyhqID0gaW5kZXhbaV0pKSB7XG4gICAgICAgICAgaWYodG9Ta2lwID4gMCkge1xuICAgICAgICAgICAgLy9za2lwIG1hdGNoaW5nIHJvd1xuICAgICAgICAgICAgLS10b1NraXA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFycmF5LnB1c2goZGF0YVtqXSk7XG4gICAgICAgICAgICAtLWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cblxuICAgIC8vIEFkZHMgYSBuZXcgZ3JvdXAgdG8gdGhpcyBkaW1lbnNpb24sIHVzaW5nIHRoZSBzcGVjaWZpZWQga2V5IGZ1bmN0aW9uLlxuICAgIGZ1bmN0aW9uIGdyb3VwKGtleSkge1xuICAgICAgdmFyIGdyb3VwID0ge1xuICAgICAgICB0b3A6IHRvcCxcbiAgICAgICAgYWxsOiBhbGwsXG4gICAgICAgIHJlZHVjZTogcmVkdWNlLFxuICAgICAgICByZWR1Y2VDb3VudDogcmVkdWNlQ291bnQsXG4gICAgICAgIHJlZHVjZVN1bTogcmVkdWNlU3VtLFxuICAgICAgICBvcmRlcjogb3JkZXIsXG4gICAgICAgIG9yZGVyTmF0dXJhbDogb3JkZXJOYXR1cmFsLFxuICAgICAgICBzaXplOiBzaXplLFxuICAgICAgICBkaXNwb3NlOiBkaXNwb3NlLFxuICAgICAgICByZW1vdmU6IGRpc3Bvc2UgLy8gZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5XG4gICAgICB9O1xuXG4gICAgICAvLyBFbnN1cmUgdGhhdCB0aGlzIGdyb3VwIHdpbGwgYmUgcmVtb3ZlZCB3aGVuIHRoZSBkaW1lbnNpb24gaXMgcmVtb3ZlZC5cbiAgICAgIGRpbWVuc2lvbkdyb3Vwcy5wdXNoKGdyb3VwKTtcblxuICAgICAgdmFyIGdyb3VwcywgLy8gYXJyYXkgb2Yge2tleSwgdmFsdWV9XG4gICAgICAgICAgZ3JvdXBJbmRleCwgLy8gb2JqZWN0IGlkIOKGpiBncm91cCBpZFxuICAgICAgICAgIGdyb3VwV2lkdGggPSA4LFxuICAgICAgICAgIGdyb3VwQ2FwYWNpdHkgPSBjYXBhY2l0eShncm91cFdpZHRoKSxcbiAgICAgICAgICBrID0gMCwgLy8gY2FyZGluYWxpdHlcbiAgICAgICAgICBzZWxlY3QsXG4gICAgICAgICAgaGVhcCxcbiAgICAgICAgICByZWR1Y2VBZGQsXG4gICAgICAgICAgcmVkdWNlUmVtb3ZlLFxuICAgICAgICAgIHJlZHVjZUluaXRpYWwsXG4gICAgICAgICAgdXBkYXRlID0gY3JfbnVsbCxcbiAgICAgICAgICByZXNldCA9IGNyX251bGwsXG4gICAgICAgICAgcmVzZXROZWVkZWQgPSB0cnVlLFxuICAgICAgICAgIGdyb3VwQWxsID0ga2V5ID09PSBjcl9udWxsLFxuICAgICAgICAgIG4wb2xkO1xuXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDEpIGtleSA9IGNyX2lkZW50aXR5O1xuXG4gICAgICAvLyBUaGUgZ3JvdXAgbGlzdGVucyB0byB0aGUgY3Jvc3NmaWx0ZXIgZm9yIHdoZW4gYW55IGRpbWVuc2lvbiBjaGFuZ2VzLCBzb1xuICAgICAgLy8gdGhhdCBpdCBjYW4gdXBkYXRlIHRoZSBhc3NvY2lhdGVkIHJlZHVjZSB2YWx1ZXMuIEl0IG11c3QgYWxzbyBsaXN0ZW4gdG9cbiAgICAgIC8vIHRoZSBwYXJlbnQgZGltZW5zaW9uIGZvciB3aGVuIGRhdGEgaXMgYWRkZWQsIGFuZCBjb21wdXRlIG5ldyBrZXlzLlxuICAgICAgZmlsdGVyTGlzdGVuZXJzLnB1c2godXBkYXRlKTtcbiAgICAgIGluZGV4TGlzdGVuZXJzLnB1c2goYWRkKTtcbiAgICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMucHVzaChyZW1vdmVEYXRhKTtcblxuICAgICAgLy8gSW5jb3Jwb3JhdGUgYW55IGV4aXN0aW5nIGRhdGEgaW50byB0aGUgZ3JvdXBpbmcuXG4gICAgICBhZGQodmFsdWVzLCBpbmRleCwgMCwgbik7XG5cbiAgICAgIC8vIEluY29ycG9yYXRlcyB0aGUgc3BlY2lmaWVkIG5ldyB2YWx1ZXMgaW50byB0aGlzIGdyb3VwLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyByZXNwb25zaWJsZSBmb3IgdXBkYXRpbmcgZ3JvdXBzIGFuZCBncm91cEluZGV4LlxuICAgICAgZnVuY3Rpb24gYWRkKG5ld1ZhbHVlcywgbmV3SW5kZXgsIG4wLCBuMSkge1xuXG4gICAgICAgIGlmKGl0ZXJhYmxlKSB7XG4gICAgICAgICAgbjBvbGQgPSBuMFxuICAgICAgICAgIG4wID0gdmFsdWVzLmxlbmd0aCAtIG5ld1ZhbHVlcy5sZW5ndGhcbiAgICAgICAgICBuMSA9IG5ld1ZhbHVlcy5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgb2xkR3JvdXBzID0gZ3JvdXBzLFxuICAgICAgICAgICAgcmVJbmRleCA9IGl0ZXJhYmxlID8gW10gOiBjcl9pbmRleChrLCBncm91cENhcGFjaXR5KSxcbiAgICAgICAgICAgIGFkZCA9IHJlZHVjZUFkZCxcbiAgICAgICAgICAgIHJlbW92ZSA9IHJlZHVjZVJlbW92ZSxcbiAgICAgICAgICAgIGluaXRpYWwgPSByZWR1Y2VJbml0aWFsLFxuICAgICAgICAgICAgazAgPSBrLCAvLyBvbGQgY2FyZGluYWxpdHlcbiAgICAgICAgICAgIGkwID0gMCwgLy8gaW5kZXggb2Ygb2xkIGdyb3VwXG4gICAgICAgICAgICBpMSA9IDAsIC8vIGluZGV4IG9mIG5ldyByZWNvcmRcbiAgICAgICAgICAgIGosIC8vIG9iamVjdCBpZFxuICAgICAgICAgICAgZzAsIC8vIG9sZCBncm91cFxuICAgICAgICAgICAgeDAsIC8vIG9sZCBrZXlcbiAgICAgICAgICAgIHgxLCAvLyBuZXcga2V5XG4gICAgICAgICAgICBnLCAvLyBncm91cCB0byBhZGRcbiAgICAgICAgICAgIHg7IC8vIGtleSBvZiBncm91cCB0byBhZGRcblxuICAgICAgICAvLyBJZiBhIHJlc2V0IGlzIG5lZWRlZCwgd2UgZG9uJ3QgbmVlZCB0byB1cGRhdGUgdGhlIHJlZHVjZSB2YWx1ZXMuXG4gICAgICAgIGlmIChyZXNldE5lZWRlZCkgYWRkID0gaW5pdGlhbCA9IGNyX251bGw7XG4gICAgICAgIGlmIChyZXNldE5lZWRlZCkgcmVtb3ZlID0gaW5pdGlhbCA9IGNyX251bGw7XG5cbiAgICAgICAgLy8gUmVzZXQgdGhlIG5ldyBncm91cHMgKGsgaXMgYSBsb3dlciBib3VuZCkuXG4gICAgICAgIC8vIEFsc28sIG1ha2Ugc3VyZSB0aGF0IGdyb3VwSW5kZXggZXhpc3RzIGFuZCBpcyBsb25nIGVub3VnaC5cbiAgICAgICAgZ3JvdXBzID0gbmV3IEFycmF5KGspLCBrID0gMDtcbiAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgIGdyb3VwSW5kZXggPSBrMCA/IGdyb3VwSW5kZXggOiBbXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgIGdyb3VwSW5kZXggPSBrMCA+IDEgPyB4ZmlsdGVyQXJyYXkuYXJyYXlMZW5ndGhlbihncm91cEluZGV4LCBuKSA6IGNyX2luZGV4KG4sIGdyb3VwQ2FwYWNpdHkpO1xuICAgICAgICB9XG5cblxuICAgICAgICAvLyBHZXQgdGhlIGZpcnN0IG9sZCBrZXkgKHgwIG9mIGcwKSwgaWYgaXQgZXhpc3RzLlxuICAgICAgICBpZiAoazApIHgwID0gKGcwID0gb2xkR3JvdXBzWzBdKS5rZXk7XG5cbiAgICAgICAgLy8gRmluZCB0aGUgZmlyc3QgbmV3IGtleSAoeDEpLCBza2lwcGluZyBOYU4ga2V5cy5cbiAgICAgICAgd2hpbGUgKGkxIDwgbjEgJiYgISgoeDEgPSBrZXkobmV3VmFsdWVzW2kxXSkpID49IHgxKSkgKytpMTtcblxuICAgICAgICAvLyBXaGlsZSBuZXcga2V5cyByZW1haW7igKZcbiAgICAgICAgd2hpbGUgKGkxIDwgbjEpIHtcblxuICAgICAgICAgIC8vIERldGVybWluZSB0aGUgbGVzc2VyIG9mIHRoZSB0d28gY3VycmVudCBrZXlzOyBuZXcgYW5kIG9sZC5cbiAgICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gb2xkIGtleXMgcmVtYWluaW5nLCB0aGVuIGFsd2F5cyBhZGQgdGhlIG5ldyBrZXkuXG4gICAgICAgICAgaWYgKGcwICYmIHgwIDw9IHgxKSB7XG4gICAgICAgICAgICBnID0gZzAsIHggPSB4MDtcblxuICAgICAgICAgICAgLy8gUmVjb3JkIHRoZSBuZXcgaW5kZXggb2YgdGhlIG9sZCBncm91cC5cbiAgICAgICAgICAgIHJlSW5kZXhbaTBdID0gaztcblxuICAgICAgICAgICAgLy8gUmV0cmlldmUgdGhlIG5leHQgb2xkIGtleS5cbiAgICAgICAgICAgIGcwID0gb2xkR3JvdXBzWysraTBdO1xuICAgICAgICAgICAgaWYgKGcwKSB4MCA9IGcwLmtleTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZyA9IHtrZXk6IHgxLCB2YWx1ZTogaW5pdGlhbCgpfSwgeCA9IHgxO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEFkZCB0aGUgbGVzc2VyIGdyb3VwLlxuICAgICAgICAgIGdyb3Vwc1trXSA9IGc7XG5cbiAgICAgICAgICAvLyBBZGQgYW55IHNlbGVjdGVkIHJlY29yZHMgYmVsb25naW5nIHRvIHRoZSBhZGRlZCBncm91cCwgd2hpbGVcbiAgICAgICAgICAvLyBhZHZhbmNpbmcgdGhlIG5ldyBrZXkgYW5kIHBvcHVsYXRpbmcgdGhlIGFzc29jaWF0ZWQgZ3JvdXAgaW5kZXguXG5cbiAgICAgICAgICB3aGlsZSAoeDEgPD0geCkge1xuICAgICAgICAgICAgaiA9IG5ld0luZGV4W2kxXSArIChpdGVyYWJsZSA/IG4wb2xkIDogbjApXG5cblxuICAgICAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgICAgICBpZihncm91cEluZGV4W2pdKXtcbiAgICAgICAgICAgICAgICBncm91cEluZGV4W2pdLnB1c2goaylcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgIGdyb3VwSW5kZXhbal0gPSBba11cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgZ3JvdXBJbmRleFtqXSA9IGs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEFsd2F5cyBhZGQgbmV3IHZhbHVlcyB0byBncm91cHMuIE9ubHkgcmVtb3ZlIHdoZW4gbm90IGluIGZpbHRlci5cbiAgICAgICAgICAgIC8vIFRoaXMgZ2l2ZXMgZ3JvdXBzIGZ1bGwgaW5mb3JtYXRpb24gb24gZGF0YSBsaWZlLWN5Y2xlLlxuICAgICAgICAgICAgZy52YWx1ZSA9IGFkZChnLnZhbHVlLCBkYXRhW2pdLCB0cnVlKTtcbiAgICAgICAgICAgIGlmICghZmlsdGVycy56ZXJvRXhjZXB0KGosIG9mZnNldCwgemVybykpIGcudmFsdWUgPSByZW1vdmUoZy52YWx1ZSwgZGF0YVtqXSwgZmFsc2UpO1xuICAgICAgICAgICAgaWYgKCsraTEgPj0gbjEpIGJyZWFrO1xuICAgICAgICAgICAgeDEgPSBrZXkobmV3VmFsdWVzW2kxXSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZ3JvdXBJbmNyZW1lbnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBhbnkgcmVtYWluaW5nIG9sZCBncm91cHMgdGhhdCB3ZXJlIGdyZWF0ZXIgdGgxYW4gYWxsIG5ldyBrZXlzLlxuICAgICAgICAvLyBObyBpbmNyZW1lbnRhbCByZWR1Y2UgaXMgbmVlZGVkOyB0aGVzZSBncm91cHMgaGF2ZSBubyBuZXcgcmVjb3Jkcy5cbiAgICAgICAgLy8gQWxzbyByZWNvcmQgdGhlIG5ldyBpbmRleCBvZiB0aGUgb2xkIGdyb3VwLlxuICAgICAgICB3aGlsZSAoaTAgPCBrMCkge1xuICAgICAgICAgIGdyb3Vwc1tyZUluZGV4W2kwXSA9IGtdID0gb2xkR3JvdXBzW2kwKytdO1xuICAgICAgICAgIGdyb3VwSW5jcmVtZW50KCk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8vIEZpbGwgaW4gZ2FwcyB3aXRoIGVtcHR5IGFycmF5cyB3aGVyZSB0aGVyZSBtYXkgaGF2ZSBiZWVuIHJvd3Mgd2l0aCBlbXB0eSBpdGVyYWJsZXNcbiAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgIGZvciAodmFyIGluZGV4MSA9IDA7IGluZGV4MSA8IG47IGluZGV4MSsrKSB7XG4gICAgICAgICAgICBpZighZ3JvdXBJbmRleFtpbmRleDFdKXtcbiAgICAgICAgICAgICAgZ3JvdXBJbmRleFtpbmRleDFdID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgd2UgYWRkZWQgYW55IG5ldyBncm91cHMgYmVmb3JlIGFueSBvbGQgZ3JvdXBzLFxuICAgICAgICAvLyB1cGRhdGUgdGhlIGdyb3VwIGluZGV4IG9mIGFsbCB0aGUgb2xkIHJlY29yZHMuXG4gICAgICAgIGlmKGsgPiBpMCl7XG4gICAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgICAgZm9yIChpMCA9IDA7IGkwIDwgbjBvbGQ7ICsraTApIHtcbiAgICAgICAgICAgICAgZm9yIChpbmRleDEgPSAwOyBpbmRleDEgPCBncm91cEluZGV4W2kwXS5sZW5ndGg7IGluZGV4MSsrKSB7XG4gICAgICAgICAgICAgICAgZ3JvdXBJbmRleFtpMF1baW5kZXgxXSA9IHJlSW5kZXhbZ3JvdXBJbmRleFtpMF1baW5kZXgxXV07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgIGZvciAoaTAgPSAwOyBpMCA8IG4wOyArK2kwKSB7XG4gICAgICAgICAgICAgIGdyb3VwSW5kZXhbaTBdID0gcmVJbmRleFtncm91cEluZGV4W2kwXV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTW9kaWZ5IHRoZSB1cGRhdGUgYW5kIHJlc2V0IGJlaGF2aW9yIGJhc2VkIG9uIHRoZSBjYXJkaW5hbGl0eS5cbiAgICAgICAgLy8gSWYgdGhlIGNhcmRpbmFsaXR5IGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byBvbmUsIHRoZW4gdGhlIGdyb3VwSW5kZXhcbiAgICAgICAgLy8gaXMgbm90IG5lZWRlZC4gSWYgdGhlIGNhcmRpbmFsaXR5IGlzIHplcm8sIHRoZW4gdGhlcmUgYXJlIG5vIHJlY29yZHNcbiAgICAgICAgLy8gYW5kIHRoZXJlZm9yZSBubyBncm91cHMgdG8gdXBkYXRlIG9yIHJlc2V0LiBOb3RlIHRoYXQgd2UgYWxzbyBtdXN0XG4gICAgICAgIC8vIGNoYW5nZSB0aGUgcmVnaXN0ZXJlZCBsaXN0ZW5lciB0byBwb2ludCB0byB0aGUgbmV3IG1ldGhvZC5cbiAgICAgICAgaiA9IGZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSk7XG4gICAgICAgIGlmIChrID4gMSB8fCBpdGVyYWJsZSkge1xuICAgICAgICAgIHVwZGF0ZSA9IHVwZGF0ZU1hbnk7XG4gICAgICAgICAgcmVzZXQgPSByZXNldE1hbnk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKCFrICYmIGdyb3VwQWxsKSB7XG4gICAgICAgICAgICBrID0gMTtcbiAgICAgICAgICAgIGdyb3VwcyA9IFt7a2V5OiBudWxsLCB2YWx1ZTogaW5pdGlhbCgpfV07XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChrID09PSAxKSB7XG4gICAgICAgICAgICB1cGRhdGUgPSB1cGRhdGVPbmU7XG4gICAgICAgICAgICByZXNldCA9IHJlc2V0T25lO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1cGRhdGUgPSBjcl9udWxsO1xuICAgICAgICAgICAgcmVzZXQgPSBjcl9udWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICBncm91cEluZGV4ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBmaWx0ZXJMaXN0ZW5lcnNbal0gPSB1cGRhdGU7XG5cbiAgICAgICAgLy8gQ291bnQgdGhlIG51bWJlciBvZiBhZGRlZCBncm91cHMsXG4gICAgICAgIC8vIGFuZCB3aWRlbiB0aGUgZ3JvdXAgaW5kZXggYXMgbmVlZGVkLlxuICAgICAgICBmdW5jdGlvbiBncm91cEluY3JlbWVudCgpIHtcbiAgICAgICAgICBpZihpdGVyYWJsZSl7XG4gICAgICAgICAgICBrKytcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoKytrID09PSBncm91cENhcGFjaXR5KSB7XG4gICAgICAgICAgICByZUluZGV4ID0geGZpbHRlckFycmF5LmFycmF5V2lkZW4ocmVJbmRleCwgZ3JvdXBXaWR0aCA8PD0gMSk7XG4gICAgICAgICAgICBncm91cEluZGV4ID0geGZpbHRlckFycmF5LmFycmF5V2lkZW4oZ3JvdXBJbmRleCwgZ3JvdXBXaWR0aCk7XG4gICAgICAgICAgICBncm91cENhcGFjaXR5ID0gY2FwYWNpdHkoZ3JvdXBXaWR0aCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlbW92ZURhdGEocmVJbmRleCkge1xuICAgICAgICBpZiAoayA+IDEgfHwgaXRlcmFibGUpIHtcbiAgICAgICAgICB2YXIgb2xkSyA9IGssXG4gICAgICAgICAgICAgIG9sZEdyb3VwcyA9IGdyb3VwcyxcbiAgICAgICAgICAgICAgc2Vlbkdyb3VwcyA9IGNyX2luZGV4KG9sZEssIG9sZEspLFxuICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICBpMCxcbiAgICAgICAgICAgICAgajtcblxuICAgICAgICAgIC8vIEZpbHRlciBvdXQgbm9uLW1hdGNoZXMgYnkgY29weWluZyBtYXRjaGluZyBncm91cCBpbmRleCBlbnRyaWVzIHRvXG4gICAgICAgICAgLy8gdGhlIGJlZ2lubmluZyBvZiB0aGUgYXJyYXkuXG4gICAgICAgICAgaWYgKCFpdGVyYWJsZSkge1xuICAgICAgICAgICAgZm9yIChpID0gMCwgaiA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgICAgaWYgKHJlSW5kZXhbaV0gIT09IFJFTU9WRURfSU5ERVgpIHtcbiAgICAgICAgICAgICAgICBzZWVuR3JvdXBzW2dyb3VwSW5kZXhbal0gPSBncm91cEluZGV4W2ldXSA9IDE7XG4gICAgICAgICAgICAgICAgKytqO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGogPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICAgIGlmIChyZUluZGV4W2ldICE9PSBSRU1PVkVEX0lOREVYKSB7XG4gICAgICAgICAgICAgICAgZ3JvdXBJbmRleFtqXSA9IGdyb3VwSW5kZXhbaV07XG4gICAgICAgICAgICAgICAgZm9yIChpMCA9IDA7IGkwIDwgZ3JvdXBJbmRleFtqXS5sZW5ndGg7IGkwKyspIHtcbiAgICAgICAgICAgICAgICAgIHNlZW5Hcm91cHNbZ3JvdXBJbmRleFtqXVtpMF1dID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKytqO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBncm91cEluZGV4ID0gZ3JvdXBJbmRleC5zbGljZSgwLCBqKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBSZWFzc2VtYmxlIGdyb3VwcyBpbmNsdWRpbmcgb25seSB0aG9zZSBncm91cHMgdGhhdCB3ZXJlIHJlZmVycmVkXG4gICAgICAgICAgLy8gdG8gYnkgbWF0Y2hpbmcgZ3JvdXAgaW5kZXggZW50cmllcy4gIE5vdGUgdGhlIG5ldyBncm91cCBpbmRleCBpblxuICAgICAgICAgIC8vIHNlZW5Hcm91cHMuXG4gICAgICAgICAgZ3JvdXBzID0gW10sIGsgPSAwO1xuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBvbGRLOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChzZWVuR3JvdXBzW2ldKSB7XG4gICAgICAgICAgICAgIHNlZW5Hcm91cHNbaV0gPSBrKys7XG4gICAgICAgICAgICAgIGdyb3Vwcy5wdXNoKG9sZEdyb3Vwc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGsgPiAxIHx8IGl0ZXJhYmxlKSB7XG4gICAgICAgICAgICAvLyBSZWluZGV4IHRoZSBncm91cCBpbmRleCB1c2luZyBzZWVuR3JvdXBzIHRvIGZpbmQgdGhlIG5ldyBpbmRleC5cbiAgICAgICAgICAgIGlmICghaXRlcmFibGUpIHtcbiAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGo7ICsraSkgZ3JvdXBJbmRleFtpXSA9IHNlZW5Hcm91cHNbZ3JvdXBJbmRleFtpXV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgajsgKytpKSB7XG4gICAgICAgICAgICAgICAgZm9yIChpMCA9IDA7IGkwIDwgZ3JvdXBJbmRleFtpXS5sZW5ndGg7ICsraTApIHtcbiAgICAgICAgICAgICAgICAgIGdyb3VwSW5kZXhbaV1baTBdID0gc2Vlbkdyb3Vwc1tncm91cEluZGV4W2ldW2kwXV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdyb3VwSW5kZXggPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmaWx0ZXJMaXN0ZW5lcnNbZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKV0gPSBrID4gMSB8fCBpdGVyYWJsZVxuICAgICAgICAgICAgICA/IChyZXNldCA9IHJlc2V0TWFueSwgdXBkYXRlID0gdXBkYXRlTWFueSlcbiAgICAgICAgICAgICAgOiBrID09PSAxID8gKHJlc2V0ID0gcmVzZXRPbmUsIHVwZGF0ZSA9IHVwZGF0ZU9uZSlcbiAgICAgICAgICAgICAgOiByZXNldCA9IHVwZGF0ZSA9IGNyX251bGw7XG4gICAgICAgIH0gZWxzZSBpZiAoayA9PT0gMSkge1xuICAgICAgICAgIGlmIChncm91cEFsbCkgcmV0dXJuO1xuICAgICAgICAgIGZvciAodmFyIGluZGV4MyA9IDA7IGluZGV4MyA8IG47ICsraW5kZXgzKSBpZiAocmVJbmRleFtpbmRleDNdICE9PSBSRU1PVkVEX0lOREVYKSByZXR1cm47XG4gICAgICAgICAgZ3JvdXBzID0gW10sIGsgPSAwO1xuICAgICAgICAgIGZpbHRlckxpc3RlbmVyc1tmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpXSA9XG4gICAgICAgICAgdXBkYXRlID0gcmVzZXQgPSBjcl9udWxsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlZHVjZXMgdGhlIHNwZWNpZmllZCBzZWxlY3RlZCBvciBkZXNlbGVjdGVkIHJlY29yZHMuXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyBncmVhdGVyIHRoYW4gMS5cbiAgICAgIC8vIG5vdEZpbHRlciBpbmRpY2F0ZXMgYSBjcm9zc2ZpbHRlci5hZGQvcmVtb3ZlIG9wZXJhdGlvbi5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZU1hbnkoZmlsdGVyT25lLCBmaWx0ZXJPZmZzZXQsIGFkZGVkLCByZW1vdmVkLCBub3RGaWx0ZXIpIHtcblxuICAgICAgICBpZiAoKGZpbHRlck9uZSA9PT0gb25lICYmIGZpbHRlck9mZnNldCA9PT0gb2Zmc2V0KSB8fCByZXNldE5lZWRlZCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBuLFxuICAgICAgICAgICAgZztcblxuICAgICAgICBpZihpdGVyYWJsZSl7XG4gICAgICAgICAgLy8gQWRkIHRoZSBhZGRlZCB2YWx1ZXMuXG4gICAgICAgICAgZm9yIChpID0gMCwgbiA9IGFkZGVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgaWYgKGZpbHRlcnMuemVyb0V4Y2VwdChrID0gYWRkZWRbaV0sIG9mZnNldCwgemVybykpIHtcbiAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGdyb3VwSW5kZXhba10ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhba11bal1dO1xuICAgICAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtrXSwgZmFsc2UsIGopO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gUmVtb3ZlIHRoZSByZW1vdmVkIHZhbHVlcy5cbiAgICAgICAgICBmb3IgKGkgPSAwLCBuID0gcmVtb3ZlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXJzLm9ubHlFeGNlcHQoayA9IHJlbW92ZWRbaV0sIG9mZnNldCwgemVybywgZmlsdGVyT2Zmc2V0LCBmaWx0ZXJPbmUpKSB7XG4gICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBncm91cEluZGV4W2tdLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2tdW2pdXTtcbiAgICAgICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlUmVtb3ZlKGcudmFsdWUsIGRhdGFba10sIG5vdEZpbHRlciwgaik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIHRoZSBhZGRlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoZmlsdGVycy56ZXJvRXhjZXB0KGsgPSBhZGRlZFtpXSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2tdXTtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtrXSwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgcmVtb3ZlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmIChmaWx0ZXJzLm9ubHlFeGNlcHQoayA9IHJlbW92ZWRbaV0sIG9mZnNldCwgemVybywgZmlsdGVyT2Zmc2V0LCBmaWx0ZXJPbmUpKSB7XG4gICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhba11dO1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2tdLCBub3RGaWx0ZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWR1Y2VzIHRoZSBzcGVjaWZpZWQgc2VsZWN0ZWQgb3IgZGVzZWxlY3RlZCByZWNvcmRzLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgY2FyZGluYWxpdHkgaXMgMS5cbiAgICAgIC8vIG5vdEZpbHRlciBpbmRpY2F0ZXMgYSBjcm9zc2ZpbHRlci5hZGQvcmVtb3ZlIG9wZXJhdGlvbi5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZU9uZShmaWx0ZXJPbmUsIGZpbHRlck9mZnNldCwgYWRkZWQsIHJlbW92ZWQsIG5vdEZpbHRlcikge1xuICAgICAgICBpZiAoKGZpbHRlck9uZSA9PT0gb25lICYmIGZpbHRlck9mZnNldCA9PT0gb2Zmc2V0KSB8fCByZXNldE5lZWRlZCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIG4sXG4gICAgICAgICAgICBnID0gZ3JvdXBzWzBdO1xuXG4gICAgICAgIC8vIEFkZCB0aGUgYWRkZWQgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gYWRkZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKGZpbHRlcnMuemVyb0V4Y2VwdChrID0gYWRkZWRbaV0sIG9mZnNldCwgemVybykpIHtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtrXSwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgcmVtb3ZlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmIChmaWx0ZXJzLm9ubHlFeGNlcHQoayA9IHJlbW92ZWRbaV0sIG9mZnNldCwgemVybywgZmlsdGVyT2Zmc2V0LCBmaWx0ZXJPbmUpKSB7XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlUmVtb3ZlKGcudmFsdWUsIGRhdGFba10sIG5vdEZpbHRlcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlY29tcHV0ZXMgdGhlIGdyb3VwIHJlZHVjZSB2YWx1ZXMgZnJvbSBzY3JhdGNoLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgY2FyZGluYWxpdHkgaXMgZ3JlYXRlciB0aGFuIDEuXG4gICAgICBmdW5jdGlvbiByZXNldE1hbnkoKSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGc7XG5cbiAgICAgICAgLy8gUmVzZXQgYWxsIGdyb3VwIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGs7ICsraSkge1xuICAgICAgICAgIGdyb3Vwc1tpXS52YWx1ZSA9IHJlZHVjZUluaXRpYWwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIGFkZCBhbGwgcmVjb3JkcyBhbmQgdGhlbiByZW1vdmUgZmlsdGVyZWQgcmVjb3JkcyBzbyB0aGF0IHJlZHVjZXJzXG4gICAgICAgIC8vIGNhbiBidWlsZCBhbiAndW5maWx0ZXJlZCcgdmlldyBldmVuIGlmIHRoZXJlIGFyZSBhbHJlYWR5IGZpbHRlcnMgaW5cbiAgICAgICAgLy8gcGxhY2Ugb24gb3RoZXIgZGltZW5zaW9ucy5cbiAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBncm91cEluZGV4W2ldLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtpXVtqXV07XG4gICAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtpXSwgdHJ1ZSwgaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIGlmICghZmlsdGVycy56ZXJvRXhjZXB0KGksIG9mZnNldCwgemVybykpIHtcbiAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGdyb3VwSW5kZXhbaV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhbaV1bal1dO1xuICAgICAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtpXSwgZmFsc2UsIGopO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhbaV1dO1xuICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtpXSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmICghZmlsdGVycy56ZXJvRXhjZXB0KGksIG9mZnNldCwgemVybykpIHtcbiAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtpXV07XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlUmVtb3ZlKGcudmFsdWUsIGRhdGFbaV0sIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVjb21wdXRlcyB0aGUgZ3JvdXAgcmVkdWNlIHZhbHVlcyBmcm9tIHNjcmF0Y2guXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyAxLlxuICAgICAgZnVuY3Rpb24gcmVzZXRPbmUoKSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgZyA9IGdyb3Vwc1swXTtcblxuICAgICAgICAvLyBSZXNldCB0aGUgc2luZ2xldG9uIGdyb3VwIHZhbHVlcy5cbiAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUluaXRpYWwoKTtcblxuICAgICAgICAvLyBXZSBhZGQgYWxsIHJlY29yZHMgYW5kIHRoZW4gcmVtb3ZlIGZpbHRlcmVkIHJlY29yZHMgc28gdGhhdCByZWR1Y2Vyc1xuICAgICAgICAvLyBjYW4gYnVpbGQgYW4gJ3VuZmlsdGVyZWQnIHZpZXcgZXZlbiBpZiB0aGVyZSBhcmUgYWxyZWFkeSBmaWx0ZXJzIGluXG4gICAgICAgIC8vIHBsYWNlIG9uIG90aGVyIGRpbWVuc2lvbnMuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFbaV0sIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmICghZmlsdGVycy56ZXJvRXhjZXB0KGksIG9mZnNldCwgemVybykpIHtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtpXSwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZXR1cm5zIHRoZSBhcnJheSBvZiBncm91cCB2YWx1ZXMsIGluIHRoZSBkaW1lbnNpb24ncyBuYXR1cmFsIG9yZGVyLlxuICAgICAgZnVuY3Rpb24gYWxsKCkge1xuICAgICAgICBpZiAocmVzZXROZWVkZWQpIHJlc2V0KCksIHJlc2V0TmVlZGVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBncm91cHM7XG4gICAgICB9XG5cbiAgICAgIC8vIFJldHVybnMgYSBuZXcgYXJyYXkgY29udGFpbmluZyB0aGUgdG9wIEsgZ3JvdXAgdmFsdWVzLCBpbiByZWR1Y2Ugb3JkZXIuXG4gICAgICBmdW5jdGlvbiB0b3Aoaykge1xuICAgICAgICB2YXIgdG9wID0gc2VsZWN0KGFsbCgpLCAwLCBncm91cHMubGVuZ3RoLCBrKTtcbiAgICAgICAgcmV0dXJuIGhlYXAuc29ydCh0b3AsIDAsIHRvcC5sZW5ndGgpO1xuICAgICAgfVxuXG4gICAgICAvLyBTZXRzIHRoZSByZWR1Y2UgYmVoYXZpb3IgZm9yIHRoaXMgZ3JvdXAgdG8gdXNlIHRoZSBzcGVjaWZpZWQgZnVuY3Rpb25zLlxuICAgICAgLy8gVGhpcyBtZXRob2QgbGF6aWx5IHJlY29tcHV0ZXMgdGhlIHJlZHVjZSB2YWx1ZXMsIHdhaXRpbmcgdW50aWwgbmVlZGVkLlxuICAgICAgZnVuY3Rpb24gcmVkdWNlKGFkZCwgcmVtb3ZlLCBpbml0aWFsKSB7XG4gICAgICAgIHJlZHVjZUFkZCA9IGFkZDtcbiAgICAgICAgcmVkdWNlUmVtb3ZlID0gcmVtb3ZlO1xuICAgICAgICByZWR1Y2VJbml0aWFsID0gaW5pdGlhbDtcbiAgICAgICAgcmVzZXROZWVkZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICB9XG5cbiAgICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciByZWR1Y2luZyBieSBjb3VudC5cbiAgICAgIGZ1bmN0aW9uIHJlZHVjZUNvdW50KCkge1xuICAgICAgICByZXR1cm4gcmVkdWNlKHhmaWx0ZXJSZWR1Y2UucmVkdWNlSW5jcmVtZW50LCB4ZmlsdGVyUmVkdWNlLnJlZHVjZURlY3JlbWVudCwgY3JfemVybyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciByZWR1Y2luZyBieSBzdW0odmFsdWUpLlxuICAgICAgZnVuY3Rpb24gcmVkdWNlU3VtKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiByZWR1Y2UoeGZpbHRlclJlZHVjZS5yZWR1Y2VBZGQodmFsdWUpLCB4ZmlsdGVyUmVkdWNlLnJlZHVjZVN1YnRyYWN0KHZhbHVlKSwgY3JfemVybyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldHMgdGhlIHJlZHVjZSBvcmRlciwgdXNpbmcgdGhlIHNwZWNpZmllZCBhY2Nlc3Nvci5cbiAgICAgIGZ1bmN0aW9uIG9yZGVyKHZhbHVlKSB7XG4gICAgICAgIHNlbGVjdCA9IHhmaWx0ZXJIZWFwc2VsZWN0LmJ5KHZhbHVlT2YpO1xuICAgICAgICBoZWFwID0geGZpbHRlckhlYXAuYnkodmFsdWVPZik7XG4gICAgICAgIGZ1bmN0aW9uIHZhbHVlT2YoZCkgeyByZXR1cm4gdmFsdWUoZC52YWx1ZSk7IH1cbiAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgfVxuXG4gICAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgbmF0dXJhbCBvcmRlcmluZyBieSByZWR1Y2UgdmFsdWUuXG4gICAgICBmdW5jdGlvbiBvcmRlck5hdHVyYWwoKSB7XG4gICAgICAgIHJldHVybiBvcmRlcihjcl9pZGVudGl0eSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJldHVybnMgdGhlIGNhcmRpbmFsaXR5IG9mIHRoaXMgZ3JvdXAsIGlycmVzcGVjdGl2ZSBvZiBhbnkgZmlsdGVycy5cbiAgICAgIGZ1bmN0aW9uIHNpemUoKSB7XG4gICAgICAgIHJldHVybiBrO1xuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmVzIHRoaXMgZ3JvdXAgYW5kIGFzc29jaWF0ZWQgZXZlbnQgbGlzdGVuZXJzLlxuICAgICAgZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgICAgdmFyIGkgPSBmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpO1xuICAgICAgICBpZiAoaSA+PSAwKSBmaWx0ZXJMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICBpID0gaW5kZXhMaXN0ZW5lcnMuaW5kZXhPZihhZGQpO1xuICAgICAgICBpZiAoaSA+PSAwKSBpbmRleExpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGkgPSByZW1vdmVEYXRhTGlzdGVuZXJzLmluZGV4T2YocmVtb3ZlRGF0YSk7XG4gICAgICAgIGlmIChpID49IDApIHJlbW92ZURhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICBpID0gZGltZW5zaW9uR3JvdXBzLmluZGV4T2YoZ3JvdXApO1xuICAgICAgICBpZiAoaSA+PSAwKSBkaW1lbnNpb25Hcm91cHMuc3BsaWNlKGksIDEpO1xuICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZWR1Y2VDb3VudCgpLm9yZGVyTmF0dXJhbCgpO1xuICAgIH1cblxuICAgIC8vIEEgY29udmVuaWVuY2UgZnVuY3Rpb24gZm9yIGdlbmVyYXRpbmcgYSBzaW5nbGV0b24gZ3JvdXAuXG4gICAgZnVuY3Rpb24gZ3JvdXBBbGwoKSB7XG4gICAgICB2YXIgZyA9IGdyb3VwKGNyX251bGwpLCBhbGwgPSBnLmFsbDtcbiAgICAgIGRlbGV0ZSBnLmFsbDtcbiAgICAgIGRlbGV0ZSBnLnRvcDtcbiAgICAgIGRlbGV0ZSBnLm9yZGVyO1xuICAgICAgZGVsZXRlIGcub3JkZXJOYXR1cmFsO1xuICAgICAgZGVsZXRlIGcuc2l6ZTtcbiAgICAgIGcudmFsdWUgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGFsbCgpWzBdLnZhbHVlOyB9O1xuICAgICAgcmV0dXJuIGc7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlcyB0aGlzIGRpbWVuc2lvbiBhbmQgYXNzb2NpYXRlZCBncm91cHMgYW5kIGV2ZW50IGxpc3RlbmVycy5cbiAgICBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgZGltZW5zaW9uR3JvdXBzLmZvckVhY2goZnVuY3Rpb24oZ3JvdXApIHsgZ3JvdXAuZGlzcG9zZSgpOyB9KTtcbiAgICAgIHZhciBpID0gZGF0YUxpc3RlbmVycy5pbmRleE9mKHByZUFkZCk7XG4gICAgICBpZiAoaSA+PSAwKSBkYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIGkgPSBkYXRhTGlzdGVuZXJzLmluZGV4T2YocG9zdEFkZCk7XG4gICAgICBpZiAoaSA+PSAwKSBkYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIGkgPSByZW1vdmVEYXRhTGlzdGVuZXJzLmluZGV4T2YocmVtb3ZlRGF0YSk7XG4gICAgICBpZiAoaSA+PSAwKSByZW1vdmVEYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIGZpbHRlcnMubWFza3Nbb2Zmc2V0XSAmPSB6ZXJvO1xuICAgICAgcmV0dXJuIGZpbHRlckFsbCgpO1xuICAgIH1cblxuICAgIHJldHVybiBkaW1lbnNpb247XG4gIH1cblxuICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgZ3JvdXBBbGwgb24gYSBkdW1teSBkaW1lbnNpb24uXG4gIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gY2FuIGJlIG9wdGltaXplZCBzaW5jZSBpdCBhbHdheXMgaGFzIGNhcmRpbmFsaXR5IDEuXG4gIGZ1bmN0aW9uIGdyb3VwQWxsKCkge1xuICAgIHZhciBncm91cCA9IHtcbiAgICAgIHJlZHVjZTogcmVkdWNlLFxuICAgICAgcmVkdWNlQ291bnQ6IHJlZHVjZUNvdW50LFxuICAgICAgcmVkdWNlU3VtOiByZWR1Y2VTdW0sXG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICBkaXNwb3NlOiBkaXNwb3NlLFxuICAgICAgcmVtb3ZlOiBkaXNwb3NlIC8vIGZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eVxuICAgIH07XG5cbiAgICB2YXIgcmVkdWNlVmFsdWUsXG4gICAgICAgIHJlZHVjZUFkZCxcbiAgICAgICAgcmVkdWNlUmVtb3ZlLFxuICAgICAgICByZWR1Y2VJbml0aWFsLFxuICAgICAgICByZXNldE5lZWRlZCA9IHRydWU7XG5cbiAgICAvLyBUaGUgZ3JvdXAgbGlzdGVucyB0byB0aGUgY3Jvc3NmaWx0ZXIgZm9yIHdoZW4gYW55IGRpbWVuc2lvbiBjaGFuZ2VzLCBzb1xuICAgIC8vIHRoYXQgaXQgY2FuIHVwZGF0ZSB0aGUgcmVkdWNlIHZhbHVlLiBJdCBtdXN0IGFsc28gbGlzdGVuIHRvIHRoZSBwYXJlbnRcbiAgICAvLyBkaW1lbnNpb24gZm9yIHdoZW4gZGF0YSBpcyBhZGRlZC5cbiAgICBmaWx0ZXJMaXN0ZW5lcnMucHVzaCh1cGRhdGUpO1xuICAgIGRhdGFMaXN0ZW5lcnMucHVzaChhZGQpO1xuXG4gICAgLy8gRm9yIGNvbnNpc3RlbmN5OyBhY3R1YWxseSBhIG5vLW9wIHNpbmNlIHJlc2V0TmVlZGVkIGlzIHRydWUuXG4gICAgYWRkKGRhdGEsIDAsIG4pO1xuXG4gICAgLy8gSW5jb3Jwb3JhdGVzIHRoZSBzcGVjaWZpZWQgbmV3IHZhbHVlcyBpbnRvIHRoaXMgZ3JvdXAuXG4gICAgZnVuY3Rpb24gYWRkKG5ld0RhdGEsIG4wKSB7XG4gICAgICB2YXIgaTtcblxuICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgIC8vIEN5Y2xlIHRocm91Z2ggYWxsIHRoZSB2YWx1ZXMuXG4gICAgICBmb3IgKGkgPSBuMDsgaSA8IG47ICsraSkge1xuXG4gICAgICAgIC8vIEFkZCBhbGwgdmFsdWVzIGFsbCB0aGUgdGltZS5cbiAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VBZGQocmVkdWNlVmFsdWUsIGRhdGFbaV0sIHRydWUpO1xuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgdmFsdWUgaWYgZmlsdGVyZWQuXG4gICAgICAgIGlmICghZmlsdGVycy56ZXJvKGkpKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VSZW1vdmUocmVkdWNlVmFsdWUsIGRhdGFbaV0sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlZHVjZXMgdGhlIHNwZWNpZmllZCBzZWxlY3RlZCBvciBkZXNlbGVjdGVkIHJlY29yZHMuXG4gICAgZnVuY3Rpb24gdXBkYXRlKGZpbHRlck9uZSwgZmlsdGVyT2Zmc2V0LCBhZGRlZCwgcmVtb3ZlZCwgbm90RmlsdGVyKSB7XG4gICAgICB2YXIgaSxcbiAgICAgICAgICBrLFxuICAgICAgICAgIG47XG5cbiAgICAgIGlmIChyZXNldE5lZWRlZCkgcmV0dXJuO1xuXG4gICAgICAvLyBBZGQgdGhlIGFkZGVkIHZhbHVlcy5cbiAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgaWYgKGZpbHRlcnMuemVybyhrID0gYWRkZWRbaV0pKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VBZGQocmVkdWNlVmFsdWUsIGRhdGFba10sIG5vdEZpbHRlcik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlIHRoZSByZW1vdmVkIHZhbHVlcy5cbiAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoZmlsdGVycy5vbmx5KGsgPSByZW1vdmVkW2ldLCBmaWx0ZXJPZmZzZXQsIGZpbHRlck9uZSkpIHtcbiAgICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZVJlbW92ZShyZWR1Y2VWYWx1ZSwgZGF0YVtrXSwgbm90RmlsdGVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlY29tcHV0ZXMgdGhlIGdyb3VwIHJlZHVjZSB2YWx1ZSBmcm9tIHNjcmF0Y2guXG4gICAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICB2YXIgaTtcblxuICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VJbml0aWFsKCk7XG5cbiAgICAgIC8vIEN5Y2xlIHRocm91Z2ggYWxsIHRoZSB2YWx1ZXMuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG5cbiAgICAgICAgLy8gQWRkIGFsbCB2YWx1ZXMgYWxsIHRoZSB0aW1lLlxuICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZUFkZChyZWR1Y2VWYWx1ZSwgZGF0YVtpXSwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSB2YWx1ZSBpZiBpdCBpcyBmaWx0ZXJlZC5cbiAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm8oaSkpIHtcbiAgICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZVJlbW92ZShyZWR1Y2VWYWx1ZSwgZGF0YVtpXSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2V0cyB0aGUgcmVkdWNlIGJlaGF2aW9yIGZvciB0aGlzIGdyb3VwIHRvIHVzZSB0aGUgc3BlY2lmaWVkIGZ1bmN0aW9ucy5cbiAgICAvLyBUaGlzIG1ldGhvZCBsYXppbHkgcmVjb21wdXRlcyB0aGUgcmVkdWNlIHZhbHVlLCB3YWl0aW5nIHVudGlsIG5lZWRlZC5cbiAgICBmdW5jdGlvbiByZWR1Y2UoYWRkLCByZW1vdmUsIGluaXRpYWwpIHtcbiAgICAgIHJlZHVjZUFkZCA9IGFkZDtcbiAgICAgIHJlZHVjZVJlbW92ZSA9IHJlbW92ZTtcbiAgICAgIHJlZHVjZUluaXRpYWwgPSBpbml0aWFsO1xuICAgICAgcmVzZXROZWVkZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIGdyb3VwO1xuICAgIH1cblxuICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciByZWR1Y2luZyBieSBjb3VudC5cbiAgICBmdW5jdGlvbiByZWR1Y2VDb3VudCgpIHtcbiAgICAgIHJldHVybiByZWR1Y2UoeGZpbHRlclJlZHVjZS5yZWR1Y2VJbmNyZW1lbnQsIHhmaWx0ZXJSZWR1Y2UucmVkdWNlRGVjcmVtZW50LCBjcl96ZXJvKTtcbiAgICB9XG5cbiAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgc3VtKHZhbHVlKS5cbiAgICBmdW5jdGlvbiByZWR1Y2VTdW0odmFsdWUpIHtcbiAgICAgIHJldHVybiByZWR1Y2UoeGZpbHRlclJlZHVjZS5yZWR1Y2VBZGQodmFsdWUpLCB4ZmlsdGVyUmVkdWNlLnJlZHVjZVN1YnRyYWN0KHZhbHVlKSwgY3JfemVybyk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJucyB0aGUgY29tcHV0ZWQgcmVkdWNlIHZhbHVlLlxuICAgIGZ1bmN0aW9uIHZhbHVlKCkge1xuICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXNldCgpLCByZXNldE5lZWRlZCA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHJlZHVjZVZhbHVlO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZXMgdGhpcyBncm91cCBhbmQgYXNzb2NpYXRlZCBldmVudCBsaXN0ZW5lcnMuXG4gICAgZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgIHZhciBpID0gZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKTtcbiAgICAgIGlmIChpID49IDApIGZpbHRlckxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICBpID0gZGF0YUxpc3RlbmVycy5pbmRleE9mKGFkZCk7XG4gICAgICBpZiAoaSA+PSAwKSBkYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIHJldHVybiBncm91cDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVkdWNlQ291bnQoKTtcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIG51bWJlciBvZiByZWNvcmRzIGluIHRoaXMgY3Jvc3NmaWx0ZXIsIGlycmVzcGVjdGl2ZSBvZiBhbnkgZmlsdGVycy5cbiAgZnVuY3Rpb24gc2l6ZSgpIHtcbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIHJhdyByb3cgZGF0YSBjb250YWluZWQgaW4gdGhpcyBjcm9zc2ZpbHRlclxuICBmdW5jdGlvbiBhbGwoKXtcbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIC8vIFJldHVybnMgcm93IGRhdGEgd2l0aCBhbGwgZGltZW5zaW9uIGZpbHRlcnMgYXBwbGllZCwgZXhjZXB0IGZvciBmaWx0ZXJzIGluIGlnbm9yZV9kaW1lbnNpb25zXG4gIGZ1bmN0aW9uIGFsbEZpbHRlcmVkKGlnbm9yZV9kaW1lbnNpb25zKSB7XG4gICAgdmFyIGFycmF5ID0gW10sXG4gICAgICAgIGkgPSAwLFxuICAgICAgICBtYXNrID0gbWFza0ZvckRpbWVuc2lvbnMoaWdub3JlX2RpbWVuc2lvbnMgfHwgW10pO1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzLnplcm9FeGNlcHRNYXNrKGksIG1hc2spKSB7XG4gICAgICAgICAgYXJyYXkucHVzaChkYXRhW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gYXJyYXk7XG4gIH1cblxuICBmdW5jdGlvbiBvbkNoYW5nZShjYil7XG4gICAgaWYodHlwZW9mIGNiICE9PSAnZnVuY3Rpb24nKXtcbiAgICAgIC8qIGVzbGludCBuby1jb25zb2xlOiAwICovXG4gICAgICBjb25zb2xlLndhcm4oJ29uQ2hhbmdlIGNhbGxiYWNrIHBhcmFtZXRlciBtdXN0IGJlIGEgZnVuY3Rpb24hJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNhbGxiYWNrcy5wdXNoKGNiKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKXtcbiAgICAgIGNhbGxiYWNrcy5zcGxpY2UoY2FsbGJhY2tzLmluZGV4T2YoY2IpLCAxKTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gdHJpZ2dlck9uQ2hhbmdlKGV2ZW50TmFtZSl7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNhbGxiYWNrc1tpXShldmVudE5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhcmd1bWVudHMubGVuZ3RoXG4gICAgICA/IGFkZChhcmd1bWVudHNbMF0pXG4gICAgICA6IGNyb3NzZmlsdGVyO1xufVxuXG4vLyBSZXR1cm5zIGFuIGFycmF5IG9mIHNpemUgbiwgYmlnIGVub3VnaCB0byBzdG9yZSBpZHMgdXAgdG8gbS5cbmZ1bmN0aW9uIGNyX2luZGV4KG4sIG0pIHtcbiAgcmV0dXJuIChtIDwgMHgxMDFcbiAgICAgID8geGZpbHRlckFycmF5LmFycmF5OCA6IG0gPCAweDEwMDAxXG4gICAgICA/IHhmaWx0ZXJBcnJheS5hcnJheTE2XG4gICAgICA6IHhmaWx0ZXJBcnJheS5hcnJheTMyKShuKTtcbn1cblxuLy8gQ29uc3RydWN0cyBhIG5ldyBhcnJheSBvZiBzaXplIG4sIHdpdGggc2VxdWVudGlhbCB2YWx1ZXMgZnJvbSAwIHRvIG4gLSAxLlxuZnVuY3Rpb24gY3JfcmFuZ2Uobikge1xuICB2YXIgcmFuZ2UgPSBjcl9pbmRleChuLCBuKTtcbiAgZm9yICh2YXIgaSA9IC0xOyArK2kgPCBuOykgcmFuZ2VbaV0gPSBpO1xuICByZXR1cm4gcmFuZ2U7XG59XG5cbmZ1bmN0aW9uIGNhcGFjaXR5KHcpIHtcbiAgcmV0dXJuIHcgPT09IDhcbiAgICAgID8gMHgxMDAgOiB3ID09PSAxNlxuICAgICAgPyAweDEwMDAwXG4gICAgICA6IDB4MTAwMDAwMDAwO1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oYSwgYikge1xuICByZXR1cm4gYSA8IGIgPyAtMSA6IGEgPiBiID8gMSA6IGEgPj0gYiA/IDAgOiBOYU47XG59XG4iLCJpbXBvcnQgYXNjZW5kaW5nIGZyb20gXCIuL2FzY2VuZGluZ1wiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihjb21wYXJlKSB7XG4gIGlmIChjb21wYXJlLmxlbmd0aCA9PT0gMSkgY29tcGFyZSA9IGFzY2VuZGluZ0NvbXBhcmF0b3IoY29tcGFyZSk7XG4gIHJldHVybiB7XG4gICAgbGVmdDogZnVuY3Rpb24oYSwgeCwgbG8sIGhpKSB7XG4gICAgICBpZiAobG8gPT0gbnVsbCkgbG8gPSAwO1xuICAgICAgaWYgKGhpID09IG51bGwpIGhpID0gYS5sZW5ndGg7XG4gICAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgICB2YXIgbWlkID0gbG8gKyBoaSA+Pj4gMTtcbiAgICAgICAgaWYgKGNvbXBhcmUoYVttaWRdLCB4KSA8IDApIGxvID0gbWlkICsgMTtcbiAgICAgICAgZWxzZSBoaSA9IG1pZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsbztcbiAgICB9LFxuICAgIHJpZ2h0OiBmdW5jdGlvbihhLCB4LCBsbywgaGkpIHtcbiAgICAgIGlmIChsbyA9PSBudWxsKSBsbyA9IDA7XG4gICAgICBpZiAoaGkgPT0gbnVsbCkgaGkgPSBhLmxlbmd0aDtcbiAgICAgIHdoaWxlIChsbyA8IGhpKSB7XG4gICAgICAgIHZhciBtaWQgPSBsbyArIGhpID4+PiAxO1xuICAgICAgICBpZiAoY29tcGFyZShhW21pZF0sIHgpID4gMCkgaGkgPSBtaWQ7XG4gICAgICAgIGVsc2UgbG8gPSBtaWQgKyAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gYXNjZW5kaW5nQ29tcGFyYXRvcihmKSB7XG4gIHJldHVybiBmdW5jdGlvbihkLCB4KSB7XG4gICAgcmV0dXJuIGFzY2VuZGluZyhmKGQpLCB4KTtcbiAgfTtcbn1cbiIsImltcG9ydCBhc2NlbmRpbmcgZnJvbSBcIi4vYXNjZW5kaW5nXCI7XG5pbXBvcnQgYmlzZWN0b3IgZnJvbSBcIi4vYmlzZWN0b3JcIjtcblxudmFyIGFzY2VuZGluZ0Jpc2VjdCA9IGJpc2VjdG9yKGFzY2VuZGluZyk7XG5leHBvcnQgdmFyIGJpc2VjdFJpZ2h0ID0gYXNjZW5kaW5nQmlzZWN0LnJpZ2h0O1xuZXhwb3J0IHZhciBiaXNlY3RMZWZ0ID0gYXNjZW5kaW5nQmlzZWN0LmxlZnQ7XG5leHBvcnQgZGVmYXVsdCBiaXNlY3RSaWdodDtcbiIsInZhciBub29wID0ge3ZhbHVlOiBmdW5jdGlvbigpIHt9fTtcblxuZnVuY3Rpb24gZGlzcGF0Y2goKSB7XG4gIGZvciAodmFyIGkgPSAwLCBuID0gYXJndW1lbnRzLmxlbmd0aCwgXyA9IHt9LCB0OyBpIDwgbjsgKytpKSB7XG4gICAgaWYgKCEodCA9IGFyZ3VtZW50c1tpXSArIFwiXCIpIHx8ICh0IGluIF8pIHx8IC9bXFxzLl0vLnRlc3QodCkpIHRocm93IG5ldyBFcnJvcihcImlsbGVnYWwgdHlwZTogXCIgKyB0KTtcbiAgICBfW3RdID0gW107XG4gIH1cbiAgcmV0dXJuIG5ldyBEaXNwYXRjaChfKTtcbn1cblxuZnVuY3Rpb24gRGlzcGF0Y2goXykge1xuICB0aGlzLl8gPSBfO1xufVxuXG5mdW5jdGlvbiBwYXJzZVR5cGVuYW1lcyh0eXBlbmFtZXMsIHR5cGVzKSB7XG4gIHJldHVybiB0eXBlbmFtZXMudHJpbSgpLnNwbGl0KC9efFxccysvKS5tYXAoZnVuY3Rpb24odCkge1xuICAgIHZhciBuYW1lID0gXCJcIiwgaSA9IHQuaW5kZXhPZihcIi5cIik7XG4gICAgaWYgKGkgPj0gMCkgbmFtZSA9IHQuc2xpY2UoaSArIDEpLCB0ID0gdC5zbGljZSgwLCBpKTtcbiAgICBpZiAodCAmJiAhdHlwZXMuaGFzT3duUHJvcGVydHkodCkpIHRocm93IG5ldyBFcnJvcihcInVua25vd24gdHlwZTogXCIgKyB0KTtcbiAgICByZXR1cm4ge3R5cGU6IHQsIG5hbWU6IG5hbWV9O1xuICB9KTtcbn1cblxuRGlzcGF0Y2gucHJvdG90eXBlID0gZGlzcGF0Y2gucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogRGlzcGF0Y2gsXG4gIG9uOiBmdW5jdGlvbih0eXBlbmFtZSwgY2FsbGJhY2spIHtcbiAgICB2YXIgXyA9IHRoaXMuXyxcbiAgICAgICAgVCA9IHBhcnNlVHlwZW5hbWVzKHR5cGVuYW1lICsgXCJcIiwgXyksXG4gICAgICAgIHQsXG4gICAgICAgIGkgPSAtMSxcbiAgICAgICAgbiA9IFQubGVuZ3RoO1xuXG4gICAgLy8gSWYgbm8gY2FsbGJhY2sgd2FzIHNwZWNpZmllZCwgcmV0dXJuIHRoZSBjYWxsYmFjayBvZiB0aGUgZ2l2ZW4gdHlwZSBhbmQgbmFtZS5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHtcbiAgICAgIHdoaWxlICgrK2kgPCBuKSBpZiAoKHQgPSAodHlwZW5hbWUgPSBUW2ldKS50eXBlKSAmJiAodCA9IGdldChfW3RdLCB0eXBlbmFtZS5uYW1lKSkpIHJldHVybiB0O1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIGEgdHlwZSB3YXMgc3BlY2lmaWVkLCBzZXQgdGhlIGNhbGxiYWNrIGZvciB0aGUgZ2l2ZW4gdHlwZSBhbmQgbmFtZS5cbiAgICAvLyBPdGhlcndpc2UsIGlmIGEgbnVsbCBjYWxsYmFjayB3YXMgc3BlY2lmaWVkLCByZW1vdmUgY2FsbGJhY2tzIG9mIHRoZSBnaXZlbiBuYW1lLlxuICAgIGlmIChjYWxsYmFjayAhPSBudWxsICYmIHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIGNhbGxiYWNrOiBcIiArIGNhbGxiYWNrKTtcbiAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgaWYgKHQgPSAodHlwZW5hbWUgPSBUW2ldKS50eXBlKSBfW3RdID0gc2V0KF9bdF0sIHR5cGVuYW1lLm5hbWUsIGNhbGxiYWNrKTtcbiAgICAgIGVsc2UgaWYgKGNhbGxiYWNrID09IG51bGwpIGZvciAodCBpbiBfKSBfW3RdID0gc2V0KF9bdF0sIHR5cGVuYW1lLm5hbWUsIG51bGwpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBjb3B5OiBmdW5jdGlvbigpIHtcbiAgICB2YXIgY29weSA9IHt9LCBfID0gdGhpcy5fO1xuICAgIGZvciAodmFyIHQgaW4gXykgY29weVt0XSA9IF9bdF0uc2xpY2UoKTtcbiAgICByZXR1cm4gbmV3IERpc3BhdGNoKGNvcHkpO1xuICB9LFxuICBjYWxsOiBmdW5jdGlvbih0eXBlLCB0aGF0KSB7XG4gICAgaWYgKChuID0gYXJndW1lbnRzLmxlbmd0aCAtIDIpID4gMCkgZm9yICh2YXIgYXJncyA9IG5ldyBBcnJheShuKSwgaSA9IDAsIG4sIHQ7IGkgPCBuOyArK2kpIGFyZ3NbaV0gPSBhcmd1bWVudHNbaSArIDJdO1xuICAgIGlmICghdGhpcy5fLmhhc093blByb3BlcnR5KHR5cGUpKSB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIHR5cGU6IFwiICsgdHlwZSk7XG4gICAgZm9yICh0ID0gdGhpcy5fW3R5cGVdLCBpID0gMCwgbiA9IHQubGVuZ3RoOyBpIDwgbjsgKytpKSB0W2ldLnZhbHVlLmFwcGx5KHRoYXQsIGFyZ3MpO1xuICB9LFxuICBhcHBseTogZnVuY3Rpb24odHlwZSwgdGhhdCwgYXJncykge1xuICAgIGlmICghdGhpcy5fLmhhc093blByb3BlcnR5KHR5cGUpKSB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIHR5cGU6IFwiICsgdHlwZSk7XG4gICAgZm9yICh2YXIgdCA9IHRoaXMuX1t0eXBlXSwgaSA9IDAsIG4gPSB0Lmxlbmd0aDsgaSA8IG47ICsraSkgdFtpXS52YWx1ZS5hcHBseSh0aGF0LCBhcmdzKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZ2V0KHR5cGUsIG5hbWUpIHtcbiAgZm9yICh2YXIgaSA9IDAsIG4gPSB0eXBlLmxlbmd0aCwgYzsgaSA8IG47ICsraSkge1xuICAgIGlmICgoYyA9IHR5cGVbaV0pLm5hbWUgPT09IG5hbWUpIHtcbiAgICAgIHJldHVybiBjLnZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzZXQodHlwZSwgbmFtZSwgY2FsbGJhY2spIHtcbiAgZm9yICh2YXIgaSA9IDAsIG4gPSB0eXBlLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgIGlmICh0eXBlW2ldLm5hbWUgPT09IG5hbWUpIHtcbiAgICAgIHR5cGVbaV0gPSBub29wLCB0eXBlID0gdHlwZS5zbGljZSgwLCBpKS5jb25jYXQodHlwZS5zbGljZShpICsgMSkpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIGlmIChjYWxsYmFjayAhPSBudWxsKSB0eXBlLnB1c2goe25hbWU6IG5hbWUsIHZhbHVlOiBjYWxsYmFja30pO1xuICByZXR1cm4gdHlwZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZGlzcGF0Y2g7XG4iLCJleHBvcnQgdmFyIHhodG1sID0gXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sXCI7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgc3ZnOiBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXG4gIHhodG1sOiB4aHRtbCxcbiAgeGxpbms6IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiLFxuICB4bWw6IFwiaHR0cDovL3d3dy53My5vcmcvWE1MLzE5OTgvbmFtZXNwYWNlXCIsXG4gIHhtbG5zOiBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAveG1sbnMvXCJcbn07XG4iLCJpbXBvcnQgbmFtZXNwYWNlcyBmcm9tIFwiLi9uYW1lc3BhY2VzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKG5hbWUpIHtcbiAgdmFyIHByZWZpeCA9IG5hbWUgKz0gXCJcIiwgaSA9IHByZWZpeC5pbmRleE9mKFwiOlwiKTtcbiAgaWYgKGkgPj0gMCAmJiAocHJlZml4ID0gbmFtZS5zbGljZSgwLCBpKSkgIT09IFwieG1sbnNcIikgbmFtZSA9IG5hbWUuc2xpY2UoaSArIDEpO1xuICByZXR1cm4gbmFtZXNwYWNlcy5oYXNPd25Qcm9wZXJ0eShwcmVmaXgpID8ge3NwYWNlOiBuYW1lc3BhY2VzW3ByZWZpeF0sIGxvY2FsOiBuYW1lfSA6IG5hbWU7XG59XG4iLCJpbXBvcnQgbmFtZXNwYWNlIGZyb20gXCIuL25hbWVzcGFjZVwiO1xuaW1wb3J0IHt4aHRtbH0gZnJvbSBcIi4vbmFtZXNwYWNlc1wiO1xuXG5mdW5jdGlvbiBjcmVhdG9ySW5oZXJpdChuYW1lKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgZG9jdW1lbnQgPSB0aGlzLm93bmVyRG9jdW1lbnQsXG4gICAgICAgIHVyaSA9IHRoaXMubmFtZXNwYWNlVVJJO1xuICAgIHJldHVybiB1cmkgPT09IHhodG1sICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5uYW1lc3BhY2VVUkkgPT09IHhodG1sXG4gICAgICAgID8gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKVxuICAgICAgICA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyh1cmksIG5hbWUpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdG9yRml4ZWQoZnVsbG5hbWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKGZ1bGxuYW1lLnNwYWNlLCBmdWxsbmFtZS5sb2NhbCk7XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKG5hbWUpIHtcbiAgdmFyIGZ1bGxuYW1lID0gbmFtZXNwYWNlKG5hbWUpO1xuICByZXR1cm4gKGZ1bGxuYW1lLmxvY2FsXG4gICAgICA/IGNyZWF0b3JGaXhlZFxuICAgICAgOiBjcmVhdG9ySW5oZXJpdCkoZnVsbG5hbWUpO1xufVxuIiwiZnVuY3Rpb24gbm9uZSgpIHt9XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gIHJldHVybiBzZWxlY3RvciA9PSBudWxsID8gbm9uZSA6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICB9O1xufVxuIiwiaW1wb3J0IHtTZWxlY3Rpb259IGZyb20gXCIuL2luZGV4XCI7XG5pbXBvcnQgc2VsZWN0b3IgZnJvbSBcIi4uL3NlbGVjdG9yXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHNlbGVjdCkge1xuICBpZiAodHlwZW9mIHNlbGVjdCAhPT0gXCJmdW5jdGlvblwiKSBzZWxlY3QgPSBzZWxlY3RvcihzZWxlY3QpO1xuXG4gIGZvciAodmFyIGdyb3VwcyA9IHRoaXMuX2dyb3VwcywgbSA9IGdyb3Vwcy5sZW5ndGgsIHN1Ymdyb3VwcyA9IG5ldyBBcnJheShtKSwgaiA9IDA7IGogPCBtOyArK2opIHtcbiAgICBmb3IgKHZhciBncm91cCA9IGdyb3Vwc1tqXSwgbiA9IGdyb3VwLmxlbmd0aCwgc3ViZ3JvdXAgPSBzdWJncm91cHNbal0gPSBuZXcgQXJyYXkobiksIG5vZGUsIHN1Ym5vZGUsIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBpZiAoKG5vZGUgPSBncm91cFtpXSkgJiYgKHN1Ym5vZGUgPSBzZWxlY3QuY2FsbChub2RlLCBub2RlLl9fZGF0YV9fLCBpLCBncm91cCkpKSB7XG4gICAgICAgIGlmIChcIl9fZGF0YV9fXCIgaW4gbm9kZSkgc3Vibm9kZS5fX2RhdGFfXyA9IG5vZGUuX19kYXRhX187XG4gICAgICAgIHN1Ymdyb3VwW2ldID0gc3Vibm9kZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmV3IFNlbGVjdGlvbihzdWJncm91cHMsIHRoaXMuX3BhcmVudHMpO1xufVxuIiwiZnVuY3Rpb24gZW1wdHkoKSB7XG4gIHJldHVybiBbXTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgcmV0dXJuIHNlbGVjdG9yID09IG51bGwgPyBlbXB0eSA6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICB9O1xufVxuIiwiaW1wb3J0IHtTZWxlY3Rpb259IGZyb20gXCIuL2luZGV4XCI7XG5pbXBvcnQgc2VsZWN0b3JBbGwgZnJvbSBcIi4uL3NlbGVjdG9yQWxsXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHNlbGVjdCkge1xuICBpZiAodHlwZW9mIHNlbGVjdCAhPT0gXCJmdW5jdGlvblwiKSBzZWxlY3QgPSBzZWxlY3RvckFsbChzZWxlY3QpO1xuXG4gIGZvciAodmFyIGdyb3VwcyA9IHRoaXMuX2dyb3VwcywgbSA9IGdyb3Vwcy5sZW5ndGgsIHN1Ymdyb3VwcyA9IFtdLCBwYXJlbnRzID0gW10sIGogPSAwOyBqIDwgbTsgKytqKSB7XG4gICAgZm9yICh2YXIgZ3JvdXAgPSBncm91cHNbal0sIG4gPSBncm91cC5sZW5ndGgsIG5vZGUsIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBpZiAobm9kZSA9IGdyb3VwW2ldKSB7XG4gICAgICAgIHN1Ymdyb3Vwcy5wdXNoKHNlbGVjdC5jYWxsKG5vZGUsIG5vZGUuX19kYXRhX18sIGksIGdyb3VwKSk7XG4gICAgICAgIHBhcmVudHMucHVzaChub2RlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmV3IFNlbGVjdGlvbihzdWJncm91cHMsIHBhcmVudHMpO1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLm1hdGNoZXMoc2VsZWN0b3IpO1xuICB9O1xufVxuIiwiaW1wb3J0IHtTZWxlY3Rpb259IGZyb20gXCIuL2luZGV4XCI7XG5pbXBvcnQgbWF0Y2hlciBmcm9tIFwiLi4vbWF0Y2hlclwiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihtYXRjaCkge1xuICBpZiAodHlwZW9mIG1hdGNoICE9PSBcImZ1bmN0aW9uXCIpIG1hdGNoID0gbWF0Y2hlcihtYXRjaCk7XG5cbiAgZm9yICh2YXIgZ3JvdXBzID0gdGhpcy5fZ3JvdXBzLCBtID0gZ3JvdXBzLmxlbmd0aCwgc3ViZ3JvdXBzID0gbmV3IEFycmF5KG0pLCBqID0gMDsgaiA8IG07ICsraikge1xuICAgIGZvciAodmFyIGdyb3VwID0gZ3JvdXBzW2pdLCBuID0gZ3JvdXAubGVuZ3RoLCBzdWJncm91cCA9IHN1Ymdyb3Vwc1tqXSA9IFtdLCBub2RlLCBpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgaWYgKChub2RlID0gZ3JvdXBbaV0pICYmIG1hdGNoLmNhbGwobm9kZSwgbm9kZS5fX2RhdGFfXywgaSwgZ3JvdXApKSB7XG4gICAgICAgIHN1Ymdyb3VwLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ldyBTZWxlY3Rpb24oc3ViZ3JvdXBzLCB0aGlzLl9wYXJlbnRzKTtcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHVwZGF0ZSkge1xuICByZXR1cm4gbmV3IEFycmF5KHVwZGF0ZS5sZW5ndGgpO1xufVxuIiwiaW1wb3J0IHNwYXJzZSBmcm9tIFwiLi9zcGFyc2VcIjtcbmltcG9ydCB7U2VsZWN0aW9ufSBmcm9tIFwiLi9pbmRleFwiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBTZWxlY3Rpb24odGhpcy5fZW50ZXIgfHwgdGhpcy5fZ3JvdXBzLm1hcChzcGFyc2UpLCB0aGlzLl9wYXJlbnRzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEVudGVyTm9kZShwYXJlbnQsIGRhdHVtKSB7XG4gIHRoaXMub3duZXJEb2N1bWVudCA9IHBhcmVudC5vd25lckRvY3VtZW50O1xuICB0aGlzLm5hbWVzcGFjZVVSSSA9IHBhcmVudC5uYW1lc3BhY2VVUkk7XG4gIHRoaXMuX25leHQgPSBudWxsO1xuICB0aGlzLl9wYXJlbnQgPSBwYXJlbnQ7XG4gIHRoaXMuX19kYXRhX18gPSBkYXR1bTtcbn1cblxuRW50ZXJOb2RlLnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IEVudGVyTm9kZSxcbiAgYXBwZW5kQ2hpbGQ6IGZ1bmN0aW9uKGNoaWxkKSB7IHJldHVybiB0aGlzLl9wYXJlbnQuaW5zZXJ0QmVmb3JlKGNoaWxkLCB0aGlzLl9uZXh0KTsgfSxcbiAgaW5zZXJ0QmVmb3JlOiBmdW5jdGlvbihjaGlsZCwgbmV4dCkgeyByZXR1cm4gdGhpcy5fcGFyZW50Lmluc2VydEJlZm9yZShjaGlsZCwgbmV4dCk7IH0sXG4gIHF1ZXJ5U2VsZWN0b3I6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7IHJldHVybiB0aGlzLl9wYXJlbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7IH0sXG4gIHF1ZXJ5U2VsZWN0b3JBbGw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7IHJldHVybiB0aGlzLl9wYXJlbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7IH1cbn07XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbih4KSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4geDtcbiAgfTtcbn1cbiIsImltcG9ydCB7U2VsZWN0aW9ufSBmcm9tIFwiLi9pbmRleFwiO1xuaW1wb3J0IHtFbnRlck5vZGV9IGZyb20gXCIuL2VudGVyXCI7XG5pbXBvcnQgY29uc3RhbnQgZnJvbSBcIi4uL2NvbnN0YW50XCI7XG5cbnZhciBrZXlQcmVmaXggPSBcIiRcIjsgLy8gUHJvdGVjdCBhZ2FpbnN0IGtleXMgbGlrZSDigJxfX3Byb3RvX1/igJ0uXG5cbmZ1bmN0aW9uIGJpbmRJbmRleChwYXJlbnQsIGdyb3VwLCBlbnRlciwgdXBkYXRlLCBleGl0LCBkYXRhKSB7XG4gIHZhciBpID0gMCxcbiAgICAgIG5vZGUsXG4gICAgICBncm91cExlbmd0aCA9IGdyb3VwLmxlbmd0aCxcbiAgICAgIGRhdGFMZW5ndGggPSBkYXRhLmxlbmd0aDtcblxuICAvLyBQdXQgYW55IG5vbi1udWxsIG5vZGVzIHRoYXQgZml0IGludG8gdXBkYXRlLlxuICAvLyBQdXQgYW55IG51bGwgbm9kZXMgaW50byBlbnRlci5cbiAgLy8gUHV0IGFueSByZW1haW5pbmcgZGF0YSBpbnRvIGVudGVyLlxuICBmb3IgKDsgaSA8IGRhdGFMZW5ndGg7ICsraSkge1xuICAgIGlmIChub2RlID0gZ3JvdXBbaV0pIHtcbiAgICAgIG5vZGUuX19kYXRhX18gPSBkYXRhW2ldO1xuICAgICAgdXBkYXRlW2ldID0gbm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgZW50ZXJbaV0gPSBuZXcgRW50ZXJOb2RlKHBhcmVudCwgZGF0YVtpXSk7XG4gICAgfVxuICB9XG5cbiAgLy8gUHV0IGFueSBub24tbnVsbCBub2RlcyB0aGF0IGRvbuKAmXQgZml0IGludG8gZXhpdC5cbiAgZm9yICg7IGkgPCBncm91cExlbmd0aDsgKytpKSB7XG4gICAgaWYgKG5vZGUgPSBncm91cFtpXSkge1xuICAgICAgZXhpdFtpXSA9IG5vZGU7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGJpbmRLZXkocGFyZW50LCBncm91cCwgZW50ZXIsIHVwZGF0ZSwgZXhpdCwgZGF0YSwga2V5KSB7XG4gIHZhciBpLFxuICAgICAgbm9kZSxcbiAgICAgIG5vZGVCeUtleVZhbHVlID0ge30sXG4gICAgICBncm91cExlbmd0aCA9IGdyb3VwLmxlbmd0aCxcbiAgICAgIGRhdGFMZW5ndGggPSBkYXRhLmxlbmd0aCxcbiAgICAgIGtleVZhbHVlcyA9IG5ldyBBcnJheShncm91cExlbmd0aCksXG4gICAgICBrZXlWYWx1ZTtcblxuICAvLyBDb21wdXRlIHRoZSBrZXkgZm9yIGVhY2ggbm9kZS5cbiAgLy8gSWYgbXVsdGlwbGUgbm9kZXMgaGF2ZSB0aGUgc2FtZSBrZXksIHRoZSBkdXBsaWNhdGVzIGFyZSBhZGRlZCB0byBleGl0LlxuICBmb3IgKGkgPSAwOyBpIDwgZ3JvdXBMZW5ndGg7ICsraSkge1xuICAgIGlmIChub2RlID0gZ3JvdXBbaV0pIHtcbiAgICAgIGtleVZhbHVlc1tpXSA9IGtleVZhbHVlID0ga2V5UHJlZml4ICsga2V5LmNhbGwobm9kZSwgbm9kZS5fX2RhdGFfXywgaSwgZ3JvdXApO1xuICAgICAgaWYgKGtleVZhbHVlIGluIG5vZGVCeUtleVZhbHVlKSB7XG4gICAgICAgIGV4aXRbaV0gPSBub2RlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZUJ5S2V5VmFsdWVba2V5VmFsdWVdID0gbm9kZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBDb21wdXRlIHRoZSBrZXkgZm9yIGVhY2ggZGF0dW0uXG4gIC8vIElmIHRoZXJlIGEgbm9kZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBrZXksIGpvaW4gYW5kIGFkZCBpdCB0byB1cGRhdGUuXG4gIC8vIElmIHRoZXJlIGlzIG5vdCAob3IgdGhlIGtleSBpcyBhIGR1cGxpY2F0ZSksIGFkZCBpdCB0byBlbnRlci5cbiAgZm9yIChpID0gMDsgaSA8IGRhdGFMZW5ndGg7ICsraSkge1xuICAgIGtleVZhbHVlID0ga2V5UHJlZml4ICsga2V5LmNhbGwocGFyZW50LCBkYXRhW2ldLCBpLCBkYXRhKTtcbiAgICBpZiAobm9kZSA9IG5vZGVCeUtleVZhbHVlW2tleVZhbHVlXSkge1xuICAgICAgdXBkYXRlW2ldID0gbm9kZTtcbiAgICAgIG5vZGUuX19kYXRhX18gPSBkYXRhW2ldO1xuICAgICAgbm9kZUJ5S2V5VmFsdWVba2V5VmFsdWVdID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgZW50ZXJbaV0gPSBuZXcgRW50ZXJOb2RlKHBhcmVudCwgZGF0YVtpXSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQWRkIGFueSByZW1haW5pbmcgbm9kZXMgdGhhdCB3ZXJlIG5vdCBib3VuZCB0byBkYXRhIHRvIGV4aXQuXG4gIGZvciAoaSA9IDA7IGkgPCBncm91cExlbmd0aDsgKytpKSB7XG4gICAgaWYgKChub2RlID0gZ3JvdXBbaV0pICYmIChub2RlQnlLZXlWYWx1ZVtrZXlWYWx1ZXNbaV1dID09PSBub2RlKSkge1xuICAgICAgZXhpdFtpXSA9IG5vZGU7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgaWYgKCF2YWx1ZSkge1xuICAgIGRhdGEgPSBuZXcgQXJyYXkodGhpcy5zaXplKCkpLCBqID0gLTE7XG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGQpIHsgZGF0YVsrK2pdID0gZDsgfSk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICB2YXIgYmluZCA9IGtleSA/IGJpbmRLZXkgOiBiaW5kSW5kZXgsXG4gICAgICBwYXJlbnRzID0gdGhpcy5fcGFyZW50cyxcbiAgICAgIGdyb3VwcyA9IHRoaXMuX2dyb3VwcztcblxuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcImZ1bmN0aW9uXCIpIHZhbHVlID0gY29uc3RhbnQodmFsdWUpO1xuXG4gIGZvciAodmFyIG0gPSBncm91cHMubGVuZ3RoLCB1cGRhdGUgPSBuZXcgQXJyYXkobSksIGVudGVyID0gbmV3IEFycmF5KG0pLCBleGl0ID0gbmV3IEFycmF5KG0pLCBqID0gMDsgaiA8IG07ICsraikge1xuICAgIHZhciBwYXJlbnQgPSBwYXJlbnRzW2pdLFxuICAgICAgICBncm91cCA9IGdyb3Vwc1tqXSxcbiAgICAgICAgZ3JvdXBMZW5ndGggPSBncm91cC5sZW5ndGgsXG4gICAgICAgIGRhdGEgPSB2YWx1ZS5jYWxsKHBhcmVudCwgcGFyZW50ICYmIHBhcmVudC5fX2RhdGFfXywgaiwgcGFyZW50cyksXG4gICAgICAgIGRhdGFMZW5ndGggPSBkYXRhLmxlbmd0aCxcbiAgICAgICAgZW50ZXJHcm91cCA9IGVudGVyW2pdID0gbmV3IEFycmF5KGRhdGFMZW5ndGgpLFxuICAgICAgICB1cGRhdGVHcm91cCA9IHVwZGF0ZVtqXSA9IG5ldyBBcnJheShkYXRhTGVuZ3RoKSxcbiAgICAgICAgZXhpdEdyb3VwID0gZXhpdFtqXSA9IG5ldyBBcnJheShncm91cExlbmd0aCk7XG5cbiAgICBiaW5kKHBhcmVudCwgZ3JvdXAsIGVudGVyR3JvdXAsIHVwZGF0ZUdyb3VwLCBleGl0R3JvdXAsIGRhdGEsIGtleSk7XG5cbiAgICAvLyBOb3cgY29ubmVjdCB0aGUgZW50ZXIgbm9kZXMgdG8gdGhlaXIgZm9sbG93aW5nIHVwZGF0ZSBub2RlLCBzdWNoIHRoYXRcbiAgICAvLyBhcHBlbmRDaGlsZCBjYW4gaW5zZXJ0IHRoZSBtYXRlcmlhbGl6ZWQgZW50ZXIgbm9kZSBiZWZvcmUgdGhpcyBub2RlLFxuICAgIC8vIHJhdGhlciB0aGFuIGF0IHRoZSBlbmQgb2YgdGhlIHBhcmVudCBub2RlLlxuICAgIGZvciAodmFyIGkwID0gMCwgaTEgPSAwLCBwcmV2aW91cywgbmV4dDsgaTAgPCBkYXRhTGVuZ3RoOyArK2kwKSB7XG4gICAgICBpZiAocHJldmlvdXMgPSBlbnRlckdyb3VwW2kwXSkge1xuICAgICAgICBpZiAoaTAgPj0gaTEpIGkxID0gaTAgKyAxO1xuICAgICAgICB3aGlsZSAoIShuZXh0ID0gdXBkYXRlR3JvdXBbaTFdKSAmJiArK2kxIDwgZGF0YUxlbmd0aCk7XG4gICAgICAgIHByZXZpb3VzLl9uZXh0ID0gbmV4dCB8fCBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZSA9IG5ldyBTZWxlY3Rpb24odXBkYXRlLCBwYXJlbnRzKTtcbiAgdXBkYXRlLl9lbnRlciA9IGVudGVyO1xuICB1cGRhdGUuX2V4aXQgPSBleGl0O1xuICByZXR1cm4gdXBkYXRlO1xufVxuIiwiaW1wb3J0IHNwYXJzZSBmcm9tIFwiLi9zcGFyc2VcIjtcbmltcG9ydCB7U2VsZWN0aW9ufSBmcm9tIFwiLi9pbmRleFwiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBTZWxlY3Rpb24odGhpcy5fZXhpdCB8fCB0aGlzLl9ncm91cHMubWFwKHNwYXJzZSksIHRoaXMuX3BhcmVudHMpO1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24ob25lbnRlciwgb251cGRhdGUsIG9uZXhpdCkge1xuICB2YXIgZW50ZXIgPSB0aGlzLmVudGVyKCksIHVwZGF0ZSA9IHRoaXMsIGV4aXQgPSB0aGlzLmV4aXQoKTtcbiAgZW50ZXIgPSB0eXBlb2Ygb25lbnRlciA9PT0gXCJmdW5jdGlvblwiID8gb25lbnRlcihlbnRlcikgOiBlbnRlci5hcHBlbmQob25lbnRlciArIFwiXCIpO1xuICBpZiAob251cGRhdGUgIT0gbnVsbCkgdXBkYXRlID0gb251cGRhdGUodXBkYXRlKTtcbiAgaWYgKG9uZXhpdCA9PSBudWxsKSBleGl0LnJlbW92ZSgpOyBlbHNlIG9uZXhpdChleGl0KTtcbiAgcmV0dXJuIGVudGVyICYmIHVwZGF0ZSA/IGVudGVyLm1lcmdlKHVwZGF0ZSkub3JkZXIoKSA6IHVwZGF0ZTtcbn1cbiIsImltcG9ydCB7U2VsZWN0aW9ufSBmcm9tIFwiLi9pbmRleFwiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihzZWxlY3Rpb24pIHtcblxuICBmb3IgKHZhciBncm91cHMwID0gdGhpcy5fZ3JvdXBzLCBncm91cHMxID0gc2VsZWN0aW9uLl9ncm91cHMsIG0wID0gZ3JvdXBzMC5sZW5ndGgsIG0xID0gZ3JvdXBzMS5sZW5ndGgsIG0gPSBNYXRoLm1pbihtMCwgbTEpLCBtZXJnZXMgPSBuZXcgQXJyYXkobTApLCBqID0gMDsgaiA8IG07ICsraikge1xuICAgIGZvciAodmFyIGdyb3VwMCA9IGdyb3VwczBbal0sIGdyb3VwMSA9IGdyb3VwczFbal0sIG4gPSBncm91cDAubGVuZ3RoLCBtZXJnZSA9IG1lcmdlc1tqXSA9IG5ldyBBcnJheShuKSwgbm9kZSwgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgIGlmIChub2RlID0gZ3JvdXAwW2ldIHx8IGdyb3VwMVtpXSkge1xuICAgICAgICBtZXJnZVtpXSA9IG5vZGU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZm9yICg7IGogPCBtMDsgKytqKSB7XG4gICAgbWVyZ2VzW2pdID0gZ3JvdXBzMFtqXTtcbiAgfVxuXG4gIHJldHVybiBuZXcgU2VsZWN0aW9uKG1lcmdlcywgdGhpcy5fcGFyZW50cyk7XG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpIHtcblxuICBmb3IgKHZhciBncm91cHMgPSB0aGlzLl9ncm91cHMsIGogPSAtMSwgbSA9IGdyb3Vwcy5sZW5ndGg7ICsraiA8IG07KSB7XG4gICAgZm9yICh2YXIgZ3JvdXAgPSBncm91cHNbal0sIGkgPSBncm91cC5sZW5ndGggLSAxLCBuZXh0ID0gZ3JvdXBbaV0sIG5vZGU7IC0taSA+PSAwOykge1xuICAgICAgaWYgKG5vZGUgPSBncm91cFtpXSkge1xuICAgICAgICBpZiAobmV4dCAmJiBub2RlLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKG5leHQpIF4gNCkgbmV4dC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShub2RlLCBuZXh0KTtcbiAgICAgICAgbmV4dCA9IG5vZGU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59XG4iLCJpbXBvcnQge1NlbGVjdGlvbn0gZnJvbSBcIi4vaW5kZXhcIjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oY29tcGFyZSkge1xuICBpZiAoIWNvbXBhcmUpIGNvbXBhcmUgPSBhc2NlbmRpbmc7XG5cbiAgZnVuY3Rpb24gY29tcGFyZU5vZGUoYSwgYikge1xuICAgIHJldHVybiBhICYmIGIgPyBjb21wYXJlKGEuX19kYXRhX18sIGIuX19kYXRhX18pIDogIWEgLSAhYjtcbiAgfVxuXG4gIGZvciAodmFyIGdyb3VwcyA9IHRoaXMuX2dyb3VwcywgbSA9IGdyb3Vwcy5sZW5ndGgsIHNvcnRncm91cHMgPSBuZXcgQXJyYXkobSksIGogPSAwOyBqIDwgbTsgKytqKSB7XG4gICAgZm9yICh2YXIgZ3JvdXAgPSBncm91cHNbal0sIG4gPSBncm91cC5sZW5ndGgsIHNvcnRncm91cCA9IHNvcnRncm91cHNbal0gPSBuZXcgQXJyYXkobiksIG5vZGUsIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBpZiAobm9kZSA9IGdyb3VwW2ldKSB7XG4gICAgICAgIHNvcnRncm91cFtpXSA9IG5vZGU7XG4gICAgICB9XG4gICAgfVxuICAgIHNvcnRncm91cC5zb3J0KGNvbXBhcmVOb2RlKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgU2VsZWN0aW9uKHNvcnRncm91cHMsIHRoaXMuX3BhcmVudHMpLm9yZGVyKCk7XG59XG5cbmZ1bmN0aW9uIGFzY2VuZGluZyhhLCBiKSB7XG4gIHJldHVybiBhIDwgYiA/IC0xIDogYSA+IGIgPyAxIDogYSA+PSBiID8gMCA6IE5hTjtcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCkge1xuICB2YXIgY2FsbGJhY2sgPSBhcmd1bWVudHNbMF07XG4gIGFyZ3VtZW50c1swXSA9IHRoaXM7XG4gIGNhbGxiYWNrLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gIHJldHVybiB0aGlzO1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKSB7XG4gIHZhciBub2RlcyA9IG5ldyBBcnJheSh0aGlzLnNpemUoKSksIGkgPSAtMTtcbiAgdGhpcy5lYWNoKGZ1bmN0aW9uKCkgeyBub2Rlc1srK2ldID0gdGhpczsgfSk7XG4gIHJldHVybiBub2Rlcztcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCkge1xuXG4gIGZvciAodmFyIGdyb3VwcyA9IHRoaXMuX2dyb3VwcywgaiA9IDAsIG0gPSBncm91cHMubGVuZ3RoOyBqIDwgbTsgKytqKSB7XG4gICAgZm9yICh2YXIgZ3JvdXAgPSBncm91cHNbal0sIGkgPSAwLCBuID0gZ3JvdXAubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICB2YXIgbm9kZSA9IGdyb3VwW2ldO1xuICAgICAgaWYgKG5vZGUpIHJldHVybiBub2RlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKSB7XG4gIHZhciBzaXplID0gMDtcbiAgdGhpcy5lYWNoKGZ1bmN0aW9uKCkgeyArK3NpemU7IH0pO1xuICByZXR1cm4gc2l6ZTtcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gIXRoaXMubm9kZSgpO1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oY2FsbGJhY2spIHtcblxuICBmb3IgKHZhciBncm91cHMgPSB0aGlzLl9ncm91cHMsIGogPSAwLCBtID0gZ3JvdXBzLmxlbmd0aDsgaiA8IG07ICsraikge1xuICAgIGZvciAodmFyIGdyb3VwID0gZ3JvdXBzW2pdLCBpID0gMCwgbiA9IGdyb3VwLmxlbmd0aCwgbm9kZTsgaSA8IG47ICsraSkge1xuICAgICAgaWYgKG5vZGUgPSBncm91cFtpXSkgY2FsbGJhY2suY2FsbChub2RlLCBub2RlLl9fZGF0YV9fLCBpLCBncm91cCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59XG4iLCJpbXBvcnQgbmFtZXNwYWNlIGZyb20gXCIuLi9uYW1lc3BhY2VcIjtcblxuZnVuY3Rpb24gYXR0clJlbW92ZShuYW1lKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gYXR0clJlbW92ZU5TKGZ1bGxuYW1lKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZU5TKGZ1bGxuYW1lLnNwYWNlLCBmdWxsbmFtZS5sb2NhbCk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGF0dHJDb25zdGFudChuYW1lLCB2YWx1ZSkge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBhdHRyQ29uc3RhbnROUyhmdWxsbmFtZSwgdmFsdWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2V0QXR0cmlidXRlTlMoZnVsbG5hbWUuc3BhY2UsIGZ1bGxuYW1lLmxvY2FsLCB2YWx1ZSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGF0dHJGdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHYgPSB2YWx1ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmICh2ID09IG51bGwpIHRoaXMucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgIGVsc2UgdGhpcy5zZXRBdHRyaWJ1dGUobmFtZSwgdik7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGF0dHJGdW5jdGlvbk5TKGZ1bGxuYW1lLCB2YWx1ZSkge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHYgPSB2YWx1ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmICh2ID09IG51bGwpIHRoaXMucmVtb3ZlQXR0cmlidXRlTlMoZnVsbG5hbWUuc3BhY2UsIGZ1bGxuYW1lLmxvY2FsKTtcbiAgICBlbHNlIHRoaXMuc2V0QXR0cmlidXRlTlMoZnVsbG5hbWUuc3BhY2UsIGZ1bGxuYW1lLmxvY2FsLCB2KTtcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgdmFyIGZ1bGxuYW1lID0gbmFtZXNwYWNlKG5hbWUpO1xuXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMikge1xuICAgIHZhciBub2RlID0gdGhpcy5ub2RlKCk7XG4gICAgcmV0dXJuIGZ1bGxuYW1lLmxvY2FsXG4gICAgICAgID8gbm9kZS5nZXRBdHRyaWJ1dGVOUyhmdWxsbmFtZS5zcGFjZSwgZnVsbG5hbWUubG9jYWwpXG4gICAgICAgIDogbm9kZS5nZXRBdHRyaWJ1dGUoZnVsbG5hbWUpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMuZWFjaCgodmFsdWUgPT0gbnVsbFxuICAgICAgPyAoZnVsbG5hbWUubG9jYWwgPyBhdHRyUmVtb3ZlTlMgOiBhdHRyUmVtb3ZlKSA6ICh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgPyAoZnVsbG5hbWUubG9jYWwgPyBhdHRyRnVuY3Rpb25OUyA6IGF0dHJGdW5jdGlvbilcbiAgICAgIDogKGZ1bGxuYW1lLmxvY2FsID8gYXR0ckNvbnN0YW50TlMgOiBhdHRyQ29uc3RhbnQpKSkoZnVsbG5hbWUsIHZhbHVlKSk7XG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbihub2RlKSB7XG4gIHJldHVybiAobm9kZS5vd25lckRvY3VtZW50ICYmIG5vZGUub3duZXJEb2N1bWVudC5kZWZhdWx0VmlldykgLy8gbm9kZSBpcyBhIE5vZGVcbiAgICAgIHx8IChub2RlLmRvY3VtZW50ICYmIG5vZGUpIC8vIG5vZGUgaXMgYSBXaW5kb3dcbiAgICAgIHx8IG5vZGUuZGVmYXVsdFZpZXc7IC8vIG5vZGUgaXMgYSBEb2N1bWVudFxufVxuIiwiaW1wb3J0IGRlZmF1bHRWaWV3IGZyb20gXCIuLi93aW5kb3dcIjtcblxuZnVuY3Rpb24gc3R5bGVSZW1vdmUobmFtZSkge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdHlsZS5yZW1vdmVQcm9wZXJ0eShuYW1lKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gc3R5bGVDb25zdGFudChuYW1lLCB2YWx1ZSwgcHJpb3JpdHkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3R5bGUuc2V0UHJvcGVydHkobmFtZSwgdmFsdWUsIHByaW9yaXR5KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gc3R5bGVGdW5jdGlvbihuYW1lLCB2YWx1ZSwgcHJpb3JpdHkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciB2ID0gdmFsdWUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBpZiAodiA9PSBudWxsKSB0aGlzLnN0eWxlLnJlbW92ZVByb3BlcnR5KG5hbWUpO1xuICAgIGVsc2UgdGhpcy5zdHlsZS5zZXRQcm9wZXJ0eShuYW1lLCB2LCBwcmlvcml0eSk7XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBwcmlvcml0eSkge1xuICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA+IDFcbiAgICAgID8gdGhpcy5lYWNoKCh2YWx1ZSA9PSBudWxsXG4gICAgICAgICAgICA/IHN0eWxlUmVtb3ZlIDogdHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgICAgID8gc3R5bGVGdW5jdGlvblxuICAgICAgICAgICAgOiBzdHlsZUNvbnN0YW50KShuYW1lLCB2YWx1ZSwgcHJpb3JpdHkgPT0gbnVsbCA/IFwiXCIgOiBwcmlvcml0eSkpXG4gICAgICA6IHN0eWxlVmFsdWUodGhpcy5ub2RlKCksIG5hbWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3R5bGVWYWx1ZShub2RlLCBuYW1lKSB7XG4gIHJldHVybiBub2RlLnN0eWxlLmdldFByb3BlcnR5VmFsdWUobmFtZSlcbiAgICAgIHx8IGRlZmF1bHRWaWV3KG5vZGUpLmdldENvbXB1dGVkU3R5bGUobm9kZSwgbnVsbCkuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTtcbn1cbiIsImZ1bmN0aW9uIHByb3BlcnR5UmVtb3ZlKG5hbWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIGRlbGV0ZSB0aGlzW25hbWVdO1xuICB9O1xufVxuXG5mdW5jdGlvbiBwcm9wZXJ0eUNvbnN0YW50KG5hbWUsIHZhbHVlKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB0aGlzW25hbWVdID0gdmFsdWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHByb3BlcnR5RnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciB2ID0gdmFsdWUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBpZiAodiA9PSBudWxsKSBkZWxldGUgdGhpc1tuYW1lXTtcbiAgICBlbHNlIHRoaXNbbmFtZV0gPSB2O1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA+IDFcbiAgICAgID8gdGhpcy5lYWNoKCh2YWx1ZSA9PSBudWxsXG4gICAgICAgICAgPyBwcm9wZXJ0eVJlbW92ZSA6IHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgPyBwcm9wZXJ0eUZ1bmN0aW9uXG4gICAgICAgICAgOiBwcm9wZXJ0eUNvbnN0YW50KShuYW1lLCB2YWx1ZSkpXG4gICAgICA6IHRoaXMubm9kZSgpW25hbWVdO1xufVxuIiwiZnVuY3Rpb24gY2xhc3NBcnJheShzdHJpbmcpIHtcbiAgcmV0dXJuIHN0cmluZy50cmltKCkuc3BsaXQoL158XFxzKy8pO1xufVxuXG5mdW5jdGlvbiBjbGFzc0xpc3Qobm9kZSkge1xuICByZXR1cm4gbm9kZS5jbGFzc0xpc3QgfHwgbmV3IENsYXNzTGlzdChub2RlKTtcbn1cblxuZnVuY3Rpb24gQ2xhc3NMaXN0KG5vZGUpIHtcbiAgdGhpcy5fbm9kZSA9IG5vZGU7XG4gIHRoaXMuX25hbWVzID0gY2xhc3NBcnJheShub2RlLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpIHx8IFwiXCIpO1xufVxuXG5DbGFzc0xpc3QucHJvdG90eXBlID0ge1xuICBhZGQ6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgaSA9IHRoaXMuX25hbWVzLmluZGV4T2YobmFtZSk7XG4gICAgaWYgKGkgPCAwKSB7XG4gICAgICB0aGlzLl9uYW1lcy5wdXNoKG5hbWUpO1xuICAgICAgdGhpcy5fbm9kZS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCB0aGlzLl9uYW1lcy5qb2luKFwiIFwiKSk7XG4gICAgfVxuICB9LFxuICByZW1vdmU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgaSA9IHRoaXMuX25hbWVzLmluZGV4T2YobmFtZSk7XG4gICAgaWYgKGkgPj0gMCkge1xuICAgICAgdGhpcy5fbmFtZXMuc3BsaWNlKGksIDEpO1xuICAgICAgdGhpcy5fbm9kZS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCB0aGlzLl9uYW1lcy5qb2luKFwiIFwiKSk7XG4gICAgfVxuICB9LFxuICBjb250YWluczogZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiB0aGlzLl9uYW1lcy5pbmRleE9mKG5hbWUpID49IDA7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGNsYXNzZWRBZGQobm9kZSwgbmFtZXMpIHtcbiAgdmFyIGxpc3QgPSBjbGFzc0xpc3Qobm9kZSksIGkgPSAtMSwgbiA9IG5hbWVzLmxlbmd0aDtcbiAgd2hpbGUgKCsraSA8IG4pIGxpc3QuYWRkKG5hbWVzW2ldKTtcbn1cblxuZnVuY3Rpb24gY2xhc3NlZFJlbW92ZShub2RlLCBuYW1lcykge1xuICB2YXIgbGlzdCA9IGNsYXNzTGlzdChub2RlKSwgaSA9IC0xLCBuID0gbmFtZXMubGVuZ3RoO1xuICB3aGlsZSAoKytpIDwgbikgbGlzdC5yZW1vdmUobmFtZXNbaV0pO1xufVxuXG5mdW5jdGlvbiBjbGFzc2VkVHJ1ZShuYW1lcykge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgY2xhc3NlZEFkZCh0aGlzLCBuYW1lcyk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNsYXNzZWRGYWxzZShuYW1lcykge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgY2xhc3NlZFJlbW92ZSh0aGlzLCBuYW1lcyk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNsYXNzZWRGdW5jdGlvbihuYW1lcywgdmFsdWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICh2YWx1ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpID8gY2xhc3NlZEFkZCA6IGNsYXNzZWRSZW1vdmUpKHRoaXMsIG5hbWVzKTtcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgdmFyIG5hbWVzID0gY2xhc3NBcnJheShuYW1lICsgXCJcIik7XG5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSB7XG4gICAgdmFyIGxpc3QgPSBjbGFzc0xpc3QodGhpcy5ub2RlKCkpLCBpID0gLTEsIG4gPSBuYW1lcy5sZW5ndGg7XG4gICAgd2hpbGUgKCsraSA8IG4pIGlmICghbGlzdC5jb250YWlucyhuYW1lc1tpXSkpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiB0aGlzLmVhY2goKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICA/IGNsYXNzZWRGdW5jdGlvbiA6IHZhbHVlXG4gICAgICA/IGNsYXNzZWRUcnVlXG4gICAgICA6IGNsYXNzZWRGYWxzZSkobmFtZXMsIHZhbHVlKSk7XG59XG4iLCJmdW5jdGlvbiB0ZXh0UmVtb3ZlKCkge1xuICB0aGlzLnRleHRDb250ZW50ID0gXCJcIjtcbn1cblxuZnVuY3Rpb24gdGV4dENvbnN0YW50KHZhbHVlKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnRleHRDb250ZW50ID0gdmFsdWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHRleHRGdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHYgPSB2YWx1ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIHRoaXMudGV4dENvbnRlbnQgPSB2ID09IG51bGwgPyBcIlwiIDogdjtcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGhcbiAgICAgID8gdGhpcy5lYWNoKHZhbHVlID09IG51bGxcbiAgICAgICAgICA/IHRleHRSZW1vdmUgOiAodHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgICA/IHRleHRGdW5jdGlvblxuICAgICAgICAgIDogdGV4dENvbnN0YW50KSh2YWx1ZSkpXG4gICAgICA6IHRoaXMubm9kZSgpLnRleHRDb250ZW50O1xufVxuIiwiZnVuY3Rpb24gaHRtbFJlbW92ZSgpIHtcbiAgdGhpcy5pbm5lckhUTUwgPSBcIlwiO1xufVxuXG5mdW5jdGlvbiBodG1sQ29uc3RhbnQodmFsdWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaW5uZXJIVE1MID0gdmFsdWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGh0bWxGdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHYgPSB2YWx1ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIHRoaXMuaW5uZXJIVE1MID0gdiA9PSBudWxsID8gXCJcIiA6IHY7XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiBhcmd1bWVudHMubGVuZ3RoXG4gICAgICA/IHRoaXMuZWFjaCh2YWx1ZSA9PSBudWxsXG4gICAgICAgICAgPyBodG1sUmVtb3ZlIDogKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgPyBodG1sRnVuY3Rpb25cbiAgICAgICAgICA6IGh0bWxDb25zdGFudCkodmFsdWUpKVxuICAgICAgOiB0aGlzLm5vZGUoKS5pbm5lckhUTUw7XG59XG4iLCJmdW5jdGlvbiByYWlzZSgpIHtcbiAgaWYgKHRoaXMubmV4dFNpYmxpbmcpIHRoaXMucGFyZW50Tm9kZS5hcHBlbmRDaGlsZCh0aGlzKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmVhY2gocmFpc2UpO1xufVxuIiwiZnVuY3Rpb24gbG93ZXIoKSB7XG4gIGlmICh0aGlzLnByZXZpb3VzU2libGluZykgdGhpcy5wYXJlbnROb2RlLmluc2VydEJlZm9yZSh0aGlzLCB0aGlzLnBhcmVudE5vZGUuZmlyc3RDaGlsZCk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5lYWNoKGxvd2VyKTtcbn1cbiIsImltcG9ydCBjcmVhdG9yIGZyb20gXCIuLi9jcmVhdG9yXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKG5hbWUpIHtcbiAgdmFyIGNyZWF0ZSA9IHR5cGVvZiBuYW1lID09PSBcImZ1bmN0aW9uXCIgPyBuYW1lIDogY3JlYXRvcihuYW1lKTtcbiAgcmV0dXJuIHRoaXMuc2VsZWN0KGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmFwcGVuZENoaWxkKGNyZWF0ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgfSk7XG59XG4iLCJpbXBvcnQgY3JlYXRvciBmcm9tIFwiLi4vY3JlYXRvclwiO1xuaW1wb3J0IHNlbGVjdG9yIGZyb20gXCIuLi9zZWxlY3RvclwiO1xuXG5mdW5jdGlvbiBjb25zdGFudE51bGwoKSB7XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihuYW1lLCBiZWZvcmUpIHtcbiAgdmFyIGNyZWF0ZSA9IHR5cGVvZiBuYW1lID09PSBcImZ1bmN0aW9uXCIgPyBuYW1lIDogY3JlYXRvcihuYW1lKSxcbiAgICAgIHNlbGVjdCA9IGJlZm9yZSA9PSBudWxsID8gY29uc3RhbnROdWxsIDogdHlwZW9mIGJlZm9yZSA9PT0gXCJmdW5jdGlvblwiID8gYmVmb3JlIDogc2VsZWN0b3IoYmVmb3JlKTtcbiAgcmV0dXJuIHRoaXMuc2VsZWN0KGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmluc2VydEJlZm9yZShjcmVhdGUuYXBwbHkodGhpcywgYXJndW1lbnRzKSwgc2VsZWN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgfHwgbnVsbCk7XG4gIH0pO1xufVxuIiwiZnVuY3Rpb24gcmVtb3ZlKCkge1xuICB2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlO1xuICBpZiAocGFyZW50KSBwYXJlbnQucmVtb3ZlQ2hpbGQodGhpcyk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5lYWNoKHJlbW92ZSk7XG59XG4iLCJmdW5jdGlvbiBzZWxlY3Rpb25fY2xvbmVTaGFsbG93KCkge1xuICB2YXIgY2xvbmUgPSB0aGlzLmNsb25lTm9kZShmYWxzZSksIHBhcmVudCA9IHRoaXMucGFyZW50Tm9kZTtcbiAgcmV0dXJuIHBhcmVudCA/IHBhcmVudC5pbnNlcnRCZWZvcmUoY2xvbmUsIHRoaXMubmV4dFNpYmxpbmcpIDogY2xvbmU7XG59XG5cbmZ1bmN0aW9uIHNlbGVjdGlvbl9jbG9uZURlZXAoKSB7XG4gIHZhciBjbG9uZSA9IHRoaXMuY2xvbmVOb2RlKHRydWUpLCBwYXJlbnQgPSB0aGlzLnBhcmVudE5vZGU7XG4gIHJldHVybiBwYXJlbnQgPyBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNsb25lLCB0aGlzLm5leHRTaWJsaW5nKSA6IGNsb25lO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihkZWVwKSB7XG4gIHJldHVybiB0aGlzLnNlbGVjdChkZWVwID8gc2VsZWN0aW9uX2Nsb25lRGVlcCA6IHNlbGVjdGlvbl9jbG9uZVNoYWxsb3cpO1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGhcbiAgICAgID8gdGhpcy5wcm9wZXJ0eShcIl9fZGF0YV9fXCIsIHZhbHVlKVxuICAgICAgOiB0aGlzLm5vZGUoKS5fX2RhdGFfXztcbn1cbiIsInZhciBmaWx0ZXJFdmVudHMgPSB7fTtcblxuZXhwb3J0IHZhciBldmVudCA9IG51bGw7XG5cbmlmICh0eXBlb2YgZG9jdW1lbnQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gIGlmICghKFwib25tb3VzZWVudGVyXCIgaW4gZWxlbWVudCkpIHtcbiAgICBmaWx0ZXJFdmVudHMgPSB7bW91c2VlbnRlcjogXCJtb3VzZW92ZXJcIiwgbW91c2VsZWF2ZTogXCJtb3VzZW91dFwifTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaWx0ZXJDb250ZXh0TGlzdGVuZXIobGlzdGVuZXIsIGluZGV4LCBncm91cCkge1xuICBsaXN0ZW5lciA9IGNvbnRleHRMaXN0ZW5lcihsaXN0ZW5lciwgaW5kZXgsIGdyb3VwKTtcbiAgcmV0dXJuIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIHJlbGF0ZWQgPSBldmVudC5yZWxhdGVkVGFyZ2V0O1xuICAgIGlmICghcmVsYXRlZCB8fCAocmVsYXRlZCAhPT0gdGhpcyAmJiAhKHJlbGF0ZWQuY29tcGFyZURvY3VtZW50UG9zaXRpb24odGhpcykgJiA4KSkpIHtcbiAgICAgIGxpc3RlbmVyLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udGV4dExpc3RlbmVyKGxpc3RlbmVyLCBpbmRleCwgZ3JvdXApIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGV2ZW50MSkge1xuICAgIHZhciBldmVudDAgPSBldmVudDsgLy8gRXZlbnRzIGNhbiBiZSByZWVudHJhbnQgKGUuZy4sIGZvY3VzKS5cbiAgICBldmVudCA9IGV2ZW50MTtcbiAgICB0cnkge1xuICAgICAgbGlzdGVuZXIuY2FsbCh0aGlzLCB0aGlzLl9fZGF0YV9fLCBpbmRleCwgZ3JvdXApO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBldmVudCA9IGV2ZW50MDtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHBhcnNlVHlwZW5hbWVzKHR5cGVuYW1lcykge1xuICByZXR1cm4gdHlwZW5hbWVzLnRyaW0oKS5zcGxpdCgvXnxcXHMrLykubWFwKGZ1bmN0aW9uKHQpIHtcbiAgICB2YXIgbmFtZSA9IFwiXCIsIGkgPSB0LmluZGV4T2YoXCIuXCIpO1xuICAgIGlmIChpID49IDApIG5hbWUgPSB0LnNsaWNlKGkgKyAxKSwgdCA9IHQuc2xpY2UoMCwgaSk7XG4gICAgcmV0dXJuIHt0eXBlOiB0LCBuYW1lOiBuYW1lfTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG9uUmVtb3ZlKHR5cGVuYW1lKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgb24gPSB0aGlzLl9fb247XG4gICAgaWYgKCFvbikgcmV0dXJuO1xuICAgIGZvciAodmFyIGogPSAwLCBpID0gLTEsIG0gPSBvbi5sZW5ndGgsIG87IGogPCBtOyArK2opIHtcbiAgICAgIGlmIChvID0gb25bal0sICghdHlwZW5hbWUudHlwZSB8fCBvLnR5cGUgPT09IHR5cGVuYW1lLnR5cGUpICYmIG8ubmFtZSA9PT0gdHlwZW5hbWUubmFtZSkge1xuICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoby50eXBlLCBvLmxpc3RlbmVyLCBvLmNhcHR1cmUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb25bKytpXSA9IG87XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgrK2kpIG9uLmxlbmd0aCA9IGk7XG4gICAgZWxzZSBkZWxldGUgdGhpcy5fX29uO1xuICB9O1xufVxuXG5mdW5jdGlvbiBvbkFkZCh0eXBlbmFtZSwgdmFsdWUsIGNhcHR1cmUpIHtcbiAgdmFyIHdyYXAgPSBmaWx0ZXJFdmVudHMuaGFzT3duUHJvcGVydHkodHlwZW5hbWUudHlwZSkgPyBmaWx0ZXJDb250ZXh0TGlzdGVuZXIgOiBjb250ZXh0TGlzdGVuZXI7XG4gIHJldHVybiBmdW5jdGlvbihkLCBpLCBncm91cCkge1xuICAgIHZhciBvbiA9IHRoaXMuX19vbiwgbywgbGlzdGVuZXIgPSB3cmFwKHZhbHVlLCBpLCBncm91cCk7XG4gICAgaWYgKG9uKSBmb3IgKHZhciBqID0gMCwgbSA9IG9uLmxlbmd0aDsgaiA8IG07ICsraikge1xuICAgICAgaWYgKChvID0gb25bal0pLnR5cGUgPT09IHR5cGVuYW1lLnR5cGUgJiYgby5uYW1lID09PSB0eXBlbmFtZS5uYW1lKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihvLnR5cGUsIG8ubGlzdGVuZXIsIG8uY2FwdHVyZSk7XG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihvLnR5cGUsIG8ubGlzdGVuZXIgPSBsaXN0ZW5lciwgby5jYXB0dXJlID0gY2FwdHVyZSk7XG4gICAgICAgIG8udmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodHlwZW5hbWUudHlwZSwgbGlzdGVuZXIsIGNhcHR1cmUpO1xuICAgIG8gPSB7dHlwZTogdHlwZW5hbWUudHlwZSwgbmFtZTogdHlwZW5hbWUubmFtZSwgdmFsdWU6IHZhbHVlLCBsaXN0ZW5lcjogbGlzdGVuZXIsIGNhcHR1cmU6IGNhcHR1cmV9O1xuICAgIGlmICghb24pIHRoaXMuX19vbiA9IFtvXTtcbiAgICBlbHNlIG9uLnB1c2gobyk7XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHR5cGVuYW1lLCB2YWx1ZSwgY2FwdHVyZSkge1xuICB2YXIgdHlwZW5hbWVzID0gcGFyc2VUeXBlbmFtZXModHlwZW5hbWUgKyBcIlwiKSwgaSwgbiA9IHR5cGVuYW1lcy5sZW5ndGgsIHQ7XG5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSB7XG4gICAgdmFyIG9uID0gdGhpcy5ub2RlKCkuX19vbjtcbiAgICBpZiAob24pIGZvciAodmFyIGogPSAwLCBtID0gb24ubGVuZ3RoLCBvOyBqIDwgbTsgKytqKSB7XG4gICAgICBmb3IgKGkgPSAwLCBvID0gb25bal07IGkgPCBuOyArK2kpIHtcbiAgICAgICAgaWYgKCh0ID0gdHlwZW5hbWVzW2ldKS50eXBlID09PSBvLnR5cGUgJiYgdC5uYW1lID09PSBvLm5hbWUpIHtcbiAgICAgICAgICByZXR1cm4gby52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm47XG4gIH1cblxuICBvbiA9IHZhbHVlID8gb25BZGQgOiBvblJlbW92ZTtcbiAgaWYgKGNhcHR1cmUgPT0gbnVsbCkgY2FwdHVyZSA9IGZhbHNlO1xuICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB0aGlzLmVhY2gob24odHlwZW5hbWVzW2ldLCB2YWx1ZSwgY2FwdHVyZSkpO1xuICByZXR1cm4gdGhpcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGN1c3RvbUV2ZW50KGV2ZW50MSwgbGlzdGVuZXIsIHRoYXQsIGFyZ3MpIHtcbiAgdmFyIGV2ZW50MCA9IGV2ZW50O1xuICBldmVudDEuc291cmNlRXZlbnQgPSBldmVudDtcbiAgZXZlbnQgPSBldmVudDE7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGxpc3RlbmVyLmFwcGx5KHRoYXQsIGFyZ3MpO1xuICB9IGZpbmFsbHkge1xuICAgIGV2ZW50ID0gZXZlbnQwO1xuICB9XG59XG4iLCJpbXBvcnQgZGVmYXVsdFZpZXcgZnJvbSBcIi4uL3dpbmRvd1wiO1xuXG5mdW5jdGlvbiBkaXNwYXRjaEV2ZW50KG5vZGUsIHR5cGUsIHBhcmFtcykge1xuICB2YXIgd2luZG93ID0gZGVmYXVsdFZpZXcobm9kZSksXG4gICAgICBldmVudCA9IHdpbmRvdy5DdXN0b21FdmVudDtcblxuICBpZiAodHlwZW9mIGV2ZW50ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBldmVudCA9IG5ldyBldmVudCh0eXBlLCBwYXJhbXMpO1xuICB9IGVsc2Uge1xuICAgIGV2ZW50ID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiRXZlbnRcIik7XG4gICAgaWYgKHBhcmFtcykgZXZlbnQuaW5pdEV2ZW50KHR5cGUsIHBhcmFtcy5idWJibGVzLCBwYXJhbXMuY2FuY2VsYWJsZSksIGV2ZW50LmRldGFpbCA9IHBhcmFtcy5kZXRhaWw7XG4gICAgZWxzZSBldmVudC5pbml0RXZlbnQodHlwZSwgZmFsc2UsIGZhbHNlKTtcbiAgfVxuXG4gIG5vZGUuZGlzcGF0Y2hFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIGRpc3BhdGNoQ29uc3RhbnQodHlwZSwgcGFyYW1zKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZGlzcGF0Y2hFdmVudCh0aGlzLCB0eXBlLCBwYXJhbXMpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBkaXNwYXRjaEZ1bmN0aW9uKHR5cGUsIHBhcmFtcykge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGRpc3BhdGNoRXZlbnQodGhpcywgdHlwZSwgcGFyYW1zLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbih0eXBlLCBwYXJhbXMpIHtcbiAgcmV0dXJuIHRoaXMuZWFjaCgodHlwZW9mIHBhcmFtcyA9PT0gXCJmdW5jdGlvblwiXG4gICAgICA/IGRpc3BhdGNoRnVuY3Rpb25cbiAgICAgIDogZGlzcGF0Y2hDb25zdGFudCkodHlwZSwgcGFyYW1zKSk7XG59XG4iLCJpbXBvcnQgc2VsZWN0aW9uX3NlbGVjdCBmcm9tIFwiLi9zZWxlY3RcIjtcbmltcG9ydCBzZWxlY3Rpb25fc2VsZWN0QWxsIGZyb20gXCIuL3NlbGVjdEFsbFwiO1xuaW1wb3J0IHNlbGVjdGlvbl9maWx0ZXIgZnJvbSBcIi4vZmlsdGVyXCI7XG5pbXBvcnQgc2VsZWN0aW9uX2RhdGEgZnJvbSBcIi4vZGF0YVwiO1xuaW1wb3J0IHNlbGVjdGlvbl9lbnRlciBmcm9tIFwiLi9lbnRlclwiO1xuaW1wb3J0IHNlbGVjdGlvbl9leGl0IGZyb20gXCIuL2V4aXRcIjtcbmltcG9ydCBzZWxlY3Rpb25fam9pbiBmcm9tIFwiLi9qb2luXCI7XG5pbXBvcnQgc2VsZWN0aW9uX21lcmdlIGZyb20gXCIuL21lcmdlXCI7XG5pbXBvcnQgc2VsZWN0aW9uX29yZGVyIGZyb20gXCIuL29yZGVyXCI7XG5pbXBvcnQgc2VsZWN0aW9uX3NvcnQgZnJvbSBcIi4vc29ydFwiO1xuaW1wb3J0IHNlbGVjdGlvbl9jYWxsIGZyb20gXCIuL2NhbGxcIjtcbmltcG9ydCBzZWxlY3Rpb25fbm9kZXMgZnJvbSBcIi4vbm9kZXNcIjtcbmltcG9ydCBzZWxlY3Rpb25fbm9kZSBmcm9tIFwiLi9ub2RlXCI7XG5pbXBvcnQgc2VsZWN0aW9uX3NpemUgZnJvbSBcIi4vc2l6ZVwiO1xuaW1wb3J0IHNlbGVjdGlvbl9lbXB0eSBmcm9tIFwiLi9lbXB0eVwiO1xuaW1wb3J0IHNlbGVjdGlvbl9lYWNoIGZyb20gXCIuL2VhY2hcIjtcbmltcG9ydCBzZWxlY3Rpb25fYXR0ciBmcm9tIFwiLi9hdHRyXCI7XG5pbXBvcnQgc2VsZWN0aW9uX3N0eWxlIGZyb20gXCIuL3N0eWxlXCI7XG5pbXBvcnQgc2VsZWN0aW9uX3Byb3BlcnR5IGZyb20gXCIuL3Byb3BlcnR5XCI7XG5pbXBvcnQgc2VsZWN0aW9uX2NsYXNzZWQgZnJvbSBcIi4vY2xhc3NlZFwiO1xuaW1wb3J0IHNlbGVjdGlvbl90ZXh0IGZyb20gXCIuL3RleHRcIjtcbmltcG9ydCBzZWxlY3Rpb25faHRtbCBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgc2VsZWN0aW9uX3JhaXNlIGZyb20gXCIuL3JhaXNlXCI7XG5pbXBvcnQgc2VsZWN0aW9uX2xvd2VyIGZyb20gXCIuL2xvd2VyXCI7XG5pbXBvcnQgc2VsZWN0aW9uX2FwcGVuZCBmcm9tIFwiLi9hcHBlbmRcIjtcbmltcG9ydCBzZWxlY3Rpb25faW5zZXJ0IGZyb20gXCIuL2luc2VydFwiO1xuaW1wb3J0IHNlbGVjdGlvbl9yZW1vdmUgZnJvbSBcIi4vcmVtb3ZlXCI7XG5pbXBvcnQgc2VsZWN0aW9uX2Nsb25lIGZyb20gXCIuL2Nsb25lXCI7XG5pbXBvcnQgc2VsZWN0aW9uX2RhdHVtIGZyb20gXCIuL2RhdHVtXCI7XG5pbXBvcnQgc2VsZWN0aW9uX29uIGZyb20gXCIuL29uXCI7XG5pbXBvcnQgc2VsZWN0aW9uX2Rpc3BhdGNoIGZyb20gXCIuL2Rpc3BhdGNoXCI7XG5cbmV4cG9ydCB2YXIgcm9vdCA9IFtudWxsXTtcblxuZXhwb3J0IGZ1bmN0aW9uIFNlbGVjdGlvbihncm91cHMsIHBhcmVudHMpIHtcbiAgdGhpcy5fZ3JvdXBzID0gZ3JvdXBzO1xuICB0aGlzLl9wYXJlbnRzID0gcGFyZW50cztcbn1cblxuZnVuY3Rpb24gc2VsZWN0aW9uKCkge1xuICByZXR1cm4gbmV3IFNlbGVjdGlvbihbW2RvY3VtZW50LmRvY3VtZW50RWxlbWVudF1dLCByb290KTtcbn1cblxuU2VsZWN0aW9uLnByb3RvdHlwZSA9IHNlbGVjdGlvbi5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBTZWxlY3Rpb24sXG4gIHNlbGVjdDogc2VsZWN0aW9uX3NlbGVjdCxcbiAgc2VsZWN0QWxsOiBzZWxlY3Rpb25fc2VsZWN0QWxsLFxuICBmaWx0ZXI6IHNlbGVjdGlvbl9maWx0ZXIsXG4gIGRhdGE6IHNlbGVjdGlvbl9kYXRhLFxuICBlbnRlcjogc2VsZWN0aW9uX2VudGVyLFxuICBleGl0OiBzZWxlY3Rpb25fZXhpdCxcbiAgam9pbjogc2VsZWN0aW9uX2pvaW4sXG4gIG1lcmdlOiBzZWxlY3Rpb25fbWVyZ2UsXG4gIG9yZGVyOiBzZWxlY3Rpb25fb3JkZXIsXG4gIHNvcnQ6IHNlbGVjdGlvbl9zb3J0LFxuICBjYWxsOiBzZWxlY3Rpb25fY2FsbCxcbiAgbm9kZXM6IHNlbGVjdGlvbl9ub2RlcyxcbiAgbm9kZTogc2VsZWN0aW9uX25vZGUsXG4gIHNpemU6IHNlbGVjdGlvbl9zaXplLFxuICBlbXB0eTogc2VsZWN0aW9uX2VtcHR5LFxuICBlYWNoOiBzZWxlY3Rpb25fZWFjaCxcbiAgYXR0cjogc2VsZWN0aW9uX2F0dHIsXG4gIHN0eWxlOiBzZWxlY3Rpb25fc3R5bGUsXG4gIHByb3BlcnR5OiBzZWxlY3Rpb25fcHJvcGVydHksXG4gIGNsYXNzZWQ6IHNlbGVjdGlvbl9jbGFzc2VkLFxuICB0ZXh0OiBzZWxlY3Rpb25fdGV4dCxcbiAgaHRtbDogc2VsZWN0aW9uX2h0bWwsXG4gIHJhaXNlOiBzZWxlY3Rpb25fcmFpc2UsXG4gIGxvd2VyOiBzZWxlY3Rpb25fbG93ZXIsXG4gIGFwcGVuZDogc2VsZWN0aW9uX2FwcGVuZCxcbiAgaW5zZXJ0OiBzZWxlY3Rpb25faW5zZXJ0LFxuICByZW1vdmU6IHNlbGVjdGlvbl9yZW1vdmUsXG4gIGNsb25lOiBzZWxlY3Rpb25fY2xvbmUsXG4gIGRhdHVtOiBzZWxlY3Rpb25fZGF0dW0sXG4gIG9uOiBzZWxlY3Rpb25fb24sXG4gIGRpc3BhdGNoOiBzZWxlY3Rpb25fZGlzcGF0Y2hcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHNlbGVjdGlvbjtcbiIsImltcG9ydCB7U2VsZWN0aW9uLCByb290fSBmcm9tIFwiLi9zZWxlY3Rpb24vaW5kZXhcIjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgcmV0dXJuIHR5cGVvZiBzZWxlY3RvciA9PT0gXCJzdHJpbmdcIlxuICAgICAgPyBuZXcgU2VsZWN0aW9uKFtbZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcildXSwgW2RvY3VtZW50LmRvY3VtZW50RWxlbWVudF0pXG4gICAgICA6IG5ldyBTZWxlY3Rpb24oW1tzZWxlY3Rvcl1dLCByb290KTtcbn1cbiIsImltcG9ydCB7U2VsZWN0aW9uLCByb290fSBmcm9tIFwiLi9zZWxlY3Rpb24vaW5kZXhcIjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgcmV0dXJuIHR5cGVvZiBzZWxlY3RvciA9PT0gXCJzdHJpbmdcIlxuICAgICAgPyBuZXcgU2VsZWN0aW9uKFtkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKV0sIFtkb2N1bWVudC5kb2N1bWVudEVsZW1lbnRdKVxuICAgICAgOiBuZXcgU2VsZWN0aW9uKFtzZWxlY3RvciA9PSBudWxsID8gW10gOiBzZWxlY3Rvcl0sIHJvb3QpO1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oY29uc3RydWN0b3IsIGZhY3RvcnksIHByb3RvdHlwZSkge1xuICBjb25zdHJ1Y3Rvci5wcm90b3R5cGUgPSBmYWN0b3J5LnByb3RvdHlwZSA9IHByb3RvdHlwZTtcbiAgcHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY29uc3RydWN0b3I7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRlbmQocGFyZW50LCBkZWZpbml0aW9uKSB7XG4gIHZhciBwcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHBhcmVudC5wcm90b3R5cGUpO1xuICBmb3IgKHZhciBrZXkgaW4gZGVmaW5pdGlvbikgcHJvdG90eXBlW2tleV0gPSBkZWZpbml0aW9uW2tleV07XG4gIHJldHVybiBwcm90b3R5cGU7XG59XG4iLCJpbXBvcnQgZGVmaW5lLCB7ZXh0ZW5kfSBmcm9tIFwiLi9kZWZpbmUuanNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIENvbG9yKCkge31cblxuZXhwb3J0IHZhciBkYXJrZXIgPSAwLjc7XG5leHBvcnQgdmFyIGJyaWdodGVyID0gMSAvIGRhcmtlcjtcblxudmFyIHJlSSA9IFwiXFxcXHMqKFsrLV0/XFxcXGQrKVxcXFxzKlwiLFxuICAgIHJlTiA9IFwiXFxcXHMqKFsrLV0/XFxcXGQqXFxcXC4/XFxcXGQrKD86W2VFXVsrLV0/XFxcXGQrKT8pXFxcXHMqXCIsXG4gICAgcmVQID0gXCJcXFxccyooWystXT9cXFxcZCpcXFxcLj9cXFxcZCsoPzpbZUVdWystXT9cXFxcZCspPyklXFxcXHMqXCIsXG4gICAgcmVIZXggPSAvXiMoWzAtOWEtZl17Myw4fSkkLyxcbiAgICByZVJnYkludGVnZXIgPSBuZXcgUmVnRXhwKFwiXnJnYlxcXFwoXCIgKyBbcmVJLCByZUksIHJlSV0gKyBcIlxcXFwpJFwiKSxcbiAgICByZVJnYlBlcmNlbnQgPSBuZXcgUmVnRXhwKFwiXnJnYlxcXFwoXCIgKyBbcmVQLCByZVAsIHJlUF0gKyBcIlxcXFwpJFwiKSxcbiAgICByZVJnYmFJbnRlZ2VyID0gbmV3IFJlZ0V4cChcIl5yZ2JhXFxcXChcIiArIFtyZUksIHJlSSwgcmVJLCByZU5dICsgXCJcXFxcKSRcIiksXG4gICAgcmVSZ2JhUGVyY2VudCA9IG5ldyBSZWdFeHAoXCJecmdiYVxcXFwoXCIgKyBbcmVQLCByZVAsIHJlUCwgcmVOXSArIFwiXFxcXCkkXCIpLFxuICAgIHJlSHNsUGVyY2VudCA9IG5ldyBSZWdFeHAoXCJeaHNsXFxcXChcIiArIFtyZU4sIHJlUCwgcmVQXSArIFwiXFxcXCkkXCIpLFxuICAgIHJlSHNsYVBlcmNlbnQgPSBuZXcgUmVnRXhwKFwiXmhzbGFcXFxcKFwiICsgW3JlTiwgcmVQLCByZVAsIHJlTl0gKyBcIlxcXFwpJFwiKTtcblxudmFyIG5hbWVkID0ge1xuICBhbGljZWJsdWU6IDB4ZjBmOGZmLFxuICBhbnRpcXVld2hpdGU6IDB4ZmFlYmQ3LFxuICBhcXVhOiAweDAwZmZmZixcbiAgYXF1YW1hcmluZTogMHg3ZmZmZDQsXG4gIGF6dXJlOiAweGYwZmZmZixcbiAgYmVpZ2U6IDB4ZjVmNWRjLFxuICBiaXNxdWU6IDB4ZmZlNGM0LFxuICBibGFjazogMHgwMDAwMDAsXG4gIGJsYW5jaGVkYWxtb25kOiAweGZmZWJjZCxcbiAgYmx1ZTogMHgwMDAwZmYsXG4gIGJsdWV2aW9sZXQ6IDB4OGEyYmUyLFxuICBicm93bjogMHhhNTJhMmEsXG4gIGJ1cmx5d29vZDogMHhkZWI4ODcsXG4gIGNhZGV0Ymx1ZTogMHg1ZjllYTAsXG4gIGNoYXJ0cmV1c2U6IDB4N2ZmZjAwLFxuICBjaG9jb2xhdGU6IDB4ZDI2OTFlLFxuICBjb3JhbDogMHhmZjdmNTAsXG4gIGNvcm5mbG93ZXJibHVlOiAweDY0OTVlZCxcbiAgY29ybnNpbGs6IDB4ZmZmOGRjLFxuICBjcmltc29uOiAweGRjMTQzYyxcbiAgY3lhbjogMHgwMGZmZmYsXG4gIGRhcmtibHVlOiAweDAwMDA4YixcbiAgZGFya2N5YW46IDB4MDA4YjhiLFxuICBkYXJrZ29sZGVucm9kOiAweGI4ODYwYixcbiAgZGFya2dyYXk6IDB4YTlhOWE5LFxuICBkYXJrZ3JlZW46IDB4MDA2NDAwLFxuICBkYXJrZ3JleTogMHhhOWE5YTksXG4gIGRhcmtraGFraTogMHhiZGI3NmIsXG4gIGRhcmttYWdlbnRhOiAweDhiMDA4YixcbiAgZGFya29saXZlZ3JlZW46IDB4NTU2YjJmLFxuICBkYXJrb3JhbmdlOiAweGZmOGMwMCxcbiAgZGFya29yY2hpZDogMHg5OTMyY2MsXG4gIGRhcmtyZWQ6IDB4OGIwMDAwLFxuICBkYXJrc2FsbW9uOiAweGU5OTY3YSxcbiAgZGFya3NlYWdyZWVuOiAweDhmYmM4ZixcbiAgZGFya3NsYXRlYmx1ZTogMHg0ODNkOGIsXG4gIGRhcmtzbGF0ZWdyYXk6IDB4MmY0ZjRmLFxuICBkYXJrc2xhdGVncmV5OiAweDJmNGY0ZixcbiAgZGFya3R1cnF1b2lzZTogMHgwMGNlZDEsXG4gIGRhcmt2aW9sZXQ6IDB4OTQwMGQzLFxuICBkZWVwcGluazogMHhmZjE0OTMsXG4gIGRlZXBza3libHVlOiAweDAwYmZmZixcbiAgZGltZ3JheTogMHg2OTY5NjksXG4gIGRpbWdyZXk6IDB4Njk2OTY5LFxuICBkb2RnZXJibHVlOiAweDFlOTBmZixcbiAgZmlyZWJyaWNrOiAweGIyMjIyMixcbiAgZmxvcmFsd2hpdGU6IDB4ZmZmYWYwLFxuICBmb3Jlc3RncmVlbjogMHgyMjhiMjIsXG4gIGZ1Y2hzaWE6IDB4ZmYwMGZmLFxuICBnYWluc2Jvcm86IDB4ZGNkY2RjLFxuICBnaG9zdHdoaXRlOiAweGY4ZjhmZixcbiAgZ29sZDogMHhmZmQ3MDAsXG4gIGdvbGRlbnJvZDogMHhkYWE1MjAsXG4gIGdyYXk6IDB4ODA4MDgwLFxuICBncmVlbjogMHgwMDgwMDAsXG4gIGdyZWVueWVsbG93OiAweGFkZmYyZixcbiAgZ3JleTogMHg4MDgwODAsXG4gIGhvbmV5ZGV3OiAweGYwZmZmMCxcbiAgaG90cGluazogMHhmZjY5YjQsXG4gIGluZGlhbnJlZDogMHhjZDVjNWMsXG4gIGluZGlnbzogMHg0YjAwODIsXG4gIGl2b3J5OiAweGZmZmZmMCxcbiAga2hha2k6IDB4ZjBlNjhjLFxuICBsYXZlbmRlcjogMHhlNmU2ZmEsXG4gIGxhdmVuZGVyYmx1c2g6IDB4ZmZmMGY1LFxuICBsYXduZ3JlZW46IDB4N2NmYzAwLFxuICBsZW1vbmNoaWZmb246IDB4ZmZmYWNkLFxuICBsaWdodGJsdWU6IDB4YWRkOGU2LFxuICBsaWdodGNvcmFsOiAweGYwODA4MCxcbiAgbGlnaHRjeWFuOiAweGUwZmZmZixcbiAgbGlnaHRnb2xkZW5yb2R5ZWxsb3c6IDB4ZmFmYWQyLFxuICBsaWdodGdyYXk6IDB4ZDNkM2QzLFxuICBsaWdodGdyZWVuOiAweDkwZWU5MCxcbiAgbGlnaHRncmV5OiAweGQzZDNkMyxcbiAgbGlnaHRwaW5rOiAweGZmYjZjMSxcbiAgbGlnaHRzYWxtb246IDB4ZmZhMDdhLFxuICBsaWdodHNlYWdyZWVuOiAweDIwYjJhYSxcbiAgbGlnaHRza3libHVlOiAweDg3Y2VmYSxcbiAgbGlnaHRzbGF0ZWdyYXk6IDB4Nzc4ODk5LFxuICBsaWdodHNsYXRlZ3JleTogMHg3Nzg4OTksXG4gIGxpZ2h0c3RlZWxibHVlOiAweGIwYzRkZSxcbiAgbGlnaHR5ZWxsb3c6IDB4ZmZmZmUwLFxuICBsaW1lOiAweDAwZmYwMCxcbiAgbGltZWdyZWVuOiAweDMyY2QzMixcbiAgbGluZW46IDB4ZmFmMGU2LFxuICBtYWdlbnRhOiAweGZmMDBmZixcbiAgbWFyb29uOiAweDgwMDAwMCxcbiAgbWVkaXVtYXF1YW1hcmluZTogMHg2NmNkYWEsXG4gIG1lZGl1bWJsdWU6IDB4MDAwMGNkLFxuICBtZWRpdW1vcmNoaWQ6IDB4YmE1NWQzLFxuICBtZWRpdW1wdXJwbGU6IDB4OTM3MGRiLFxuICBtZWRpdW1zZWFncmVlbjogMHgzY2IzNzEsXG4gIG1lZGl1bXNsYXRlYmx1ZTogMHg3YjY4ZWUsXG4gIG1lZGl1bXNwcmluZ2dyZWVuOiAweDAwZmE5YSxcbiAgbWVkaXVtdHVycXVvaXNlOiAweDQ4ZDFjYyxcbiAgbWVkaXVtdmlvbGV0cmVkOiAweGM3MTU4NSxcbiAgbWlkbmlnaHRibHVlOiAweDE5MTk3MCxcbiAgbWludGNyZWFtOiAweGY1ZmZmYSxcbiAgbWlzdHlyb3NlOiAweGZmZTRlMSxcbiAgbW9jY2FzaW46IDB4ZmZlNGI1LFxuICBuYXZham93aGl0ZTogMHhmZmRlYWQsXG4gIG5hdnk6IDB4MDAwMDgwLFxuICBvbGRsYWNlOiAweGZkZjVlNixcbiAgb2xpdmU6IDB4ODA4MDAwLFxuICBvbGl2ZWRyYWI6IDB4NmI4ZTIzLFxuICBvcmFuZ2U6IDB4ZmZhNTAwLFxuICBvcmFuZ2VyZWQ6IDB4ZmY0NTAwLFxuICBvcmNoaWQ6IDB4ZGE3MGQ2LFxuICBwYWxlZ29sZGVucm9kOiAweGVlZThhYSxcbiAgcGFsZWdyZWVuOiAweDk4ZmI5OCxcbiAgcGFsZXR1cnF1b2lzZTogMHhhZmVlZWUsXG4gIHBhbGV2aW9sZXRyZWQ6IDB4ZGI3MDkzLFxuICBwYXBheWF3aGlwOiAweGZmZWZkNSxcbiAgcGVhY2hwdWZmOiAweGZmZGFiOSxcbiAgcGVydTogMHhjZDg1M2YsXG4gIHBpbms6IDB4ZmZjMGNiLFxuICBwbHVtOiAweGRkYTBkZCxcbiAgcG93ZGVyYmx1ZTogMHhiMGUwZTYsXG4gIHB1cnBsZTogMHg4MDAwODAsXG4gIHJlYmVjY2FwdXJwbGU6IDB4NjYzMzk5LFxuICByZWQ6IDB4ZmYwMDAwLFxuICByb3N5YnJvd246IDB4YmM4ZjhmLFxuICByb3lhbGJsdWU6IDB4NDE2OWUxLFxuICBzYWRkbGVicm93bjogMHg4YjQ1MTMsXG4gIHNhbG1vbjogMHhmYTgwNzIsXG4gIHNhbmR5YnJvd246IDB4ZjRhNDYwLFxuICBzZWFncmVlbjogMHgyZThiNTcsXG4gIHNlYXNoZWxsOiAweGZmZjVlZSxcbiAgc2llbm5hOiAweGEwNTIyZCxcbiAgc2lsdmVyOiAweGMwYzBjMCxcbiAgc2t5Ymx1ZTogMHg4N2NlZWIsXG4gIHNsYXRlYmx1ZTogMHg2YTVhY2QsXG4gIHNsYXRlZ3JheTogMHg3MDgwOTAsXG4gIHNsYXRlZ3JleTogMHg3MDgwOTAsXG4gIHNub3c6IDB4ZmZmYWZhLFxuICBzcHJpbmdncmVlbjogMHgwMGZmN2YsXG4gIHN0ZWVsYmx1ZTogMHg0NjgyYjQsXG4gIHRhbjogMHhkMmI0OGMsXG4gIHRlYWw6IDB4MDA4MDgwLFxuICB0aGlzdGxlOiAweGQ4YmZkOCxcbiAgdG9tYXRvOiAweGZmNjM0NyxcbiAgdHVycXVvaXNlOiAweDQwZTBkMCxcbiAgdmlvbGV0OiAweGVlODJlZSxcbiAgd2hlYXQ6IDB4ZjVkZWIzLFxuICB3aGl0ZTogMHhmZmZmZmYsXG4gIHdoaXRlc21va2U6IDB4ZjVmNWY1LFxuICB5ZWxsb3c6IDB4ZmZmZjAwLFxuICB5ZWxsb3dncmVlbjogMHg5YWNkMzJcbn07XG5cbmRlZmluZShDb2xvciwgY29sb3IsIHtcbiAgY29weTogZnVuY3Rpb24oY2hhbm5lbHMpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihuZXcgdGhpcy5jb25zdHJ1Y3RvciwgdGhpcywgY2hhbm5lbHMpO1xuICB9LFxuICBkaXNwbGF5YWJsZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucmdiKCkuZGlzcGxheWFibGUoKTtcbiAgfSxcbiAgaGV4OiBjb2xvcl9mb3JtYXRIZXgsIC8vIERlcHJlY2F0ZWQhIFVzZSBjb2xvci5mb3JtYXRIZXguXG4gIGZvcm1hdEhleDogY29sb3JfZm9ybWF0SGV4LFxuICBmb3JtYXRIc2w6IGNvbG9yX2Zvcm1hdEhzbCxcbiAgZm9ybWF0UmdiOiBjb2xvcl9mb3JtYXRSZ2IsXG4gIHRvU3RyaW5nOiBjb2xvcl9mb3JtYXRSZ2Jcbn0pO1xuXG5mdW5jdGlvbiBjb2xvcl9mb3JtYXRIZXgoKSB7XG4gIHJldHVybiB0aGlzLnJnYigpLmZvcm1hdEhleCgpO1xufVxuXG5mdW5jdGlvbiBjb2xvcl9mb3JtYXRIc2woKSB7XG4gIHJldHVybiBoc2xDb252ZXJ0KHRoaXMpLmZvcm1hdEhzbCgpO1xufVxuXG5mdW5jdGlvbiBjb2xvcl9mb3JtYXRSZ2IoKSB7XG4gIHJldHVybiB0aGlzLnJnYigpLmZvcm1hdFJnYigpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb2xvcihmb3JtYXQpIHtcbiAgdmFyIG0sIGw7XG4gIGZvcm1hdCA9IChmb3JtYXQgKyBcIlwiKS50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIChtID0gcmVIZXguZXhlYyhmb3JtYXQpKSA/IChsID0gbVsxXS5sZW5ndGgsIG0gPSBwYXJzZUludChtWzFdLCAxNiksIGwgPT09IDYgPyByZ2JuKG0pIC8vICNmZjAwMDBcbiAgICAgIDogbCA9PT0gMyA/IG5ldyBSZ2IoKG0gPj4gOCAmIDB4ZikgfCAobSA+PiA0ICYgMHhmMCksIChtID4+IDQgJiAweGYpIHwgKG0gJiAweGYwKSwgKChtICYgMHhmKSA8PCA0KSB8IChtICYgMHhmKSwgMSkgLy8gI2YwMFxuICAgICAgOiBsID09PSA4ID8gcmdiYShtID4+IDI0ICYgMHhmZiwgbSA+PiAxNiAmIDB4ZmYsIG0gPj4gOCAmIDB4ZmYsIChtICYgMHhmZikgLyAweGZmKSAvLyAjZmYwMDAwMDBcbiAgICAgIDogbCA9PT0gNCA/IHJnYmEoKG0gPj4gMTIgJiAweGYpIHwgKG0gPj4gOCAmIDB4ZjApLCAobSA+PiA4ICYgMHhmKSB8IChtID4+IDQgJiAweGYwKSwgKG0gPj4gNCAmIDB4ZikgfCAobSAmIDB4ZjApLCAoKChtICYgMHhmKSA8PCA0KSB8IChtICYgMHhmKSkgLyAweGZmKSAvLyAjZjAwMFxuICAgICAgOiBudWxsKSAvLyBpbnZhbGlkIGhleFxuICAgICAgOiAobSA9IHJlUmdiSW50ZWdlci5leGVjKGZvcm1hdCkpID8gbmV3IFJnYihtWzFdLCBtWzJdLCBtWzNdLCAxKSAvLyByZ2IoMjU1LCAwLCAwKVxuICAgICAgOiAobSA9IHJlUmdiUGVyY2VudC5leGVjKGZvcm1hdCkpID8gbmV3IFJnYihtWzFdICogMjU1IC8gMTAwLCBtWzJdICogMjU1IC8gMTAwLCBtWzNdICogMjU1IC8gMTAwLCAxKSAvLyByZ2IoMTAwJSwgMCUsIDAlKVxuICAgICAgOiAobSA9IHJlUmdiYUludGVnZXIuZXhlYyhmb3JtYXQpKSA/IHJnYmEobVsxXSwgbVsyXSwgbVszXSwgbVs0XSkgLy8gcmdiYSgyNTUsIDAsIDAsIDEpXG4gICAgICA6IChtID0gcmVSZ2JhUGVyY2VudC5leGVjKGZvcm1hdCkpID8gcmdiYShtWzFdICogMjU1IC8gMTAwLCBtWzJdICogMjU1IC8gMTAwLCBtWzNdICogMjU1IC8gMTAwLCBtWzRdKSAvLyByZ2IoMTAwJSwgMCUsIDAlLCAxKVxuICAgICAgOiAobSA9IHJlSHNsUGVyY2VudC5leGVjKGZvcm1hdCkpID8gaHNsYShtWzFdLCBtWzJdIC8gMTAwLCBtWzNdIC8gMTAwLCAxKSAvLyBoc2woMTIwLCA1MCUsIDUwJSlcbiAgICAgIDogKG0gPSByZUhzbGFQZXJjZW50LmV4ZWMoZm9ybWF0KSkgPyBoc2xhKG1bMV0sIG1bMl0gLyAxMDAsIG1bM10gLyAxMDAsIG1bNF0pIC8vIGhzbGEoMTIwLCA1MCUsIDUwJSwgMSlcbiAgICAgIDogbmFtZWQuaGFzT3duUHJvcGVydHkoZm9ybWF0KSA/IHJnYm4obmFtZWRbZm9ybWF0XSkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wcm90b3R5cGUtYnVpbHRpbnNcbiAgICAgIDogZm9ybWF0ID09PSBcInRyYW5zcGFyZW50XCIgPyBuZXcgUmdiKE5hTiwgTmFOLCBOYU4sIDApXG4gICAgICA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIHJnYm4obikge1xuICByZXR1cm4gbmV3IFJnYihuID4+IDE2ICYgMHhmZiwgbiA+PiA4ICYgMHhmZiwgbiAmIDB4ZmYsIDEpO1xufVxuXG5mdW5jdGlvbiByZ2JhKHIsIGcsIGIsIGEpIHtcbiAgaWYgKGEgPD0gMCkgciA9IGcgPSBiID0gTmFOO1xuICByZXR1cm4gbmV3IFJnYihyLCBnLCBiLCBhKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJnYkNvbnZlcnQobykge1xuICBpZiAoIShvIGluc3RhbmNlb2YgQ29sb3IpKSBvID0gY29sb3Iobyk7XG4gIGlmICghbykgcmV0dXJuIG5ldyBSZ2I7XG4gIG8gPSBvLnJnYigpO1xuICByZXR1cm4gbmV3IFJnYihvLnIsIG8uZywgby5iLCBvLm9wYWNpdHkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmdiKHIsIGcsIGIsIG9wYWNpdHkpIHtcbiAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgPyByZ2JDb252ZXJ0KHIpIDogbmV3IFJnYihyLCBnLCBiLCBvcGFjaXR5ID09IG51bGwgPyAxIDogb3BhY2l0eSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBSZ2IociwgZywgYiwgb3BhY2l0eSkge1xuICB0aGlzLnIgPSArcjtcbiAgdGhpcy5nID0gK2c7XG4gIHRoaXMuYiA9ICtiO1xuICB0aGlzLm9wYWNpdHkgPSArb3BhY2l0eTtcbn1cblxuZGVmaW5lKFJnYiwgcmdiLCBleHRlbmQoQ29sb3IsIHtcbiAgYnJpZ2h0ZXI6IGZ1bmN0aW9uKGspIHtcbiAgICBrID0gayA9PSBudWxsID8gYnJpZ2h0ZXIgOiBNYXRoLnBvdyhicmlnaHRlciwgayk7XG4gICAgcmV0dXJuIG5ldyBSZ2IodGhpcy5yICogaywgdGhpcy5nICogaywgdGhpcy5iICogaywgdGhpcy5vcGFjaXR5KTtcbiAgfSxcbiAgZGFya2VyOiBmdW5jdGlvbihrKSB7XG4gICAgayA9IGsgPT0gbnVsbCA/IGRhcmtlciA6IE1hdGgucG93KGRhcmtlciwgayk7XG4gICAgcmV0dXJuIG5ldyBSZ2IodGhpcy5yICogaywgdGhpcy5nICogaywgdGhpcy5iICogaywgdGhpcy5vcGFjaXR5KTtcbiAgfSxcbiAgcmdiOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgZGlzcGxheWFibGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoLTAuNSA8PSB0aGlzLnIgJiYgdGhpcy5yIDwgMjU1LjUpXG4gICAgICAgICYmICgtMC41IDw9IHRoaXMuZyAmJiB0aGlzLmcgPCAyNTUuNSlcbiAgICAgICAgJiYgKC0wLjUgPD0gdGhpcy5iICYmIHRoaXMuYiA8IDI1NS41KVxuICAgICAgICAmJiAoMCA8PSB0aGlzLm9wYWNpdHkgJiYgdGhpcy5vcGFjaXR5IDw9IDEpO1xuICB9LFxuICBoZXg6IHJnYl9mb3JtYXRIZXgsIC8vIERlcHJlY2F0ZWQhIFVzZSBjb2xvci5mb3JtYXRIZXguXG4gIGZvcm1hdEhleDogcmdiX2Zvcm1hdEhleCxcbiAgZm9ybWF0UmdiOiByZ2JfZm9ybWF0UmdiLFxuICB0b1N0cmluZzogcmdiX2Zvcm1hdFJnYlxufSkpO1xuXG5mdW5jdGlvbiByZ2JfZm9ybWF0SGV4KCkge1xuICByZXR1cm4gXCIjXCIgKyBoZXgodGhpcy5yKSArIGhleCh0aGlzLmcpICsgaGV4KHRoaXMuYik7XG59XG5cbmZ1bmN0aW9uIHJnYl9mb3JtYXRSZ2IoKSB7XG4gIHZhciBhID0gdGhpcy5vcGFjaXR5OyBhID0gaXNOYU4oYSkgPyAxIDogTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgYSkpO1xuICByZXR1cm4gKGEgPT09IDEgPyBcInJnYihcIiA6IFwicmdiYShcIilcbiAgICAgICsgTWF0aC5tYXgoMCwgTWF0aC5taW4oMjU1LCBNYXRoLnJvdW5kKHRoaXMucikgfHwgMCkpICsgXCIsIFwiXG4gICAgICArIE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgTWF0aC5yb3VuZCh0aGlzLmcpIHx8IDApKSArIFwiLCBcIlxuICAgICAgKyBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIE1hdGgucm91bmQodGhpcy5iKSB8fCAwKSlcbiAgICAgICsgKGEgPT09IDEgPyBcIilcIiA6IFwiLCBcIiArIGEgKyBcIilcIik7XG59XG5cbmZ1bmN0aW9uIGhleCh2YWx1ZSkge1xuICB2YWx1ZSA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgTWF0aC5yb3VuZCh2YWx1ZSkgfHwgMCkpO1xuICByZXR1cm4gKHZhbHVlIDwgMTYgPyBcIjBcIiA6IFwiXCIpICsgdmFsdWUudG9TdHJpbmcoMTYpO1xufVxuXG5mdW5jdGlvbiBoc2xhKGgsIHMsIGwsIGEpIHtcbiAgaWYgKGEgPD0gMCkgaCA9IHMgPSBsID0gTmFOO1xuICBlbHNlIGlmIChsIDw9IDAgfHwgbCA+PSAxKSBoID0gcyA9IE5hTjtcbiAgZWxzZSBpZiAocyA8PSAwKSBoID0gTmFOO1xuICByZXR1cm4gbmV3IEhzbChoLCBzLCBsLCBhKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhzbENvbnZlcnQobykge1xuICBpZiAobyBpbnN0YW5jZW9mIEhzbCkgcmV0dXJuIG5ldyBIc2woby5oLCBvLnMsIG8ubCwgby5vcGFjaXR5KTtcbiAgaWYgKCEobyBpbnN0YW5jZW9mIENvbG9yKSkgbyA9IGNvbG9yKG8pO1xuICBpZiAoIW8pIHJldHVybiBuZXcgSHNsO1xuICBpZiAobyBpbnN0YW5jZW9mIEhzbCkgcmV0dXJuIG87XG4gIG8gPSBvLnJnYigpO1xuICB2YXIgciA9IG8uciAvIDI1NSxcbiAgICAgIGcgPSBvLmcgLyAyNTUsXG4gICAgICBiID0gby5iIC8gMjU1LFxuICAgICAgbWluID0gTWF0aC5taW4ociwgZywgYiksXG4gICAgICBtYXggPSBNYXRoLm1heChyLCBnLCBiKSxcbiAgICAgIGggPSBOYU4sXG4gICAgICBzID0gbWF4IC0gbWluLFxuICAgICAgbCA9IChtYXggKyBtaW4pIC8gMjtcbiAgaWYgKHMpIHtcbiAgICBpZiAociA9PT0gbWF4KSBoID0gKGcgLSBiKSAvIHMgKyAoZyA8IGIpICogNjtcbiAgICBlbHNlIGlmIChnID09PSBtYXgpIGggPSAoYiAtIHIpIC8gcyArIDI7XG4gICAgZWxzZSBoID0gKHIgLSBnKSAvIHMgKyA0O1xuICAgIHMgLz0gbCA8IDAuNSA/IG1heCArIG1pbiA6IDIgLSBtYXggLSBtaW47XG4gICAgaCAqPSA2MDtcbiAgfSBlbHNlIHtcbiAgICBzID0gbCA+IDAgJiYgbCA8IDEgPyAwIDogaDtcbiAgfVxuICByZXR1cm4gbmV3IEhzbChoLCBzLCBsLCBvLm9wYWNpdHkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaHNsKGgsIHMsIGwsIG9wYWNpdHkpIHtcbiAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgPyBoc2xDb252ZXJ0KGgpIDogbmV3IEhzbChoLCBzLCBsLCBvcGFjaXR5ID09IG51bGwgPyAxIDogb3BhY2l0eSk7XG59XG5cbmZ1bmN0aW9uIEhzbChoLCBzLCBsLCBvcGFjaXR5KSB7XG4gIHRoaXMuaCA9ICtoO1xuICB0aGlzLnMgPSArcztcbiAgdGhpcy5sID0gK2w7XG4gIHRoaXMub3BhY2l0eSA9ICtvcGFjaXR5O1xufVxuXG5kZWZpbmUoSHNsLCBoc2wsIGV4dGVuZChDb2xvciwge1xuICBicmlnaHRlcjogZnVuY3Rpb24oaykge1xuICAgIGsgPSBrID09IG51bGwgPyBicmlnaHRlciA6IE1hdGgucG93KGJyaWdodGVyLCBrKTtcbiAgICByZXR1cm4gbmV3IEhzbCh0aGlzLmgsIHRoaXMucywgdGhpcy5sICogaywgdGhpcy5vcGFjaXR5KTtcbiAgfSxcbiAgZGFya2VyOiBmdW5jdGlvbihrKSB7XG4gICAgayA9IGsgPT0gbnVsbCA/IGRhcmtlciA6IE1hdGgucG93KGRhcmtlciwgayk7XG4gICAgcmV0dXJuIG5ldyBIc2wodGhpcy5oLCB0aGlzLnMsIHRoaXMubCAqIGssIHRoaXMub3BhY2l0eSk7XG4gIH0sXG4gIHJnYjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGggPSB0aGlzLmggJSAzNjAgKyAodGhpcy5oIDwgMCkgKiAzNjAsXG4gICAgICAgIHMgPSBpc05hTihoKSB8fCBpc05hTih0aGlzLnMpID8gMCA6IHRoaXMucyxcbiAgICAgICAgbCA9IHRoaXMubCxcbiAgICAgICAgbTIgPSBsICsgKGwgPCAwLjUgPyBsIDogMSAtIGwpICogcyxcbiAgICAgICAgbTEgPSAyICogbCAtIG0yO1xuICAgIHJldHVybiBuZXcgUmdiKFxuICAgICAgaHNsMnJnYihoID49IDI0MCA/IGggLSAyNDAgOiBoICsgMTIwLCBtMSwgbTIpLFxuICAgICAgaHNsMnJnYihoLCBtMSwgbTIpLFxuICAgICAgaHNsMnJnYihoIDwgMTIwID8gaCArIDI0MCA6IGggLSAxMjAsIG0xLCBtMiksXG4gICAgICB0aGlzLm9wYWNpdHlcbiAgICApO1xuICB9LFxuICBkaXNwbGF5YWJsZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICgwIDw9IHRoaXMucyAmJiB0aGlzLnMgPD0gMSB8fCBpc05hTih0aGlzLnMpKVxuICAgICAgICAmJiAoMCA8PSB0aGlzLmwgJiYgdGhpcy5sIDw9IDEpXG4gICAgICAgICYmICgwIDw9IHRoaXMub3BhY2l0eSAmJiB0aGlzLm9wYWNpdHkgPD0gMSk7XG4gIH0sXG4gIGZvcm1hdEhzbDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGEgPSB0aGlzLm9wYWNpdHk7IGEgPSBpc05hTihhKSA/IDEgOiBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBhKSk7XG4gICAgcmV0dXJuIChhID09PSAxID8gXCJoc2woXCIgOiBcImhzbGEoXCIpXG4gICAgICAgICsgKHRoaXMuaCB8fCAwKSArIFwiLCBcIlxuICAgICAgICArICh0aGlzLnMgfHwgMCkgKiAxMDAgKyBcIiUsIFwiXG4gICAgICAgICsgKHRoaXMubCB8fCAwKSAqIDEwMCArIFwiJVwiXG4gICAgICAgICsgKGEgPT09IDEgPyBcIilcIiA6IFwiLCBcIiArIGEgKyBcIilcIik7XG4gIH1cbn0pKTtcblxuLyogRnJvbSBGdkQgMTMuMzcsIENTUyBDb2xvciBNb2R1bGUgTGV2ZWwgMyAqL1xuZnVuY3Rpb24gaHNsMnJnYihoLCBtMSwgbTIpIHtcbiAgcmV0dXJuIChoIDwgNjAgPyBtMSArIChtMiAtIG0xKSAqIGggLyA2MFxuICAgICAgOiBoIDwgMTgwID8gbTJcbiAgICAgIDogaCA8IDI0MCA/IG0xICsgKG0yIC0gbTEpICogKDI0MCAtIGgpIC8gNjBcbiAgICAgIDogbTEpICogMjU1O1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oeCkge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHg7XG4gIH07XG59XG4iLCJpbXBvcnQgY29uc3RhbnQgZnJvbSBcIi4vY29uc3RhbnQuanNcIjtcblxuZnVuY3Rpb24gbGluZWFyKGEsIGQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHQpIHtcbiAgICByZXR1cm4gYSArIHQgKiBkO1xuICB9O1xufVxuXG5mdW5jdGlvbiBleHBvbmVudGlhbChhLCBiLCB5KSB7XG4gIHJldHVybiBhID0gTWF0aC5wb3coYSwgeSksIGIgPSBNYXRoLnBvdyhiLCB5KSAtIGEsIHkgPSAxIC8geSwgZnVuY3Rpb24odCkge1xuICAgIHJldHVybiBNYXRoLnBvdyhhICsgdCAqIGIsIHkpO1xuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaHVlKGEsIGIpIHtcbiAgdmFyIGQgPSBiIC0gYTtcbiAgcmV0dXJuIGQgPyBsaW5lYXIoYSwgZCA+IDE4MCB8fCBkIDwgLTE4MCA/IGQgLSAzNjAgKiBNYXRoLnJvdW5kKGQgLyAzNjApIDogZCkgOiBjb25zdGFudChpc05hTihhKSA/IGIgOiBhKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdhbW1hKHkpIHtcbiAgcmV0dXJuICh5ID0gK3kpID09PSAxID8gbm9nYW1tYSA6IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gYiAtIGEgPyBleHBvbmVudGlhbChhLCBiLCB5KSA6IGNvbnN0YW50KGlzTmFOKGEpID8gYiA6IGEpO1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBub2dhbW1hKGEsIGIpIHtcbiAgdmFyIGQgPSBiIC0gYTtcbiAgcmV0dXJuIGQgPyBsaW5lYXIoYSwgZCkgOiBjb25zdGFudChpc05hTihhKSA/IGIgOiBhKTtcbn1cbiIsImltcG9ydCB7cmdiIGFzIGNvbG9yUmdifSBmcm9tIFwiZDMtY29sb3JcIjtcbmltcG9ydCBiYXNpcyBmcm9tIFwiLi9iYXNpcy5qc1wiO1xuaW1wb3J0IGJhc2lzQ2xvc2VkIGZyb20gXCIuL2Jhc2lzQ2xvc2VkLmpzXCI7XG5pbXBvcnQgbm9nYW1tYSwge2dhbW1hfSBmcm9tIFwiLi9jb2xvci5qc1wiO1xuXG5leHBvcnQgZGVmYXVsdCAoZnVuY3Rpb24gcmdiR2FtbWEoeSkge1xuICB2YXIgY29sb3IgPSBnYW1tYSh5KTtcblxuICBmdW5jdGlvbiByZ2Ioc3RhcnQsIGVuZCkge1xuICAgIHZhciByID0gY29sb3IoKHN0YXJ0ID0gY29sb3JSZ2Ioc3RhcnQpKS5yLCAoZW5kID0gY29sb3JSZ2IoZW5kKSkuciksXG4gICAgICAgIGcgPSBjb2xvcihzdGFydC5nLCBlbmQuZyksXG4gICAgICAgIGIgPSBjb2xvcihzdGFydC5iLCBlbmQuYiksXG4gICAgICAgIG9wYWNpdHkgPSBub2dhbW1hKHN0YXJ0Lm9wYWNpdHksIGVuZC5vcGFjaXR5KTtcbiAgICByZXR1cm4gZnVuY3Rpb24odCkge1xuICAgICAgc3RhcnQuciA9IHIodCk7XG4gICAgICBzdGFydC5nID0gZyh0KTtcbiAgICAgIHN0YXJ0LmIgPSBiKHQpO1xuICAgICAgc3RhcnQub3BhY2l0eSA9IG9wYWNpdHkodCk7XG4gICAgICByZXR1cm4gc3RhcnQgKyBcIlwiO1xuICAgIH07XG4gIH1cblxuICByZ2IuZ2FtbWEgPSByZ2JHYW1tYTtcblxuICByZXR1cm4gcmdiO1xufSkoMSk7XG5cbmZ1bmN0aW9uIHJnYlNwbGluZShzcGxpbmUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbG9ycykge1xuICAgIHZhciBuID0gY29sb3JzLmxlbmd0aCxcbiAgICAgICAgciA9IG5ldyBBcnJheShuKSxcbiAgICAgICAgZyA9IG5ldyBBcnJheShuKSxcbiAgICAgICAgYiA9IG5ldyBBcnJheShuKSxcbiAgICAgICAgaSwgY29sb3I7XG4gICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgY29sb3IgPSBjb2xvclJnYihjb2xvcnNbaV0pO1xuICAgICAgcltpXSA9IGNvbG9yLnIgfHwgMDtcbiAgICAgIGdbaV0gPSBjb2xvci5nIHx8IDA7XG4gICAgICBiW2ldID0gY29sb3IuYiB8fCAwO1xuICAgIH1cbiAgICByID0gc3BsaW5lKHIpO1xuICAgIGcgPSBzcGxpbmUoZyk7XG4gICAgYiA9IHNwbGluZShiKTtcbiAgICBjb2xvci5vcGFjaXR5ID0gMTtcbiAgICByZXR1cm4gZnVuY3Rpb24odCkge1xuICAgICAgY29sb3IuciA9IHIodCk7XG4gICAgICBjb2xvci5nID0gZyh0KTtcbiAgICAgIGNvbG9yLmIgPSBiKHQpO1xuICAgICAgcmV0dXJuIGNvbG9yICsgXCJcIjtcbiAgICB9O1xuICB9O1xufVxuXG5leHBvcnQgdmFyIHJnYkJhc2lzID0gcmdiU3BsaW5lKGJhc2lzKTtcbmV4cG9ydCB2YXIgcmdiQmFzaXNDbG9zZWQgPSByZ2JTcGxpbmUoYmFzaXNDbG9zZWQpO1xuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oYSwgYikge1xuICByZXR1cm4gYSA9ICthLCBiID0gK2IsIGZ1bmN0aW9uKHQpIHtcbiAgICByZXR1cm4gYSAqICgxIC0gdCkgKyBiICogdDtcbiAgfTtcbn1cbiIsImltcG9ydCBudW1iZXIgZnJvbSBcIi4vbnVtYmVyLmpzXCI7XG5cbnZhciByZUEgPSAvWy0rXT8oPzpcXGQrXFwuP1xcZCp8XFwuP1xcZCspKD86W2VFXVstK10/XFxkKyk/L2csXG4gICAgcmVCID0gbmV3IFJlZ0V4cChyZUEuc291cmNlLCBcImdcIik7XG5cbmZ1bmN0aW9uIHplcm8oYikge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGI7XG4gIH07XG59XG5cbmZ1bmN0aW9uIG9uZShiKSB7XG4gIHJldHVybiBmdW5jdGlvbih0KSB7XG4gICAgcmV0dXJuIGIodCkgKyBcIlwiO1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihhLCBiKSB7XG4gIHZhciBiaSA9IHJlQS5sYXN0SW5kZXggPSByZUIubGFzdEluZGV4ID0gMCwgLy8gc2NhbiBpbmRleCBmb3IgbmV4dCBudW1iZXIgaW4gYlxuICAgICAgYW0sIC8vIGN1cnJlbnQgbWF0Y2ggaW4gYVxuICAgICAgYm0sIC8vIGN1cnJlbnQgbWF0Y2ggaW4gYlxuICAgICAgYnMsIC8vIHN0cmluZyBwcmVjZWRpbmcgY3VycmVudCBudW1iZXIgaW4gYiwgaWYgYW55XG4gICAgICBpID0gLTEsIC8vIGluZGV4IGluIHNcbiAgICAgIHMgPSBbXSwgLy8gc3RyaW5nIGNvbnN0YW50cyBhbmQgcGxhY2Vob2xkZXJzXG4gICAgICBxID0gW107IC8vIG51bWJlciBpbnRlcnBvbGF0b3JzXG5cbiAgLy8gQ29lcmNlIGlucHV0cyB0byBzdHJpbmdzLlxuICBhID0gYSArIFwiXCIsIGIgPSBiICsgXCJcIjtcblxuICAvLyBJbnRlcnBvbGF0ZSBwYWlycyBvZiBudW1iZXJzIGluIGEgJiBiLlxuICB3aGlsZSAoKGFtID0gcmVBLmV4ZWMoYSkpXG4gICAgICAmJiAoYm0gPSByZUIuZXhlYyhiKSkpIHtcbiAgICBpZiAoKGJzID0gYm0uaW5kZXgpID4gYmkpIHsgLy8gYSBzdHJpbmcgcHJlY2VkZXMgdGhlIG5leHQgbnVtYmVyIGluIGJcbiAgICAgIGJzID0gYi5zbGljZShiaSwgYnMpO1xuICAgICAgaWYgKHNbaV0pIHNbaV0gKz0gYnM7IC8vIGNvYWxlc2NlIHdpdGggcHJldmlvdXMgc3RyaW5nXG4gICAgICBlbHNlIHNbKytpXSA9IGJzO1xuICAgIH1cbiAgICBpZiAoKGFtID0gYW1bMF0pID09PSAoYm0gPSBibVswXSkpIHsgLy8gbnVtYmVycyBpbiBhICYgYiBtYXRjaFxuICAgICAgaWYgKHNbaV0pIHNbaV0gKz0gYm07IC8vIGNvYWxlc2NlIHdpdGggcHJldmlvdXMgc3RyaW5nXG4gICAgICBlbHNlIHNbKytpXSA9IGJtO1xuICAgIH0gZWxzZSB7IC8vIGludGVycG9sYXRlIG5vbi1tYXRjaGluZyBudW1iZXJzXG4gICAgICBzWysraV0gPSBudWxsO1xuICAgICAgcS5wdXNoKHtpOiBpLCB4OiBudW1iZXIoYW0sIGJtKX0pO1xuICAgIH1cbiAgICBiaSA9IHJlQi5sYXN0SW5kZXg7XG4gIH1cblxuICAvLyBBZGQgcmVtYWlucyBvZiBiLlxuICBpZiAoYmkgPCBiLmxlbmd0aCkge1xuICAgIGJzID0gYi5zbGljZShiaSk7XG4gICAgaWYgKHNbaV0pIHNbaV0gKz0gYnM7IC8vIGNvYWxlc2NlIHdpdGggcHJldmlvdXMgc3RyaW5nXG4gICAgZWxzZSBzWysraV0gPSBicztcbiAgfVxuXG4gIC8vIFNwZWNpYWwgb3B0aW1pemF0aW9uIGZvciBvbmx5IGEgc2luZ2xlIG1hdGNoLlxuICAvLyBPdGhlcndpc2UsIGludGVycG9sYXRlIGVhY2ggb2YgdGhlIG51bWJlcnMgYW5kIHJlam9pbiB0aGUgc3RyaW5nLlxuICByZXR1cm4gcy5sZW5ndGggPCAyID8gKHFbMF1cbiAgICAgID8gb25lKHFbMF0ueClcbiAgICAgIDogemVybyhiKSlcbiAgICAgIDogKGIgPSBxLmxlbmd0aCwgZnVuY3Rpb24odCkge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBvOyBpIDwgYjsgKytpKSBzWyhvID0gcVtpXSkuaV0gPSBvLngodCk7XG4gICAgICAgICAgcmV0dXJuIHMuam9pbihcIlwiKTtcbiAgICAgICAgfSk7XG59XG4iLCJ2YXIgZGVncmVlcyA9IDE4MCAvIE1hdGguUEk7XG5cbmV4cG9ydCB2YXIgaWRlbnRpdHkgPSB7XG4gIHRyYW5zbGF0ZVg6IDAsXG4gIHRyYW5zbGF0ZVk6IDAsXG4gIHJvdGF0ZTogMCxcbiAgc2tld1g6IDAsXG4gIHNjYWxlWDogMSxcbiAgc2NhbGVZOiAxXG59O1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihhLCBiLCBjLCBkLCBlLCBmKSB7XG4gIHZhciBzY2FsZVgsIHNjYWxlWSwgc2tld1g7XG4gIGlmIChzY2FsZVggPSBNYXRoLnNxcnQoYSAqIGEgKyBiICogYikpIGEgLz0gc2NhbGVYLCBiIC89IHNjYWxlWDtcbiAgaWYgKHNrZXdYID0gYSAqIGMgKyBiICogZCkgYyAtPSBhICogc2tld1gsIGQgLT0gYiAqIHNrZXdYO1xuICBpZiAoc2NhbGVZID0gTWF0aC5zcXJ0KGMgKiBjICsgZCAqIGQpKSBjIC89IHNjYWxlWSwgZCAvPSBzY2FsZVksIHNrZXdYIC89IHNjYWxlWTtcbiAgaWYgKGEgKiBkIDwgYiAqIGMpIGEgPSAtYSwgYiA9IC1iLCBza2V3WCA9IC1za2V3WCwgc2NhbGVYID0gLXNjYWxlWDtcbiAgcmV0dXJuIHtcbiAgICB0cmFuc2xhdGVYOiBlLFxuICAgIHRyYW5zbGF0ZVk6IGYsXG4gICAgcm90YXRlOiBNYXRoLmF0YW4yKGIsIGEpICogZGVncmVlcyxcbiAgICBza2V3WDogTWF0aC5hdGFuKHNrZXdYKSAqIGRlZ3JlZXMsXG4gICAgc2NhbGVYOiBzY2FsZVgsXG4gICAgc2NhbGVZOiBzY2FsZVlcbiAgfTtcbn1cbiIsImltcG9ydCBkZWNvbXBvc2UsIHtpZGVudGl0eX0gZnJvbSBcIi4vZGVjb21wb3NlLmpzXCI7XG5cbnZhciBjc3NOb2RlLFxuICAgIGNzc1Jvb3QsXG4gICAgY3NzVmlldyxcbiAgICBzdmdOb2RlO1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDc3ModmFsdWUpIHtcbiAgaWYgKHZhbHVlID09PSBcIm5vbmVcIikgcmV0dXJuIGlkZW50aXR5O1xuICBpZiAoIWNzc05vZGUpIGNzc05vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpLCBjc3NSb290ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCBjc3NWaWV3ID0gZG9jdW1lbnQuZGVmYXVsdFZpZXc7XG4gIGNzc05vZGUuc3R5bGUudHJhbnNmb3JtID0gdmFsdWU7XG4gIHZhbHVlID0gY3NzVmlldy5nZXRDb21wdXRlZFN0eWxlKGNzc1Jvb3QuYXBwZW5kQ2hpbGQoY3NzTm9kZSksIG51bGwpLmdldFByb3BlcnR5VmFsdWUoXCJ0cmFuc2Zvcm1cIik7XG4gIGNzc1Jvb3QucmVtb3ZlQ2hpbGQoY3NzTm9kZSk7XG4gIHZhbHVlID0gdmFsdWUuc2xpY2UoNywgLTEpLnNwbGl0KFwiLFwiKTtcbiAgcmV0dXJuIGRlY29tcG9zZSgrdmFsdWVbMF0sICt2YWx1ZVsxXSwgK3ZhbHVlWzJdLCArdmFsdWVbM10sICt2YWx1ZVs0XSwgK3ZhbHVlWzVdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU3ZnKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gaWRlbnRpdHk7XG4gIGlmICghc3ZnTm9kZSkgc3ZnTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwiZ1wiKTtcbiAgc3ZnTm9kZS5zZXRBdHRyaWJ1dGUoXCJ0cmFuc2Zvcm1cIiwgdmFsdWUpO1xuICBpZiAoISh2YWx1ZSA9IHN2Z05vZGUudHJhbnNmb3JtLmJhc2VWYWwuY29uc29saWRhdGUoKSkpIHJldHVybiBpZGVudGl0eTtcbiAgdmFsdWUgPSB2YWx1ZS5tYXRyaXg7XG4gIHJldHVybiBkZWNvbXBvc2UodmFsdWUuYSwgdmFsdWUuYiwgdmFsdWUuYywgdmFsdWUuZCwgdmFsdWUuZSwgdmFsdWUuZik7XG59XG4iLCJpbXBvcnQgbnVtYmVyIGZyb20gXCIuLi9udW1iZXIuanNcIjtcbmltcG9ydCB7cGFyc2VDc3MsIHBhcnNlU3ZnfSBmcm9tIFwiLi9wYXJzZS5qc1wiO1xuXG5mdW5jdGlvbiBpbnRlcnBvbGF0ZVRyYW5zZm9ybShwYXJzZSwgcHhDb21tYSwgcHhQYXJlbiwgZGVnUGFyZW4pIHtcblxuICBmdW5jdGlvbiBwb3Aocykge1xuICAgIHJldHVybiBzLmxlbmd0aCA/IHMucG9wKCkgKyBcIiBcIiA6IFwiXCI7XG4gIH1cblxuICBmdW5jdGlvbiB0cmFuc2xhdGUoeGEsIHlhLCB4YiwgeWIsIHMsIHEpIHtcbiAgICBpZiAoeGEgIT09IHhiIHx8IHlhICE9PSB5Yikge1xuICAgICAgdmFyIGkgPSBzLnB1c2goXCJ0cmFuc2xhdGUoXCIsIG51bGwsIHB4Q29tbWEsIG51bGwsIHB4UGFyZW4pO1xuICAgICAgcS5wdXNoKHtpOiBpIC0gNCwgeDogbnVtYmVyKHhhLCB4Yil9LCB7aTogaSAtIDIsIHg6IG51bWJlcih5YSwgeWIpfSk7XG4gICAgfSBlbHNlIGlmICh4YiB8fCB5Yikge1xuICAgICAgcy5wdXNoKFwidHJhbnNsYXRlKFwiICsgeGIgKyBweENvbW1hICsgeWIgKyBweFBhcmVuKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByb3RhdGUoYSwgYiwgcywgcSkge1xuICAgIGlmIChhICE9PSBiKSB7XG4gICAgICBpZiAoYSAtIGIgPiAxODApIGIgKz0gMzYwOyBlbHNlIGlmIChiIC0gYSA+IDE4MCkgYSArPSAzNjA7IC8vIHNob3J0ZXN0IHBhdGhcbiAgICAgIHEucHVzaCh7aTogcy5wdXNoKHBvcChzKSArIFwicm90YXRlKFwiLCBudWxsLCBkZWdQYXJlbikgLSAyLCB4OiBudW1iZXIoYSwgYil9KTtcbiAgICB9IGVsc2UgaWYgKGIpIHtcbiAgICAgIHMucHVzaChwb3AocykgKyBcInJvdGF0ZShcIiArIGIgKyBkZWdQYXJlbik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2tld1goYSwgYiwgcywgcSkge1xuICAgIGlmIChhICE9PSBiKSB7XG4gICAgICBxLnB1c2goe2k6IHMucHVzaChwb3AocykgKyBcInNrZXdYKFwiLCBudWxsLCBkZWdQYXJlbikgLSAyLCB4OiBudW1iZXIoYSwgYil9KTtcbiAgICB9IGVsc2UgaWYgKGIpIHtcbiAgICAgIHMucHVzaChwb3AocykgKyBcInNrZXdYKFwiICsgYiArIGRlZ1BhcmVuKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzY2FsZSh4YSwgeWEsIHhiLCB5YiwgcywgcSkge1xuICAgIGlmICh4YSAhPT0geGIgfHwgeWEgIT09IHliKSB7XG4gICAgICB2YXIgaSA9IHMucHVzaChwb3AocykgKyBcInNjYWxlKFwiLCBudWxsLCBcIixcIiwgbnVsbCwgXCIpXCIpO1xuICAgICAgcS5wdXNoKHtpOiBpIC0gNCwgeDogbnVtYmVyKHhhLCB4Yil9LCB7aTogaSAtIDIsIHg6IG51bWJlcih5YSwgeWIpfSk7XG4gICAgfSBlbHNlIGlmICh4YiAhPT0gMSB8fCB5YiAhPT0gMSkge1xuICAgICAgcy5wdXNoKHBvcChzKSArIFwic2NhbGUoXCIgKyB4YiArIFwiLFwiICsgeWIgKyBcIilcIik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKGEsIGIpIHtcbiAgICB2YXIgcyA9IFtdLCAvLyBzdHJpbmcgY29uc3RhbnRzIGFuZCBwbGFjZWhvbGRlcnNcbiAgICAgICAgcSA9IFtdOyAvLyBudW1iZXIgaW50ZXJwb2xhdG9yc1xuICAgIGEgPSBwYXJzZShhKSwgYiA9IHBhcnNlKGIpO1xuICAgIHRyYW5zbGF0ZShhLnRyYW5zbGF0ZVgsIGEudHJhbnNsYXRlWSwgYi50cmFuc2xhdGVYLCBiLnRyYW5zbGF0ZVksIHMsIHEpO1xuICAgIHJvdGF0ZShhLnJvdGF0ZSwgYi5yb3RhdGUsIHMsIHEpO1xuICAgIHNrZXdYKGEuc2tld1gsIGIuc2tld1gsIHMsIHEpO1xuICAgIHNjYWxlKGEuc2NhbGVYLCBhLnNjYWxlWSwgYi5zY2FsZVgsIGIuc2NhbGVZLCBzLCBxKTtcbiAgICBhID0gYiA9IG51bGw7IC8vIGdjXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHQpIHtcbiAgICAgIHZhciBpID0gLTEsIG4gPSBxLmxlbmd0aCwgbztcbiAgICAgIHdoaWxlICgrK2kgPCBuKSBzWyhvID0gcVtpXSkuaV0gPSBvLngodCk7XG4gICAgICByZXR1cm4gcy5qb2luKFwiXCIpO1xuICAgIH07XG4gIH07XG59XG5cbmV4cG9ydCB2YXIgaW50ZXJwb2xhdGVUcmFuc2Zvcm1Dc3MgPSBpbnRlcnBvbGF0ZVRyYW5zZm9ybShwYXJzZUNzcywgXCJweCwgXCIsIFwicHgpXCIsIFwiZGVnKVwiKTtcbmV4cG9ydCB2YXIgaW50ZXJwb2xhdGVUcmFuc2Zvcm1TdmcgPSBpbnRlcnBvbGF0ZVRyYW5zZm9ybShwYXJzZVN2ZywgXCIsIFwiLCBcIilcIiwgXCIpXCIpO1xuIiwidmFyIGZyYW1lID0gMCwgLy8gaXMgYW4gYW5pbWF0aW9uIGZyYW1lIHBlbmRpbmc/XG4gICAgdGltZW91dCA9IDAsIC8vIGlzIGEgdGltZW91dCBwZW5kaW5nP1xuICAgIGludGVydmFsID0gMCwgLy8gYXJlIGFueSB0aW1lcnMgYWN0aXZlP1xuICAgIHBva2VEZWxheSA9IDEwMDAsIC8vIGhvdyBmcmVxdWVudGx5IHdlIGNoZWNrIGZvciBjbG9jayBza2V3XG4gICAgdGFza0hlYWQsXG4gICAgdGFza1RhaWwsXG4gICAgY2xvY2tMYXN0ID0gMCxcbiAgICBjbG9ja05vdyA9IDAsXG4gICAgY2xvY2tTa2V3ID0gMCxcbiAgICBjbG9jayA9IHR5cGVvZiBwZXJmb3JtYW5jZSA9PT0gXCJvYmplY3RcIiAmJiBwZXJmb3JtYW5jZS5ub3cgPyBwZXJmb3JtYW5jZSA6IERhdGUsXG4gICAgc2V0RnJhbWUgPSB0eXBlb2Ygd2luZG93ID09PSBcIm9iamVjdFwiICYmIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPyB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lLmJpbmQod2luZG93KSA6IGZ1bmN0aW9uKGYpIHsgc2V0VGltZW91dChmLCAxNyk7IH07XG5cbmV4cG9ydCBmdW5jdGlvbiBub3coKSB7XG4gIHJldHVybiBjbG9ja05vdyB8fCAoc2V0RnJhbWUoY2xlYXJOb3cpLCBjbG9ja05vdyA9IGNsb2NrLm5vdygpICsgY2xvY2tTa2V3KTtcbn1cblxuZnVuY3Rpb24gY2xlYXJOb3coKSB7XG4gIGNsb2NrTm93ID0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFRpbWVyKCkge1xuICB0aGlzLl9jYWxsID1cbiAgdGhpcy5fdGltZSA9XG4gIHRoaXMuX25leHQgPSBudWxsO1xufVxuXG5UaW1lci5wcm90b3R5cGUgPSB0aW1lci5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBUaW1lcixcbiAgcmVzdGFydDogZnVuY3Rpb24oY2FsbGJhY2ssIGRlbGF5LCB0aW1lKSB7XG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiY2FsbGJhY2sgaXMgbm90IGEgZnVuY3Rpb25cIik7XG4gICAgdGltZSA9ICh0aW1lID09IG51bGwgPyBub3coKSA6ICt0aW1lKSArIChkZWxheSA9PSBudWxsID8gMCA6ICtkZWxheSk7XG4gICAgaWYgKCF0aGlzLl9uZXh0ICYmIHRhc2tUYWlsICE9PSB0aGlzKSB7XG4gICAgICBpZiAodGFza1RhaWwpIHRhc2tUYWlsLl9uZXh0ID0gdGhpcztcbiAgICAgIGVsc2UgdGFza0hlYWQgPSB0aGlzO1xuICAgICAgdGFza1RhaWwgPSB0aGlzO1xuICAgIH1cbiAgICB0aGlzLl9jYWxsID0gY2FsbGJhY2s7XG4gICAgdGhpcy5fdGltZSA9IHRpbWU7XG4gICAgc2xlZXAoKTtcbiAgfSxcbiAgc3RvcDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX2NhbGwpIHtcbiAgICAgIHRoaXMuX2NhbGwgPSBudWxsO1xuICAgICAgdGhpcy5fdGltZSA9IEluZmluaXR5O1xuICAgICAgc2xlZXAoKTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCBmdW5jdGlvbiB0aW1lcihjYWxsYmFjaywgZGVsYXksIHRpbWUpIHtcbiAgdmFyIHQgPSBuZXcgVGltZXI7XG4gIHQucmVzdGFydChjYWxsYmFjaywgZGVsYXksIHRpbWUpO1xuICByZXR1cm4gdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVyRmx1c2goKSB7XG4gIG5vdygpOyAvLyBHZXQgdGhlIGN1cnJlbnQgdGltZSwgaWYgbm90IGFscmVhZHkgc2V0LlxuICArK2ZyYW1lOyAvLyBQcmV0ZW5kIHdl4oCZdmUgc2V0IGFuIGFsYXJtLCBpZiB3ZSBoYXZlbuKAmXQgYWxyZWFkeS5cbiAgdmFyIHQgPSB0YXNrSGVhZCwgZTtcbiAgd2hpbGUgKHQpIHtcbiAgICBpZiAoKGUgPSBjbG9ja05vdyAtIHQuX3RpbWUpID49IDApIHQuX2NhbGwuY2FsbChudWxsLCBlKTtcbiAgICB0ID0gdC5fbmV4dDtcbiAgfVxuICAtLWZyYW1lO1xufVxuXG5mdW5jdGlvbiB3YWtlKCkge1xuICBjbG9ja05vdyA9IChjbG9ja0xhc3QgPSBjbG9jay5ub3coKSkgKyBjbG9ja1NrZXc7XG4gIGZyYW1lID0gdGltZW91dCA9IDA7XG4gIHRyeSB7XG4gICAgdGltZXJGbHVzaCgpO1xuICB9IGZpbmFsbHkge1xuICAgIGZyYW1lID0gMDtcbiAgICBuYXAoKTtcbiAgICBjbG9ja05vdyA9IDA7XG4gIH1cbn1cblxuZnVuY3Rpb24gcG9rZSgpIHtcbiAgdmFyIG5vdyA9IGNsb2NrLm5vdygpLCBkZWxheSA9IG5vdyAtIGNsb2NrTGFzdDtcbiAgaWYgKGRlbGF5ID4gcG9rZURlbGF5KSBjbG9ja1NrZXcgLT0gZGVsYXksIGNsb2NrTGFzdCA9IG5vdztcbn1cblxuZnVuY3Rpb24gbmFwKCkge1xuICB2YXIgdDAsIHQxID0gdGFza0hlYWQsIHQyLCB0aW1lID0gSW5maW5pdHk7XG4gIHdoaWxlICh0MSkge1xuICAgIGlmICh0MS5fY2FsbCkge1xuICAgICAgaWYgKHRpbWUgPiB0MS5fdGltZSkgdGltZSA9IHQxLl90aW1lO1xuICAgICAgdDAgPSB0MSwgdDEgPSB0MS5fbmV4dDtcbiAgICB9IGVsc2Uge1xuICAgICAgdDIgPSB0MS5fbmV4dCwgdDEuX25leHQgPSBudWxsO1xuICAgICAgdDEgPSB0MCA/IHQwLl9uZXh0ID0gdDIgOiB0YXNrSGVhZCA9IHQyO1xuICAgIH1cbiAgfVxuICB0YXNrVGFpbCA9IHQwO1xuICBzbGVlcCh0aW1lKTtcbn1cblxuZnVuY3Rpb24gc2xlZXAodGltZSkge1xuICBpZiAoZnJhbWUpIHJldHVybjsgLy8gU29vbmVzdCBhbGFybSBhbHJlYWR5IHNldCwgb3Igd2lsbCBiZS5cbiAgaWYgKHRpbWVvdXQpIHRpbWVvdXQgPSBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gIHZhciBkZWxheSA9IHRpbWUgLSBjbG9ja05vdzsgLy8gU3RyaWN0bHkgbGVzcyB0aGFuIGlmIHdlIHJlY29tcHV0ZWQgY2xvY2tOb3cuXG4gIGlmIChkZWxheSA+IDI0KSB7XG4gICAgaWYgKHRpbWUgPCBJbmZpbml0eSkgdGltZW91dCA9IHNldFRpbWVvdXQod2FrZSwgdGltZSAtIGNsb2NrLm5vdygpIC0gY2xvY2tTa2V3KTtcbiAgICBpZiAoaW50ZXJ2YWwpIGludGVydmFsID0gY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKCFpbnRlcnZhbCkgY2xvY2tMYXN0ID0gY2xvY2subm93KCksIGludGVydmFsID0gc2V0SW50ZXJ2YWwocG9rZSwgcG9rZURlbGF5KTtcbiAgICBmcmFtZSA9IDEsIHNldEZyYW1lKHdha2UpO1xuICB9XG59XG4iLCJpbXBvcnQge1RpbWVyfSBmcm9tIFwiLi90aW1lci5qc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihjYWxsYmFjaywgZGVsYXksIHRpbWUpIHtcbiAgdmFyIHQgPSBuZXcgVGltZXI7XG4gIGRlbGF5ID0gZGVsYXkgPT0gbnVsbCA/IDAgOiArZGVsYXk7XG4gIHQucmVzdGFydChmdW5jdGlvbihlbGFwc2VkKSB7XG4gICAgdC5zdG9wKCk7XG4gICAgY2FsbGJhY2soZWxhcHNlZCArIGRlbGF5KTtcbiAgfSwgZGVsYXksIHRpbWUpO1xuICByZXR1cm4gdDtcbn1cbiIsImltcG9ydCB7ZGlzcGF0Y2h9IGZyb20gXCJkMy1kaXNwYXRjaFwiO1xuaW1wb3J0IHt0aW1lciwgdGltZW91dH0gZnJvbSBcImQzLXRpbWVyXCI7XG5cbnZhciBlbXB0eU9uID0gZGlzcGF0Y2goXCJzdGFydFwiLCBcImVuZFwiLCBcImNhbmNlbFwiLCBcImludGVycnVwdFwiKTtcbnZhciBlbXB0eVR3ZWVuID0gW107XG5cbmV4cG9ydCB2YXIgQ1JFQVRFRCA9IDA7XG5leHBvcnQgdmFyIFNDSEVEVUxFRCA9IDE7XG5leHBvcnQgdmFyIFNUQVJUSU5HID0gMjtcbmV4cG9ydCB2YXIgU1RBUlRFRCA9IDM7XG5leHBvcnQgdmFyIFJVTk5JTkcgPSA0O1xuZXhwb3J0IHZhciBFTkRJTkcgPSA1O1xuZXhwb3J0IHZhciBFTkRFRCA9IDY7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKG5vZGUsIG5hbWUsIGlkLCBpbmRleCwgZ3JvdXAsIHRpbWluZykge1xuICB2YXIgc2NoZWR1bGVzID0gbm9kZS5fX3RyYW5zaXRpb247XG4gIGlmICghc2NoZWR1bGVzKSBub2RlLl9fdHJhbnNpdGlvbiA9IHt9O1xuICBlbHNlIGlmIChpZCBpbiBzY2hlZHVsZXMpIHJldHVybjtcbiAgY3JlYXRlKG5vZGUsIGlkLCB7XG4gICAgbmFtZTogbmFtZSxcbiAgICBpbmRleDogaW5kZXgsIC8vIEZvciBjb250ZXh0IGR1cmluZyBjYWxsYmFjay5cbiAgICBncm91cDogZ3JvdXAsIC8vIEZvciBjb250ZXh0IGR1cmluZyBjYWxsYmFjay5cbiAgICBvbjogZW1wdHlPbixcbiAgICB0d2VlbjogZW1wdHlUd2VlbixcbiAgICB0aW1lOiB0aW1pbmcudGltZSxcbiAgICBkZWxheTogdGltaW5nLmRlbGF5LFxuICAgIGR1cmF0aW9uOiB0aW1pbmcuZHVyYXRpb24sXG4gICAgZWFzZTogdGltaW5nLmVhc2UsXG4gICAgdGltZXI6IG51bGwsXG4gICAgc3RhdGU6IENSRUFURURcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0KG5vZGUsIGlkKSB7XG4gIHZhciBzY2hlZHVsZSA9IGdldChub2RlLCBpZCk7XG4gIGlmIChzY2hlZHVsZS5zdGF0ZSA+IENSRUFURUQpIHRocm93IG5ldyBFcnJvcihcInRvbyBsYXRlOyBhbHJlYWR5IHNjaGVkdWxlZFwiKTtcbiAgcmV0dXJuIHNjaGVkdWxlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0KG5vZGUsIGlkKSB7XG4gIHZhciBzY2hlZHVsZSA9IGdldChub2RlLCBpZCk7XG4gIGlmIChzY2hlZHVsZS5zdGF0ZSA+IFNUQVJURUQpIHRocm93IG5ldyBFcnJvcihcInRvbyBsYXRlOyBhbHJlYWR5IHJ1bm5pbmdcIik7XG4gIHJldHVybiBzY2hlZHVsZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldChub2RlLCBpZCkge1xuICB2YXIgc2NoZWR1bGUgPSBub2RlLl9fdHJhbnNpdGlvbjtcbiAgaWYgKCFzY2hlZHVsZSB8fCAhKHNjaGVkdWxlID0gc2NoZWR1bGVbaWRdKSkgdGhyb3cgbmV3IEVycm9yKFwidHJhbnNpdGlvbiBub3QgZm91bmRcIik7XG4gIHJldHVybiBzY2hlZHVsZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlKG5vZGUsIGlkLCBzZWxmKSB7XG4gIHZhciBzY2hlZHVsZXMgPSBub2RlLl9fdHJhbnNpdGlvbixcbiAgICAgIHR3ZWVuO1xuXG4gIC8vIEluaXRpYWxpemUgdGhlIHNlbGYgdGltZXIgd2hlbiB0aGUgdHJhbnNpdGlvbiBpcyBjcmVhdGVkLlxuICAvLyBOb3RlIHRoZSBhY3R1YWwgZGVsYXkgaXMgbm90IGtub3duIHVudGlsIHRoZSBmaXJzdCBjYWxsYmFjayFcbiAgc2NoZWR1bGVzW2lkXSA9IHNlbGY7XG4gIHNlbGYudGltZXIgPSB0aW1lcihzY2hlZHVsZSwgMCwgc2VsZi50aW1lKTtcblxuICBmdW5jdGlvbiBzY2hlZHVsZShlbGFwc2VkKSB7XG4gICAgc2VsZi5zdGF0ZSA9IFNDSEVEVUxFRDtcbiAgICBzZWxmLnRpbWVyLnJlc3RhcnQoc3RhcnQsIHNlbGYuZGVsYXksIHNlbGYudGltZSk7XG5cbiAgICAvLyBJZiB0aGUgZWxhcHNlZCBkZWxheSBpcyBsZXNzIHRoYW4gb3VyIGZpcnN0IHNsZWVwLCBzdGFydCBpbW1lZGlhdGVseS5cbiAgICBpZiAoc2VsZi5kZWxheSA8PSBlbGFwc2VkKSBzdGFydChlbGFwc2VkIC0gc2VsZi5kZWxheSk7XG4gIH1cblxuICBmdW5jdGlvbiBzdGFydChlbGFwc2VkKSB7XG4gICAgdmFyIGksIGosIG4sIG87XG5cbiAgICAvLyBJZiB0aGUgc3RhdGUgaXMgbm90IFNDSEVEVUxFRCwgdGhlbiB3ZSBwcmV2aW91c2x5IGVycm9yZWQgb24gc3RhcnQuXG4gICAgaWYgKHNlbGYuc3RhdGUgIT09IFNDSEVEVUxFRCkgcmV0dXJuIHN0b3AoKTtcblxuICAgIGZvciAoaSBpbiBzY2hlZHVsZXMpIHtcbiAgICAgIG8gPSBzY2hlZHVsZXNbaV07XG4gICAgICBpZiAoby5uYW1lICE9PSBzZWxmLm5hbWUpIGNvbnRpbnVlO1xuXG4gICAgICAvLyBXaGlsZSB0aGlzIGVsZW1lbnQgYWxyZWFkeSBoYXMgYSBzdGFydGluZyB0cmFuc2l0aW9uIGR1cmluZyB0aGlzIGZyYW1lLFxuICAgICAgLy8gZGVmZXIgc3RhcnRpbmcgYW4gaW50ZXJydXB0aW5nIHRyYW5zaXRpb24gdW50aWwgdGhhdCB0cmFuc2l0aW9uIGhhcyBhXG4gICAgICAvLyBjaGFuY2UgdG8gdGljayAoYW5kIHBvc3NpYmx5IGVuZCk7IHNlZSBkMy9kMy10cmFuc2l0aW9uIzU0IVxuICAgICAgaWYgKG8uc3RhdGUgPT09IFNUQVJURUQpIHJldHVybiB0aW1lb3V0KHN0YXJ0KTtcblxuICAgICAgLy8gSW50ZXJydXB0IHRoZSBhY3RpdmUgdHJhbnNpdGlvbiwgaWYgYW55LlxuICAgICAgaWYgKG8uc3RhdGUgPT09IFJVTk5JTkcpIHtcbiAgICAgICAgby5zdGF0ZSA9IEVOREVEO1xuICAgICAgICBvLnRpbWVyLnN0b3AoKTtcbiAgICAgICAgby5vbi5jYWxsKFwiaW50ZXJydXB0XCIsIG5vZGUsIG5vZGUuX19kYXRhX18sIG8uaW5kZXgsIG8uZ3JvdXApO1xuICAgICAgICBkZWxldGUgc2NoZWR1bGVzW2ldO1xuICAgICAgfVxuXG4gICAgICAvLyBDYW5jZWwgYW55IHByZS1lbXB0ZWQgdHJhbnNpdGlvbnMuXG4gICAgICBlbHNlIGlmICgraSA8IGlkKSB7XG4gICAgICAgIG8uc3RhdGUgPSBFTkRFRDtcbiAgICAgICAgby50aW1lci5zdG9wKCk7XG4gICAgICAgIG8ub24uY2FsbChcImNhbmNlbFwiLCBub2RlLCBub2RlLl9fZGF0YV9fLCBvLmluZGV4LCBvLmdyb3VwKTtcbiAgICAgICAgZGVsZXRlIHNjaGVkdWxlc1tpXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBEZWZlciB0aGUgZmlyc3QgdGljayB0byBlbmQgb2YgdGhlIGN1cnJlbnQgZnJhbWU7IHNlZSBkMy9kMyMxNTc2LlxuICAgIC8vIE5vdGUgdGhlIHRyYW5zaXRpb24gbWF5IGJlIGNhbmNlbGVkIGFmdGVyIHN0YXJ0IGFuZCBiZWZvcmUgdGhlIGZpcnN0IHRpY2shXG4gICAgLy8gTm90ZSB0aGlzIG11c3QgYmUgc2NoZWR1bGVkIGJlZm9yZSB0aGUgc3RhcnQgZXZlbnQ7IHNlZSBkMy9kMy10cmFuc2l0aW9uIzE2IVxuICAgIC8vIEFzc3VtaW5nIHRoaXMgaXMgc3VjY2Vzc2Z1bCwgc3Vic2VxdWVudCBjYWxsYmFja3MgZ28gc3RyYWlnaHQgdG8gdGljay5cbiAgICB0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHNlbGYuc3RhdGUgPT09IFNUQVJURUQpIHtcbiAgICAgICAgc2VsZi5zdGF0ZSA9IFJVTk5JTkc7XG4gICAgICAgIHNlbGYudGltZXIucmVzdGFydCh0aWNrLCBzZWxmLmRlbGF5LCBzZWxmLnRpbWUpO1xuICAgICAgICB0aWNrKGVsYXBzZWQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gRGlzcGF0Y2ggdGhlIHN0YXJ0IGV2ZW50LlxuICAgIC8vIE5vdGUgdGhpcyBtdXN0IGJlIGRvbmUgYmVmb3JlIHRoZSB0d2VlbiBhcmUgaW5pdGlhbGl6ZWQuXG4gICAgc2VsZi5zdGF0ZSA9IFNUQVJUSU5HO1xuICAgIHNlbGYub24uY2FsbChcInN0YXJ0XCIsIG5vZGUsIG5vZGUuX19kYXRhX18sIHNlbGYuaW5kZXgsIHNlbGYuZ3JvdXApO1xuICAgIGlmIChzZWxmLnN0YXRlICE9PSBTVEFSVElORykgcmV0dXJuOyAvLyBpbnRlcnJ1cHRlZFxuICAgIHNlbGYuc3RhdGUgPSBTVEFSVEVEO1xuXG4gICAgLy8gSW5pdGlhbGl6ZSB0aGUgdHdlZW4sIGRlbGV0aW5nIG51bGwgdHdlZW4uXG4gICAgdHdlZW4gPSBuZXcgQXJyYXkobiA9IHNlbGYudHdlZW4ubGVuZ3RoKTtcbiAgICBmb3IgKGkgPSAwLCBqID0gLTE7IGkgPCBuOyArK2kpIHtcbiAgICAgIGlmIChvID0gc2VsZi50d2VlbltpXS52YWx1ZS5jYWxsKG5vZGUsIG5vZGUuX19kYXRhX18sIHNlbGYuaW5kZXgsIHNlbGYuZ3JvdXApKSB7XG4gICAgICAgIHR3ZWVuWysral0gPSBvO1xuICAgICAgfVxuICAgIH1cbiAgICB0d2Vlbi5sZW5ndGggPSBqICsgMTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRpY2soZWxhcHNlZCkge1xuICAgIHZhciB0ID0gZWxhcHNlZCA8IHNlbGYuZHVyYXRpb24gPyBzZWxmLmVhc2UuY2FsbChudWxsLCBlbGFwc2VkIC8gc2VsZi5kdXJhdGlvbikgOiAoc2VsZi50aW1lci5yZXN0YXJ0KHN0b3ApLCBzZWxmLnN0YXRlID0gRU5ESU5HLCAxKSxcbiAgICAgICAgaSA9IC0xLFxuICAgICAgICBuID0gdHdlZW4ubGVuZ3RoO1xuXG4gICAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICAgIHR3ZWVuW2ldLmNhbGwobm9kZSwgdCk7XG4gICAgfVxuXG4gICAgLy8gRGlzcGF0Y2ggdGhlIGVuZCBldmVudC5cbiAgICBpZiAoc2VsZi5zdGF0ZSA9PT0gRU5ESU5HKSB7XG4gICAgICBzZWxmLm9uLmNhbGwoXCJlbmRcIiwgbm9kZSwgbm9kZS5fX2RhdGFfXywgc2VsZi5pbmRleCwgc2VsZi5ncm91cCk7XG4gICAgICBzdG9wKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc3RvcCgpIHtcbiAgICBzZWxmLnN0YXRlID0gRU5ERUQ7XG4gICAgc2VsZi50aW1lci5zdG9wKCk7XG4gICAgZGVsZXRlIHNjaGVkdWxlc1tpZF07XG4gICAgZm9yICh2YXIgaSBpbiBzY2hlZHVsZXMpIHJldHVybjsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIGRlbGV0ZSBub2RlLl9fdHJhbnNpdGlvbjtcbiAgfVxufVxuIiwiaW1wb3J0IHtTVEFSVElORywgRU5ESU5HLCBFTkRFRH0gZnJvbSBcIi4vdHJhbnNpdGlvbi9zY2hlZHVsZS5qc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihub2RlLCBuYW1lKSB7XG4gIHZhciBzY2hlZHVsZXMgPSBub2RlLl9fdHJhbnNpdGlvbixcbiAgICAgIHNjaGVkdWxlLFxuICAgICAgYWN0aXZlLFxuICAgICAgZW1wdHkgPSB0cnVlLFxuICAgICAgaTtcblxuICBpZiAoIXNjaGVkdWxlcykgcmV0dXJuO1xuXG4gIG5hbWUgPSBuYW1lID09IG51bGwgPyBudWxsIDogbmFtZSArIFwiXCI7XG5cbiAgZm9yIChpIGluIHNjaGVkdWxlcykge1xuICAgIGlmICgoc2NoZWR1bGUgPSBzY2hlZHVsZXNbaV0pLm5hbWUgIT09IG5hbWUpIHsgZW1wdHkgPSBmYWxzZTsgY29udGludWU7IH1cbiAgICBhY3RpdmUgPSBzY2hlZHVsZS5zdGF0ZSA+IFNUQVJUSU5HICYmIHNjaGVkdWxlLnN0YXRlIDwgRU5ESU5HO1xuICAgIHNjaGVkdWxlLnN0YXRlID0gRU5ERUQ7XG4gICAgc2NoZWR1bGUudGltZXIuc3RvcCgpO1xuICAgIHNjaGVkdWxlLm9uLmNhbGwoYWN0aXZlID8gXCJpbnRlcnJ1cHRcIiA6IFwiY2FuY2VsXCIsIG5vZGUsIG5vZGUuX19kYXRhX18sIHNjaGVkdWxlLmluZGV4LCBzY2hlZHVsZS5ncm91cCk7XG4gICAgZGVsZXRlIHNjaGVkdWxlc1tpXTtcbiAgfVxuXG4gIGlmIChlbXB0eSkgZGVsZXRlIG5vZGUuX190cmFuc2l0aW9uO1xufVxuIiwiaW1wb3J0IGludGVycnVwdCBmcm9tIFwiLi4vaW50ZXJydXB0LmpzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICBpbnRlcnJ1cHQodGhpcywgbmFtZSk7XG4gIH0pO1xufVxuIiwiaW1wb3J0IHtnZXQsIHNldH0gZnJvbSBcIi4vc2NoZWR1bGUuanNcIjtcblxuZnVuY3Rpb24gdHdlZW5SZW1vdmUoaWQsIG5hbWUpIHtcbiAgdmFyIHR3ZWVuMCwgdHdlZW4xO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNjaGVkdWxlID0gc2V0KHRoaXMsIGlkKSxcbiAgICAgICAgdHdlZW4gPSBzY2hlZHVsZS50d2VlbjtcblxuICAgIC8vIElmIHRoaXMgbm9kZSBzaGFyZWQgdHdlZW4gd2l0aCB0aGUgcHJldmlvdXMgbm9kZSxcbiAgICAvLyBqdXN0IGFzc2lnbiB0aGUgdXBkYXRlZCBzaGFyZWQgdHdlZW4gYW5kIHdl4oCZcmUgZG9uZSFcbiAgICAvLyBPdGhlcndpc2UsIGNvcHktb24td3JpdGUuXG4gICAgaWYgKHR3ZWVuICE9PSB0d2VlbjApIHtcbiAgICAgIHR3ZWVuMSA9IHR3ZWVuMCA9IHR3ZWVuO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSB0d2VlbjEubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmICh0d2VlbjFbaV0ubmFtZSA9PT0gbmFtZSkge1xuICAgICAgICAgIHR3ZWVuMSA9IHR3ZWVuMS5zbGljZSgpO1xuICAgICAgICAgIHR3ZWVuMS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBzY2hlZHVsZS50d2VlbiA9IHR3ZWVuMTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gdHdlZW5GdW5jdGlvbihpZCwgbmFtZSwgdmFsdWUpIHtcbiAgdmFyIHR3ZWVuMCwgdHdlZW4xO1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IG5ldyBFcnJvcjtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciBzY2hlZHVsZSA9IHNldCh0aGlzLCBpZCksXG4gICAgICAgIHR3ZWVuID0gc2NoZWR1bGUudHdlZW47XG5cbiAgICAvLyBJZiB0aGlzIG5vZGUgc2hhcmVkIHR3ZWVuIHdpdGggdGhlIHByZXZpb3VzIG5vZGUsXG4gICAgLy8ganVzdCBhc3NpZ24gdGhlIHVwZGF0ZWQgc2hhcmVkIHR3ZWVuIGFuZCB3ZeKAmXJlIGRvbmUhXG4gICAgLy8gT3RoZXJ3aXNlLCBjb3B5LW9uLXdyaXRlLlxuICAgIGlmICh0d2VlbiAhPT0gdHdlZW4wKSB7XG4gICAgICB0d2VlbjEgPSAodHdlZW4wID0gdHdlZW4pLnNsaWNlKCk7XG4gICAgICBmb3IgKHZhciB0ID0ge25hbWU6IG5hbWUsIHZhbHVlOiB2YWx1ZX0sIGkgPSAwLCBuID0gdHdlZW4xLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAodHdlZW4xW2ldLm5hbWUgPT09IG5hbWUpIHtcbiAgICAgICAgICB0d2VlbjFbaV0gPSB0O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaSA9PT0gbikgdHdlZW4xLnB1c2godCk7XG4gICAgfVxuXG4gICAgc2NoZWR1bGUudHdlZW4gPSB0d2VlbjE7XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gIHZhciBpZCA9IHRoaXMuX2lkO1xuXG4gIG5hbWUgKz0gXCJcIjtcblxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHtcbiAgICB2YXIgdHdlZW4gPSBnZXQodGhpcy5ub2RlKCksIGlkKS50d2VlbjtcbiAgICBmb3IgKHZhciBpID0gMCwgbiA9IHR3ZWVuLmxlbmd0aCwgdDsgaSA8IG47ICsraSkge1xuICAgICAgaWYgKCh0ID0gdHdlZW5baV0pLm5hbWUgPT09IG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHQudmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMuZWFjaCgodmFsdWUgPT0gbnVsbCA/IHR3ZWVuUmVtb3ZlIDogdHdlZW5GdW5jdGlvbikoaWQsIG5hbWUsIHZhbHVlKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0d2VlblZhbHVlKHRyYW5zaXRpb24sIG5hbWUsIHZhbHVlKSB7XG4gIHZhciBpZCA9IHRyYW5zaXRpb24uX2lkO1xuXG4gIHRyYW5zaXRpb24uZWFjaChmdW5jdGlvbigpIHtcbiAgICB2YXIgc2NoZWR1bGUgPSBzZXQodGhpcywgaWQpO1xuICAgIChzY2hlZHVsZS52YWx1ZSB8fCAoc2NoZWR1bGUudmFsdWUgPSB7fSkpW25hbWVdID0gdmFsdWUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICByZXR1cm4gZ2V0KG5vZGUsIGlkKS52YWx1ZVtuYW1lXTtcbiAgfTtcbn1cbiIsImltcG9ydCB7Y29sb3J9IGZyb20gXCJkMy1jb2xvclwiO1xuaW1wb3J0IHtpbnRlcnBvbGF0ZU51bWJlciwgaW50ZXJwb2xhdGVSZ2IsIGludGVycG9sYXRlU3RyaW5nfSBmcm9tIFwiZDMtaW50ZXJwb2xhdGVcIjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oYSwgYikge1xuICB2YXIgYztcbiAgcmV0dXJuICh0eXBlb2YgYiA9PT0gXCJudW1iZXJcIiA/IGludGVycG9sYXRlTnVtYmVyXG4gICAgICA6IGIgaW5zdGFuY2VvZiBjb2xvciA/IGludGVycG9sYXRlUmdiXG4gICAgICA6IChjID0gY29sb3IoYikpID8gKGIgPSBjLCBpbnRlcnBvbGF0ZVJnYilcbiAgICAgIDogaW50ZXJwb2xhdGVTdHJpbmcpKGEsIGIpO1xufVxuIiwiaW1wb3J0IHtpbnRlcnBvbGF0ZVRyYW5zZm9ybVN2ZyBhcyBpbnRlcnBvbGF0ZVRyYW5zZm9ybX0gZnJvbSBcImQzLWludGVycG9sYXRlXCI7XG5pbXBvcnQge25hbWVzcGFjZX0gZnJvbSBcImQzLXNlbGVjdGlvblwiO1xuaW1wb3J0IHt0d2VlblZhbHVlfSBmcm9tIFwiLi90d2Vlbi5qc1wiO1xuaW1wb3J0IGludGVycG9sYXRlIGZyb20gXCIuL2ludGVycG9sYXRlLmpzXCI7XG5cbmZ1bmN0aW9uIGF0dHJSZW1vdmUobmFtZSkge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGF0dHJSZW1vdmVOUyhmdWxsbmFtZSkge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGVOUyhmdWxsbmFtZS5zcGFjZSwgZnVsbG5hbWUubG9jYWwpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBhdHRyQ29uc3RhbnQobmFtZSwgaW50ZXJwb2xhdGUsIHZhbHVlMSkge1xuICB2YXIgc3RyaW5nMDAsXG4gICAgICBzdHJpbmcxID0gdmFsdWUxICsgXCJcIixcbiAgICAgIGludGVycG9sYXRlMDtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdHJpbmcwID0gdGhpcy5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgcmV0dXJuIHN0cmluZzAgPT09IHN0cmluZzEgPyBudWxsXG4gICAgICAgIDogc3RyaW5nMCA9PT0gc3RyaW5nMDAgPyBpbnRlcnBvbGF0ZTBcbiAgICAgICAgOiBpbnRlcnBvbGF0ZTAgPSBpbnRlcnBvbGF0ZShzdHJpbmcwMCA9IHN0cmluZzAsIHZhbHVlMSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGF0dHJDb25zdGFudE5TKGZ1bGxuYW1lLCBpbnRlcnBvbGF0ZSwgdmFsdWUxKSB7XG4gIHZhciBzdHJpbmcwMCxcbiAgICAgIHN0cmluZzEgPSB2YWx1ZTEgKyBcIlwiLFxuICAgICAgaW50ZXJwb2xhdGUwO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN0cmluZzAgPSB0aGlzLmdldEF0dHJpYnV0ZU5TKGZ1bGxuYW1lLnNwYWNlLCBmdWxsbmFtZS5sb2NhbCk7XG4gICAgcmV0dXJuIHN0cmluZzAgPT09IHN0cmluZzEgPyBudWxsXG4gICAgICAgIDogc3RyaW5nMCA9PT0gc3RyaW5nMDAgPyBpbnRlcnBvbGF0ZTBcbiAgICAgICAgOiBpbnRlcnBvbGF0ZTAgPSBpbnRlcnBvbGF0ZShzdHJpbmcwMCA9IHN0cmluZzAsIHZhbHVlMSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGF0dHJGdW5jdGlvbihuYW1lLCBpbnRlcnBvbGF0ZSwgdmFsdWUpIHtcbiAgdmFyIHN0cmluZzAwLFxuICAgICAgc3RyaW5nMTAsXG4gICAgICBpbnRlcnBvbGF0ZTA7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3RyaW5nMCwgdmFsdWUxID0gdmFsdWUodGhpcyksIHN0cmluZzE7XG4gICAgaWYgKHZhbHVlMSA9PSBudWxsKSByZXR1cm4gdm9pZCB0aGlzLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICBzdHJpbmcwID0gdGhpcy5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgc3RyaW5nMSA9IHZhbHVlMSArIFwiXCI7XG4gICAgcmV0dXJuIHN0cmluZzAgPT09IHN0cmluZzEgPyBudWxsXG4gICAgICAgIDogc3RyaW5nMCA9PT0gc3RyaW5nMDAgJiYgc3RyaW5nMSA9PT0gc3RyaW5nMTAgPyBpbnRlcnBvbGF0ZTBcbiAgICAgICAgOiAoc3RyaW5nMTAgPSBzdHJpbmcxLCBpbnRlcnBvbGF0ZTAgPSBpbnRlcnBvbGF0ZShzdHJpbmcwMCA9IHN0cmluZzAsIHZhbHVlMSkpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBhdHRyRnVuY3Rpb25OUyhmdWxsbmFtZSwgaW50ZXJwb2xhdGUsIHZhbHVlKSB7XG4gIHZhciBzdHJpbmcwMCxcbiAgICAgIHN0cmluZzEwLFxuICAgICAgaW50ZXJwb2xhdGUwO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN0cmluZzAsIHZhbHVlMSA9IHZhbHVlKHRoaXMpLCBzdHJpbmcxO1xuICAgIGlmICh2YWx1ZTEgPT0gbnVsbCkgcmV0dXJuIHZvaWQgdGhpcy5yZW1vdmVBdHRyaWJ1dGVOUyhmdWxsbmFtZS5zcGFjZSwgZnVsbG5hbWUubG9jYWwpO1xuICAgIHN0cmluZzAgPSB0aGlzLmdldEF0dHJpYnV0ZU5TKGZ1bGxuYW1lLnNwYWNlLCBmdWxsbmFtZS5sb2NhbCk7XG4gICAgc3RyaW5nMSA9IHZhbHVlMSArIFwiXCI7XG4gICAgcmV0dXJuIHN0cmluZzAgPT09IHN0cmluZzEgPyBudWxsXG4gICAgICAgIDogc3RyaW5nMCA9PT0gc3RyaW5nMDAgJiYgc3RyaW5nMSA9PT0gc3RyaW5nMTAgPyBpbnRlcnBvbGF0ZTBcbiAgICAgICAgOiAoc3RyaW5nMTAgPSBzdHJpbmcxLCBpbnRlcnBvbGF0ZTAgPSBpbnRlcnBvbGF0ZShzdHJpbmcwMCA9IHN0cmluZzAsIHZhbHVlMSkpO1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICB2YXIgZnVsbG5hbWUgPSBuYW1lc3BhY2UobmFtZSksIGkgPSBmdWxsbmFtZSA9PT0gXCJ0cmFuc2Zvcm1cIiA/IGludGVycG9sYXRlVHJhbnNmb3JtIDogaW50ZXJwb2xhdGU7XG4gIHJldHVybiB0aGlzLmF0dHJUd2VlbihuYW1lLCB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgPyAoZnVsbG5hbWUubG9jYWwgPyBhdHRyRnVuY3Rpb25OUyA6IGF0dHJGdW5jdGlvbikoZnVsbG5hbWUsIGksIHR3ZWVuVmFsdWUodGhpcywgXCJhdHRyLlwiICsgbmFtZSwgdmFsdWUpKVxuICAgICAgOiB2YWx1ZSA9PSBudWxsID8gKGZ1bGxuYW1lLmxvY2FsID8gYXR0clJlbW92ZU5TIDogYXR0clJlbW92ZSkoZnVsbG5hbWUpXG4gICAgICA6IChmdWxsbmFtZS5sb2NhbCA/IGF0dHJDb25zdGFudE5TIDogYXR0ckNvbnN0YW50KShmdWxsbmFtZSwgaSwgdmFsdWUpKTtcbn1cbiIsImltcG9ydCB7bmFtZXNwYWNlfSBmcm9tIFwiZDMtc2VsZWN0aW9uXCI7XG5cbmZ1bmN0aW9uIGF0dHJJbnRlcnBvbGF0ZShuYW1lLCBpKSB7XG4gIHJldHVybiBmdW5jdGlvbih0KSB7XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGUobmFtZSwgaS5jYWxsKHRoaXMsIHQpKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gYXR0ckludGVycG9sYXRlTlMoZnVsbG5hbWUsIGkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHQpIHtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZU5TKGZ1bGxuYW1lLnNwYWNlLCBmdWxsbmFtZS5sb2NhbCwgaS5jYWxsKHRoaXMsIHQpKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gYXR0clR3ZWVuTlMoZnVsbG5hbWUsIHZhbHVlKSB7XG4gIHZhciB0MCwgaTA7XG4gIGZ1bmN0aW9uIHR3ZWVuKCkge1xuICAgIHZhciBpID0gdmFsdWUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBpZiAoaSAhPT0gaTApIHQwID0gKGkwID0gaSkgJiYgYXR0ckludGVycG9sYXRlTlMoZnVsbG5hbWUsIGkpO1xuICAgIHJldHVybiB0MDtcbiAgfVxuICB0d2Vlbi5fdmFsdWUgPSB2YWx1ZTtcbiAgcmV0dXJuIHR3ZWVuO1xufVxuXG5mdW5jdGlvbiBhdHRyVHdlZW4obmFtZSwgdmFsdWUpIHtcbiAgdmFyIHQwLCBpMDtcbiAgZnVuY3Rpb24gdHdlZW4oKSB7XG4gICAgdmFyIGkgPSB2YWx1ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmIChpICE9PSBpMCkgdDAgPSAoaTAgPSBpKSAmJiBhdHRySW50ZXJwb2xhdGUobmFtZSwgaSk7XG4gICAgcmV0dXJuIHQwO1xuICB9XG4gIHR3ZWVuLl92YWx1ZSA9IHZhbHVlO1xuICByZXR1cm4gdHdlZW47XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gIHZhciBrZXkgPSBcImF0dHIuXCIgKyBuYW1lO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHJldHVybiAoa2V5ID0gdGhpcy50d2VlbihrZXkpKSAmJiBrZXkuX3ZhbHVlO1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIHRoaXMudHdlZW4oa2V5LCBudWxsKTtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBuZXcgRXJyb3I7XG4gIHZhciBmdWxsbmFtZSA9IG5hbWVzcGFjZShuYW1lKTtcbiAgcmV0dXJuIHRoaXMudHdlZW4oa2V5LCAoZnVsbG5hbWUubG9jYWwgPyBhdHRyVHdlZW5OUyA6IGF0dHJUd2VlbikoZnVsbG5hbWUsIHZhbHVlKSk7XG59XG4iLCJpbXBvcnQge2dldCwgaW5pdH0gZnJvbSBcIi4vc2NoZWR1bGUuanNcIjtcblxuZnVuY3Rpb24gZGVsYXlGdW5jdGlvbihpZCwgdmFsdWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIGluaXQodGhpcywgaWQpLmRlbGF5ID0gK3ZhbHVlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGRlbGF5Q29uc3RhbnQoaWQsIHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9ICt2YWx1ZSwgZnVuY3Rpb24oKSB7XG4gICAgaW5pdCh0aGlzLCBpZCkuZGVsYXkgPSB2YWx1ZTtcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24odmFsdWUpIHtcbiAgdmFyIGlkID0gdGhpcy5faWQ7XG5cbiAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGhcbiAgICAgID8gdGhpcy5lYWNoKCh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICAgID8gZGVsYXlGdW5jdGlvblxuICAgICAgICAgIDogZGVsYXlDb25zdGFudCkoaWQsIHZhbHVlKSlcbiAgICAgIDogZ2V0KHRoaXMubm9kZSgpLCBpZCkuZGVsYXk7XG59XG4iLCJpbXBvcnQge2dldCwgc2V0fSBmcm9tIFwiLi9zY2hlZHVsZS5qc1wiO1xuXG5mdW5jdGlvbiBkdXJhdGlvbkZ1bmN0aW9uKGlkLCB2YWx1ZSkge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgc2V0KHRoaXMsIGlkKS5kdXJhdGlvbiA9ICt2YWx1ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBkdXJhdGlvbkNvbnN0YW50KGlkLCB2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPSArdmFsdWUsIGZ1bmN0aW9uKCkge1xuICAgIHNldCh0aGlzLCBpZCkuZHVyYXRpb24gPSB2YWx1ZTtcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24odmFsdWUpIHtcbiAgdmFyIGlkID0gdGhpcy5faWQ7XG5cbiAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGhcbiAgICAgID8gdGhpcy5lYWNoKCh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICAgID8gZHVyYXRpb25GdW5jdGlvblxuICAgICAgICAgIDogZHVyYXRpb25Db25zdGFudCkoaWQsIHZhbHVlKSlcbiAgICAgIDogZ2V0KHRoaXMubm9kZSgpLCBpZCkuZHVyYXRpb247XG59XG4iLCJpbXBvcnQge2dldCwgc2V0fSBmcm9tIFwiLi9zY2hlZHVsZS5qc1wiO1xuXG5mdW5jdGlvbiBlYXNlQ29uc3RhbnQoaWQsIHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwiZnVuY3Rpb25cIikgdGhyb3cgbmV3IEVycm9yO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgc2V0KHRoaXMsIGlkKS5lYXNlID0gdmFsdWU7XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHZhciBpZCA9IHRoaXMuX2lkO1xuXG4gIHJldHVybiBhcmd1bWVudHMubGVuZ3RoXG4gICAgICA/IHRoaXMuZWFjaChlYXNlQ29uc3RhbnQoaWQsIHZhbHVlKSlcbiAgICAgIDogZ2V0KHRoaXMubm9kZSgpLCBpZCkuZWFzZTtcbn1cbiIsImltcG9ydCB7bWF0Y2hlcn0gZnJvbSBcImQzLXNlbGVjdGlvblwiO1xuaW1wb3J0IHtUcmFuc2l0aW9ufSBmcm9tIFwiLi9pbmRleC5qc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihtYXRjaCkge1xuICBpZiAodHlwZW9mIG1hdGNoICE9PSBcImZ1bmN0aW9uXCIpIG1hdGNoID0gbWF0Y2hlcihtYXRjaCk7XG5cbiAgZm9yICh2YXIgZ3JvdXBzID0gdGhpcy5fZ3JvdXBzLCBtID0gZ3JvdXBzLmxlbmd0aCwgc3ViZ3JvdXBzID0gbmV3IEFycmF5KG0pLCBqID0gMDsgaiA8IG07ICsraikge1xuICAgIGZvciAodmFyIGdyb3VwID0gZ3JvdXBzW2pdLCBuID0gZ3JvdXAubGVuZ3RoLCBzdWJncm91cCA9IHN1Ymdyb3Vwc1tqXSA9IFtdLCBub2RlLCBpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgaWYgKChub2RlID0gZ3JvdXBbaV0pICYmIG1hdGNoLmNhbGwobm9kZSwgbm9kZS5fX2RhdGFfXywgaSwgZ3JvdXApKSB7XG4gICAgICAgIHN1Ymdyb3VwLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ldyBUcmFuc2l0aW9uKHN1Ymdyb3VwcywgdGhpcy5fcGFyZW50cywgdGhpcy5fbmFtZSwgdGhpcy5faWQpO1xufVxuIiwiaW1wb3J0IHtUcmFuc2l0aW9ufSBmcm9tIFwiLi9pbmRleC5qc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbih0cmFuc2l0aW9uKSB7XG4gIGlmICh0cmFuc2l0aW9uLl9pZCAhPT0gdGhpcy5faWQpIHRocm93IG5ldyBFcnJvcjtcblxuICBmb3IgKHZhciBncm91cHMwID0gdGhpcy5fZ3JvdXBzLCBncm91cHMxID0gdHJhbnNpdGlvbi5fZ3JvdXBzLCBtMCA9IGdyb3VwczAubGVuZ3RoLCBtMSA9IGdyb3VwczEubGVuZ3RoLCBtID0gTWF0aC5taW4obTAsIG0xKSwgbWVyZ2VzID0gbmV3IEFycmF5KG0wKSwgaiA9IDA7IGogPCBtOyArK2opIHtcbiAgICBmb3IgKHZhciBncm91cDAgPSBncm91cHMwW2pdLCBncm91cDEgPSBncm91cHMxW2pdLCBuID0gZ3JvdXAwLmxlbmd0aCwgbWVyZ2UgPSBtZXJnZXNbal0gPSBuZXcgQXJyYXkobiksIG5vZGUsIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBpZiAobm9kZSA9IGdyb3VwMFtpXSB8fCBncm91cDFbaV0pIHtcbiAgICAgICAgbWVyZ2VbaV0gPSBub2RlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBqIDwgbTA7ICsraikge1xuICAgIG1lcmdlc1tqXSA9IGdyb3VwczBbal07XG4gIH1cblxuICByZXR1cm4gbmV3IFRyYW5zaXRpb24obWVyZ2VzLCB0aGlzLl9wYXJlbnRzLCB0aGlzLl9uYW1lLCB0aGlzLl9pZCk7XG59XG4iLCJpbXBvcnQge2dldCwgc2V0LCBpbml0fSBmcm9tIFwiLi9zY2hlZHVsZS5qc1wiO1xuXG5mdW5jdGlvbiBzdGFydChuYW1lKSB7XG4gIHJldHVybiAobmFtZSArIFwiXCIpLnRyaW0oKS5zcGxpdCgvXnxcXHMrLykuZXZlcnkoZnVuY3Rpb24odCkge1xuICAgIHZhciBpID0gdC5pbmRleE9mKFwiLlwiKTtcbiAgICBpZiAoaSA+PSAwKSB0ID0gdC5zbGljZSgwLCBpKTtcbiAgICByZXR1cm4gIXQgfHwgdCA9PT0gXCJzdGFydFwiO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gb25GdW5jdGlvbihpZCwgbmFtZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG9uMCwgb24xLCBzaXQgPSBzdGFydChuYW1lKSA/IGluaXQgOiBzZXQ7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2NoZWR1bGUgPSBzaXQodGhpcywgaWQpLFxuICAgICAgICBvbiA9IHNjaGVkdWxlLm9uO1xuXG4gICAgLy8gSWYgdGhpcyBub2RlIHNoYXJlZCBhIGRpc3BhdGNoIHdpdGggdGhlIHByZXZpb3VzIG5vZGUsXG4gICAgLy8ganVzdCBhc3NpZ24gdGhlIHVwZGF0ZWQgc2hhcmVkIGRpc3BhdGNoIGFuZCB3ZeKAmXJlIGRvbmUhXG4gICAgLy8gT3RoZXJ3aXNlLCBjb3B5LW9uLXdyaXRlLlxuICAgIGlmIChvbiAhPT0gb24wKSAob24xID0gKG9uMCA9IG9uKS5jb3B5KCkpLm9uKG5hbWUsIGxpc3RlbmVyKTtcblxuICAgIHNjaGVkdWxlLm9uID0gb24xO1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihuYW1lLCBsaXN0ZW5lcikge1xuICB2YXIgaWQgPSB0aGlzLl9pZDtcblxuICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA8IDJcbiAgICAgID8gZ2V0KHRoaXMubm9kZSgpLCBpZCkub24ub24obmFtZSlcbiAgICAgIDogdGhpcy5lYWNoKG9uRnVuY3Rpb24oaWQsIG5hbWUsIGxpc3RlbmVyKSk7XG59XG4iLCJmdW5jdGlvbiByZW1vdmVGdW5jdGlvbihpZCkge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50Tm9kZTtcbiAgICBmb3IgKHZhciBpIGluIHRoaXMuX190cmFuc2l0aW9uKSBpZiAoK2kgIT09IGlkKSByZXR1cm47XG4gICAgaWYgKHBhcmVudCkgcGFyZW50LnJlbW92ZUNoaWxkKHRoaXMpO1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMub24oXCJlbmQucmVtb3ZlXCIsIHJlbW92ZUZ1bmN0aW9uKHRoaXMuX2lkKSk7XG59XG4iLCJpbXBvcnQge3NlbGVjdG9yfSBmcm9tIFwiZDMtc2VsZWN0aW9uXCI7XG5pbXBvcnQge1RyYW5zaXRpb259IGZyb20gXCIuL2luZGV4LmpzXCI7XG5pbXBvcnQgc2NoZWR1bGUsIHtnZXR9IGZyb20gXCIuL3NjaGVkdWxlLmpzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHNlbGVjdCkge1xuICB2YXIgbmFtZSA9IHRoaXMuX25hbWUsXG4gICAgICBpZCA9IHRoaXMuX2lkO1xuXG4gIGlmICh0eXBlb2Ygc2VsZWN0ICE9PSBcImZ1bmN0aW9uXCIpIHNlbGVjdCA9IHNlbGVjdG9yKHNlbGVjdCk7XG5cbiAgZm9yICh2YXIgZ3JvdXBzID0gdGhpcy5fZ3JvdXBzLCBtID0gZ3JvdXBzLmxlbmd0aCwgc3ViZ3JvdXBzID0gbmV3IEFycmF5KG0pLCBqID0gMDsgaiA8IG07ICsraikge1xuICAgIGZvciAodmFyIGdyb3VwID0gZ3JvdXBzW2pdLCBuID0gZ3JvdXAubGVuZ3RoLCBzdWJncm91cCA9IHN1Ymdyb3Vwc1tqXSA9IG5ldyBBcnJheShuKSwgbm9kZSwgc3Vibm9kZSwgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgIGlmICgobm9kZSA9IGdyb3VwW2ldKSAmJiAoc3Vibm9kZSA9IHNlbGVjdC5jYWxsKG5vZGUsIG5vZGUuX19kYXRhX18sIGksIGdyb3VwKSkpIHtcbiAgICAgICAgaWYgKFwiX19kYXRhX19cIiBpbiBub2RlKSBzdWJub2RlLl9fZGF0YV9fID0gbm9kZS5fX2RhdGFfXztcbiAgICAgICAgc3ViZ3JvdXBbaV0gPSBzdWJub2RlO1xuICAgICAgICBzY2hlZHVsZShzdWJncm91cFtpXSwgbmFtZSwgaWQsIGksIHN1Ymdyb3VwLCBnZXQobm9kZSwgaWQpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmV3IFRyYW5zaXRpb24oc3ViZ3JvdXBzLCB0aGlzLl9wYXJlbnRzLCBuYW1lLCBpZCk7XG59XG4iLCJpbXBvcnQge3NlbGVjdG9yQWxsfSBmcm9tIFwiZDMtc2VsZWN0aW9uXCI7XG5pbXBvcnQge1RyYW5zaXRpb259IGZyb20gXCIuL2luZGV4LmpzXCI7XG5pbXBvcnQgc2NoZWR1bGUsIHtnZXR9IGZyb20gXCIuL3NjaGVkdWxlLmpzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHNlbGVjdCkge1xuICB2YXIgbmFtZSA9IHRoaXMuX25hbWUsXG4gICAgICBpZCA9IHRoaXMuX2lkO1xuXG4gIGlmICh0eXBlb2Ygc2VsZWN0ICE9PSBcImZ1bmN0aW9uXCIpIHNlbGVjdCA9IHNlbGVjdG9yQWxsKHNlbGVjdCk7XG5cbiAgZm9yICh2YXIgZ3JvdXBzID0gdGhpcy5fZ3JvdXBzLCBtID0gZ3JvdXBzLmxlbmd0aCwgc3ViZ3JvdXBzID0gW10sIHBhcmVudHMgPSBbXSwgaiA9IDA7IGogPCBtOyArK2opIHtcbiAgICBmb3IgKHZhciBncm91cCA9IGdyb3Vwc1tqXSwgbiA9IGdyb3VwLmxlbmd0aCwgbm9kZSwgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgIGlmIChub2RlID0gZ3JvdXBbaV0pIHtcbiAgICAgICAgZm9yICh2YXIgY2hpbGRyZW4gPSBzZWxlY3QuY2FsbChub2RlLCBub2RlLl9fZGF0YV9fLCBpLCBncm91cCksIGNoaWxkLCBpbmhlcml0ID0gZ2V0KG5vZGUsIGlkKSwgayA9IDAsIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGsgPCBsOyArK2spIHtcbiAgICAgICAgICBpZiAoY2hpbGQgPSBjaGlsZHJlbltrXSkge1xuICAgICAgICAgICAgc2NoZWR1bGUoY2hpbGQsIG5hbWUsIGlkLCBrLCBjaGlsZHJlbiwgaW5oZXJpdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN1Ymdyb3Vwcy5wdXNoKGNoaWxkcmVuKTtcbiAgICAgICAgcGFyZW50cy5wdXNoKG5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXcgVHJhbnNpdGlvbihzdWJncm91cHMsIHBhcmVudHMsIG5hbWUsIGlkKTtcbn1cbiIsImltcG9ydCB7c2VsZWN0aW9ufSBmcm9tIFwiZDMtc2VsZWN0aW9uXCI7XG5cbnZhciBTZWxlY3Rpb24gPSBzZWxlY3Rpb24ucHJvdG90eXBlLmNvbnN0cnVjdG9yO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBTZWxlY3Rpb24odGhpcy5fZ3JvdXBzLCB0aGlzLl9wYXJlbnRzKTtcbn1cbiIsImltcG9ydCB7aW50ZXJwb2xhdGVUcmFuc2Zvcm1Dc3MgYXMgaW50ZXJwb2xhdGVUcmFuc2Zvcm19IGZyb20gXCJkMy1pbnRlcnBvbGF0ZVwiO1xuaW1wb3J0IHtzdHlsZX0gZnJvbSBcImQzLXNlbGVjdGlvblwiO1xuaW1wb3J0IHtzZXR9IGZyb20gXCIuL3NjaGVkdWxlLmpzXCI7XG5pbXBvcnQge3R3ZWVuVmFsdWV9IGZyb20gXCIuL3R3ZWVuLmpzXCI7XG5pbXBvcnQgaW50ZXJwb2xhdGUgZnJvbSBcIi4vaW50ZXJwb2xhdGUuanNcIjtcblxuZnVuY3Rpb24gc3R5bGVOdWxsKG5hbWUsIGludGVycG9sYXRlKSB7XG4gIHZhciBzdHJpbmcwMCxcbiAgICAgIHN0cmluZzEwLFxuICAgICAgaW50ZXJwb2xhdGUwO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN0cmluZzAgPSBzdHlsZSh0aGlzLCBuYW1lKSxcbiAgICAgICAgc3RyaW5nMSA9ICh0aGlzLnN0eWxlLnJlbW92ZVByb3BlcnR5KG5hbWUpLCBzdHlsZSh0aGlzLCBuYW1lKSk7XG4gICAgcmV0dXJuIHN0cmluZzAgPT09IHN0cmluZzEgPyBudWxsXG4gICAgICAgIDogc3RyaW5nMCA9PT0gc3RyaW5nMDAgJiYgc3RyaW5nMSA9PT0gc3RyaW5nMTAgPyBpbnRlcnBvbGF0ZTBcbiAgICAgICAgOiBpbnRlcnBvbGF0ZTAgPSBpbnRlcnBvbGF0ZShzdHJpbmcwMCA9IHN0cmluZzAsIHN0cmluZzEwID0gc3RyaW5nMSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHN0eWxlUmVtb3ZlKG5hbWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3R5bGUucmVtb3ZlUHJvcGVydHkobmFtZSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHN0eWxlQ29uc3RhbnQobmFtZSwgaW50ZXJwb2xhdGUsIHZhbHVlMSkge1xuICB2YXIgc3RyaW5nMDAsXG4gICAgICBzdHJpbmcxID0gdmFsdWUxICsgXCJcIixcbiAgICAgIGludGVycG9sYXRlMDtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdHJpbmcwID0gc3R5bGUodGhpcywgbmFtZSk7XG4gICAgcmV0dXJuIHN0cmluZzAgPT09IHN0cmluZzEgPyBudWxsXG4gICAgICAgIDogc3RyaW5nMCA9PT0gc3RyaW5nMDAgPyBpbnRlcnBvbGF0ZTBcbiAgICAgICAgOiBpbnRlcnBvbGF0ZTAgPSBpbnRlcnBvbGF0ZShzdHJpbmcwMCA9IHN0cmluZzAsIHZhbHVlMSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHN0eWxlRnVuY3Rpb24obmFtZSwgaW50ZXJwb2xhdGUsIHZhbHVlKSB7XG4gIHZhciBzdHJpbmcwMCxcbiAgICAgIHN0cmluZzEwLFxuICAgICAgaW50ZXJwb2xhdGUwO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN0cmluZzAgPSBzdHlsZSh0aGlzLCBuYW1lKSxcbiAgICAgICAgdmFsdWUxID0gdmFsdWUodGhpcyksXG4gICAgICAgIHN0cmluZzEgPSB2YWx1ZTEgKyBcIlwiO1xuICAgIGlmICh2YWx1ZTEgPT0gbnVsbCkgc3RyaW5nMSA9IHZhbHVlMSA9ICh0aGlzLnN0eWxlLnJlbW92ZVByb3BlcnR5KG5hbWUpLCBzdHlsZSh0aGlzLCBuYW1lKSk7XG4gICAgcmV0dXJuIHN0cmluZzAgPT09IHN0cmluZzEgPyBudWxsXG4gICAgICAgIDogc3RyaW5nMCA9PT0gc3RyaW5nMDAgJiYgc3RyaW5nMSA9PT0gc3RyaW5nMTAgPyBpbnRlcnBvbGF0ZTBcbiAgICAgICAgOiAoc3RyaW5nMTAgPSBzdHJpbmcxLCBpbnRlcnBvbGF0ZTAgPSBpbnRlcnBvbGF0ZShzdHJpbmcwMCA9IHN0cmluZzAsIHZhbHVlMSkpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBzdHlsZU1heWJlUmVtb3ZlKGlkLCBuYW1lKSB7XG4gIHZhciBvbjAsIG9uMSwgbGlzdGVuZXIwLCBrZXkgPSBcInN0eWxlLlwiICsgbmFtZSwgZXZlbnQgPSBcImVuZC5cIiArIGtleSwgcmVtb3ZlO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNjaGVkdWxlID0gc2V0KHRoaXMsIGlkKSxcbiAgICAgICAgb24gPSBzY2hlZHVsZS5vbixcbiAgICAgICAgbGlzdGVuZXIgPSBzY2hlZHVsZS52YWx1ZVtrZXldID09IG51bGwgPyByZW1vdmUgfHwgKHJlbW92ZSA9IHN0eWxlUmVtb3ZlKG5hbWUpKSA6IHVuZGVmaW5lZDtcblxuICAgIC8vIElmIHRoaXMgbm9kZSBzaGFyZWQgYSBkaXNwYXRjaCB3aXRoIHRoZSBwcmV2aW91cyBub2RlLFxuICAgIC8vIGp1c3QgYXNzaWduIHRoZSB1cGRhdGVkIHNoYXJlZCBkaXNwYXRjaCBhbmQgd2XigJlyZSBkb25lIVxuICAgIC8vIE90aGVyd2lzZSwgY29weS1vbi13cml0ZS5cbiAgICBpZiAob24gIT09IG9uMCB8fCBsaXN0ZW5lcjAgIT09IGxpc3RlbmVyKSAob24xID0gKG9uMCA9IG9uKS5jb3B5KCkpLm9uKGV2ZW50LCBsaXN0ZW5lcjAgPSBsaXN0ZW5lcik7XG5cbiAgICBzY2hlZHVsZS5vbiA9IG9uMTtcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24obmFtZSwgdmFsdWUsIHByaW9yaXR5KSB7XG4gIHZhciBpID0gKG5hbWUgKz0gXCJcIikgPT09IFwidHJhbnNmb3JtXCIgPyBpbnRlcnBvbGF0ZVRyYW5zZm9ybSA6IGludGVycG9sYXRlO1xuICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/IHRoaXNcbiAgICAgIC5zdHlsZVR3ZWVuKG5hbWUsIHN0eWxlTnVsbChuYW1lLCBpKSlcbiAgICAgIC5vbihcImVuZC5zdHlsZS5cIiArIG5hbWUsIHN0eWxlUmVtb3ZlKG5hbWUpKVxuICAgIDogdHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCIgPyB0aGlzXG4gICAgICAuc3R5bGVUd2VlbihuYW1lLCBzdHlsZUZ1bmN0aW9uKG5hbWUsIGksIHR3ZWVuVmFsdWUodGhpcywgXCJzdHlsZS5cIiArIG5hbWUsIHZhbHVlKSkpXG4gICAgICAuZWFjaChzdHlsZU1heWJlUmVtb3ZlKHRoaXMuX2lkLCBuYW1lKSlcbiAgICA6IHRoaXNcbiAgICAgIC5zdHlsZVR3ZWVuKG5hbWUsIHN0eWxlQ29uc3RhbnQobmFtZSwgaSwgdmFsdWUpLCBwcmlvcml0eSlcbiAgICAgIC5vbihcImVuZC5zdHlsZS5cIiArIG5hbWUsIG51bGwpO1xufVxuIiwiZnVuY3Rpb24gc3R5bGVJbnRlcnBvbGF0ZShuYW1lLCBpLCBwcmlvcml0eSkge1xuICByZXR1cm4gZnVuY3Rpb24odCkge1xuICAgIHRoaXMuc3R5bGUuc2V0UHJvcGVydHkobmFtZSwgaS5jYWxsKHRoaXMsIHQpLCBwcmlvcml0eSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHN0eWxlVHdlZW4obmFtZSwgdmFsdWUsIHByaW9yaXR5KSB7XG4gIHZhciB0LCBpMDtcbiAgZnVuY3Rpb24gdHdlZW4oKSB7XG4gICAgdmFyIGkgPSB2YWx1ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmIChpICE9PSBpMCkgdCA9IChpMCA9IGkpICYmIHN0eWxlSW50ZXJwb2xhdGUobmFtZSwgaSwgcHJpb3JpdHkpO1xuICAgIHJldHVybiB0O1xuICB9XG4gIHR3ZWVuLl92YWx1ZSA9IHZhbHVlO1xuICByZXR1cm4gdHdlZW47XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBwcmlvcml0eSkge1xuICB2YXIga2V5ID0gXCJzdHlsZS5cIiArIChuYW1lICs9IFwiXCIpO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHJldHVybiAoa2V5ID0gdGhpcy50d2VlbihrZXkpKSAmJiBrZXkuX3ZhbHVlO1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIHRoaXMudHdlZW4oa2V5LCBudWxsKTtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBuZXcgRXJyb3I7XG4gIHJldHVybiB0aGlzLnR3ZWVuKGtleSwgc3R5bGVUd2VlbihuYW1lLCB2YWx1ZSwgcHJpb3JpdHkgPT0gbnVsbCA/IFwiXCIgOiBwcmlvcml0eSkpO1xufVxuIiwiaW1wb3J0IHt0d2VlblZhbHVlfSBmcm9tIFwiLi90d2Vlbi5qc1wiO1xuXG5mdW5jdGlvbiB0ZXh0Q29uc3RhbnQodmFsdWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudGV4dENvbnRlbnQgPSB2YWx1ZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gdGV4dEZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgdmFsdWUxID0gdmFsdWUodGhpcyk7XG4gICAgdGhpcy50ZXh0Q29udGVudCA9IHZhbHVlMSA9PSBudWxsID8gXCJcIiA6IHZhbHVlMTtcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIHRoaXMudHdlZW4oXCJ0ZXh0XCIsIHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICA/IHRleHRGdW5jdGlvbih0d2VlblZhbHVlKHRoaXMsIFwidGV4dFwiLCB2YWx1ZSkpXG4gICAgICA6IHRleHRDb25zdGFudCh2YWx1ZSA9PSBudWxsID8gXCJcIiA6IHZhbHVlICsgXCJcIikpO1xufVxuIiwiZnVuY3Rpb24gdGV4dEludGVycG9sYXRlKGkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHQpIHtcbiAgICB0aGlzLnRleHRDb250ZW50ID0gaS5jYWxsKHRoaXMsIHQpO1xuICB9O1xufVxuXG5mdW5jdGlvbiB0ZXh0VHdlZW4odmFsdWUpIHtcbiAgdmFyIHQwLCBpMDtcbiAgZnVuY3Rpb24gdHdlZW4oKSB7XG4gICAgdmFyIGkgPSB2YWx1ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmIChpICE9PSBpMCkgdDAgPSAoaTAgPSBpKSAmJiB0ZXh0SW50ZXJwb2xhdGUoaSk7XG4gICAgcmV0dXJuIHQwO1xuICB9XG4gIHR3ZWVuLl92YWx1ZSA9IHZhbHVlO1xuICByZXR1cm4gdHdlZW47XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHZhciBrZXkgPSBcInRleHRcIjtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAxKSByZXR1cm4gKGtleSA9IHRoaXMudHdlZW4oa2V5KSkgJiYga2V5Ll92YWx1ZTtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiB0aGlzLnR3ZWVuKGtleSwgbnVsbCk7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwiZnVuY3Rpb25cIikgdGhyb3cgbmV3IEVycm9yO1xuICByZXR1cm4gdGhpcy50d2VlbihrZXksIHRleHRUd2Vlbih2YWx1ZSkpO1xufVxuIiwiaW1wb3J0IHtUcmFuc2l0aW9uLCBuZXdJZH0gZnJvbSBcIi4vaW5kZXguanNcIjtcbmltcG9ydCBzY2hlZHVsZSwge2dldH0gZnJvbSBcIi4vc2NoZWR1bGUuanNcIjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKSB7XG4gIHZhciBuYW1lID0gdGhpcy5fbmFtZSxcbiAgICAgIGlkMCA9IHRoaXMuX2lkLFxuICAgICAgaWQxID0gbmV3SWQoKTtcblxuICBmb3IgKHZhciBncm91cHMgPSB0aGlzLl9ncm91cHMsIG0gPSBncm91cHMubGVuZ3RoLCBqID0gMDsgaiA8IG07ICsraikge1xuICAgIGZvciAodmFyIGdyb3VwID0gZ3JvdXBzW2pdLCBuID0gZ3JvdXAubGVuZ3RoLCBub2RlLCBpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgaWYgKG5vZGUgPSBncm91cFtpXSkge1xuICAgICAgICB2YXIgaW5oZXJpdCA9IGdldChub2RlLCBpZDApO1xuICAgICAgICBzY2hlZHVsZShub2RlLCBuYW1lLCBpZDEsIGksIGdyb3VwLCB7XG4gICAgICAgICAgdGltZTogaW5oZXJpdC50aW1lICsgaW5oZXJpdC5kZWxheSArIGluaGVyaXQuZHVyYXRpb24sXG4gICAgICAgICAgZGVsYXk6IDAsXG4gICAgICAgICAgZHVyYXRpb246IGluaGVyaXQuZHVyYXRpb24sXG4gICAgICAgICAgZWFzZTogaW5oZXJpdC5lYXNlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXcgVHJhbnNpdGlvbihncm91cHMsIHRoaXMuX3BhcmVudHMsIG5hbWUsIGlkMSk7XG59XG4iLCJpbXBvcnQge3NldH0gZnJvbSBcIi4vc2NoZWR1bGUuanNcIjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKSB7XG4gIHZhciBvbjAsIG9uMSwgdGhhdCA9IHRoaXMsIGlkID0gdGhhdC5faWQsIHNpemUgPSB0aGF0LnNpemUoKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciBjYW5jZWwgPSB7dmFsdWU6IHJlamVjdH0sXG4gICAgICAgIGVuZCA9IHt2YWx1ZTogZnVuY3Rpb24oKSB7IGlmICgtLXNpemUgPT09IDApIHJlc29sdmUoKTsgfX07XG5cbiAgICB0aGF0LmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2NoZWR1bGUgPSBzZXQodGhpcywgaWQpLFxuICAgICAgICAgIG9uID0gc2NoZWR1bGUub247XG5cbiAgICAgIC8vIElmIHRoaXMgbm9kZSBzaGFyZWQgYSBkaXNwYXRjaCB3aXRoIHRoZSBwcmV2aW91cyBub2RlLFxuICAgICAgLy8ganVzdCBhc3NpZ24gdGhlIHVwZGF0ZWQgc2hhcmVkIGRpc3BhdGNoIGFuZCB3ZeKAmXJlIGRvbmUhXG4gICAgICAvLyBPdGhlcndpc2UsIGNvcHktb24td3JpdGUuXG4gICAgICBpZiAob24gIT09IG9uMCkge1xuICAgICAgICBvbjEgPSAob24wID0gb24pLmNvcHkoKTtcbiAgICAgICAgb24xLl8uY2FuY2VsLnB1c2goY2FuY2VsKTtcbiAgICAgICAgb24xLl8uaW50ZXJydXB0LnB1c2goY2FuY2VsKTtcbiAgICAgICAgb24xLl8uZW5kLnB1c2goZW5kKTtcbiAgICAgIH1cblxuICAgICAgc2NoZWR1bGUub24gPSBvbjE7XG4gICAgfSk7XG4gIH0pO1xufVxuIiwiaW1wb3J0IHtzZWxlY3Rpb259IGZyb20gXCJkMy1zZWxlY3Rpb25cIjtcbmltcG9ydCB0cmFuc2l0aW9uX2F0dHIgZnJvbSBcIi4vYXR0ci5qc1wiO1xuaW1wb3J0IHRyYW5zaXRpb25fYXR0clR3ZWVuIGZyb20gXCIuL2F0dHJUd2Vlbi5qc1wiO1xuaW1wb3J0IHRyYW5zaXRpb25fZGVsYXkgZnJvbSBcIi4vZGVsYXkuanNcIjtcbmltcG9ydCB0cmFuc2l0aW9uX2R1cmF0aW9uIGZyb20gXCIuL2R1cmF0aW9uLmpzXCI7XG5pbXBvcnQgdHJhbnNpdGlvbl9lYXNlIGZyb20gXCIuL2Vhc2UuanNcIjtcbmltcG9ydCB0cmFuc2l0aW9uX2ZpbHRlciBmcm9tIFwiLi9maWx0ZXIuanNcIjtcbmltcG9ydCB0cmFuc2l0aW9uX21lcmdlIGZyb20gXCIuL21lcmdlLmpzXCI7XG5pbXBvcnQgdHJhbnNpdGlvbl9vbiBmcm9tIFwiLi9vbi5qc1wiO1xuaW1wb3J0IHRyYW5zaXRpb25fcmVtb3ZlIGZyb20gXCIuL3JlbW92ZS5qc1wiO1xuaW1wb3J0IHRyYW5zaXRpb25fc2VsZWN0IGZyb20gXCIuL3NlbGVjdC5qc1wiO1xuaW1wb3J0IHRyYW5zaXRpb25fc2VsZWN0QWxsIGZyb20gXCIuL3NlbGVjdEFsbC5qc1wiO1xuaW1wb3J0IHRyYW5zaXRpb25fc2VsZWN0aW9uIGZyb20gXCIuL3NlbGVjdGlvbi5qc1wiO1xuaW1wb3J0IHRyYW5zaXRpb25fc3R5bGUgZnJvbSBcIi4vc3R5bGUuanNcIjtcbmltcG9ydCB0cmFuc2l0aW9uX3N0eWxlVHdlZW4gZnJvbSBcIi4vc3R5bGVUd2Vlbi5qc1wiO1xuaW1wb3J0IHRyYW5zaXRpb25fdGV4dCBmcm9tIFwiLi90ZXh0LmpzXCI7XG5pbXBvcnQgdHJhbnNpdGlvbl90ZXh0VHdlZW4gZnJvbSBcIi4vdGV4dFR3ZWVuLmpzXCI7XG5pbXBvcnQgdHJhbnNpdGlvbl90cmFuc2l0aW9uIGZyb20gXCIuL3RyYW5zaXRpb24uanNcIjtcbmltcG9ydCB0cmFuc2l0aW9uX3R3ZWVuIGZyb20gXCIuL3R3ZWVuLmpzXCI7XG5pbXBvcnQgdHJhbnNpdGlvbl9lbmQgZnJvbSBcIi4vZW5kLmpzXCI7XG5cbnZhciBpZCA9IDA7XG5cbmV4cG9ydCBmdW5jdGlvbiBUcmFuc2l0aW9uKGdyb3VwcywgcGFyZW50cywgbmFtZSwgaWQpIHtcbiAgdGhpcy5fZ3JvdXBzID0gZ3JvdXBzO1xuICB0aGlzLl9wYXJlbnRzID0gcGFyZW50cztcbiAgdGhpcy5fbmFtZSA9IG5hbWU7XG4gIHRoaXMuX2lkID0gaWQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHRyYW5zaXRpb24obmFtZSkge1xuICByZXR1cm4gc2VsZWN0aW9uKCkudHJhbnNpdGlvbihuYW1lKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5ld0lkKCkge1xuICByZXR1cm4gKytpZDtcbn1cblxudmFyIHNlbGVjdGlvbl9wcm90b3R5cGUgPSBzZWxlY3Rpb24ucHJvdG90eXBlO1xuXG5UcmFuc2l0aW9uLnByb3RvdHlwZSA9IHRyYW5zaXRpb24ucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogVHJhbnNpdGlvbixcbiAgc2VsZWN0OiB0cmFuc2l0aW9uX3NlbGVjdCxcbiAgc2VsZWN0QWxsOiB0cmFuc2l0aW9uX3NlbGVjdEFsbCxcbiAgZmlsdGVyOiB0cmFuc2l0aW9uX2ZpbHRlcixcbiAgbWVyZ2U6IHRyYW5zaXRpb25fbWVyZ2UsXG4gIHNlbGVjdGlvbjogdHJhbnNpdGlvbl9zZWxlY3Rpb24sXG4gIHRyYW5zaXRpb246IHRyYW5zaXRpb25fdHJhbnNpdGlvbixcbiAgY2FsbDogc2VsZWN0aW9uX3Byb3RvdHlwZS5jYWxsLFxuICBub2Rlczogc2VsZWN0aW9uX3Byb3RvdHlwZS5ub2RlcyxcbiAgbm9kZTogc2VsZWN0aW9uX3Byb3RvdHlwZS5ub2RlLFxuICBzaXplOiBzZWxlY3Rpb25fcHJvdG90eXBlLnNpemUsXG4gIGVtcHR5OiBzZWxlY3Rpb25fcHJvdG90eXBlLmVtcHR5LFxuICBlYWNoOiBzZWxlY3Rpb25fcHJvdG90eXBlLmVhY2gsXG4gIG9uOiB0cmFuc2l0aW9uX29uLFxuICBhdHRyOiB0cmFuc2l0aW9uX2F0dHIsXG4gIGF0dHJUd2VlbjogdHJhbnNpdGlvbl9hdHRyVHdlZW4sXG4gIHN0eWxlOiB0cmFuc2l0aW9uX3N0eWxlLFxuICBzdHlsZVR3ZWVuOiB0cmFuc2l0aW9uX3N0eWxlVHdlZW4sXG4gIHRleHQ6IHRyYW5zaXRpb25fdGV4dCxcbiAgdGV4dFR3ZWVuOiB0cmFuc2l0aW9uX3RleHRUd2VlbixcbiAgcmVtb3ZlOiB0cmFuc2l0aW9uX3JlbW92ZSxcbiAgdHdlZW46IHRyYW5zaXRpb25fdHdlZW4sXG4gIGRlbGF5OiB0cmFuc2l0aW9uX2RlbGF5LFxuICBkdXJhdGlvbjogdHJhbnNpdGlvbl9kdXJhdGlvbixcbiAgZWFzZTogdHJhbnNpdGlvbl9lYXNlLFxuICBlbmQ6IHRyYW5zaXRpb25fZW5kXG59O1xuIiwiZXhwb3J0IGZ1bmN0aW9uIGN1YmljSW4odCkge1xuICByZXR1cm4gdCAqIHQgKiB0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3ViaWNPdXQodCkge1xuICByZXR1cm4gLS10ICogdCAqIHQgKyAxO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3ViaWNJbk91dCh0KSB7XG4gIHJldHVybiAoKHQgKj0gMikgPD0gMSA/IHQgKiB0ICogdCA6ICh0IC09IDIpICogdCAqIHQgKyAyKSAvIDI7XG59XG4iLCJpbXBvcnQge1RyYW5zaXRpb24sIG5ld0lkfSBmcm9tIFwiLi4vdHJhbnNpdGlvbi9pbmRleC5qc1wiO1xuaW1wb3J0IHNjaGVkdWxlIGZyb20gXCIuLi90cmFuc2l0aW9uL3NjaGVkdWxlLmpzXCI7XG5pbXBvcnQge2Vhc2VDdWJpY0luT3V0fSBmcm9tIFwiZDMtZWFzZVwiO1xuaW1wb3J0IHtub3d9IGZyb20gXCJkMy10aW1lclwiO1xuXG52YXIgZGVmYXVsdFRpbWluZyA9IHtcbiAgdGltZTogbnVsbCwgLy8gU2V0IG9uIHVzZS5cbiAgZGVsYXk6IDAsXG4gIGR1cmF0aW9uOiAyNTAsXG4gIGVhc2U6IGVhc2VDdWJpY0luT3V0XG59O1xuXG5mdW5jdGlvbiBpbmhlcml0KG5vZGUsIGlkKSB7XG4gIHZhciB0aW1pbmc7XG4gIHdoaWxlICghKHRpbWluZyA9IG5vZGUuX190cmFuc2l0aW9uKSB8fCAhKHRpbWluZyA9IHRpbWluZ1tpZF0pKSB7XG4gICAgaWYgKCEobm9kZSA9IG5vZGUucGFyZW50Tm9kZSkpIHtcbiAgICAgIHJldHVybiBkZWZhdWx0VGltaW5nLnRpbWUgPSBub3coKSwgZGVmYXVsdFRpbWluZztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRpbWluZztcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24obmFtZSkge1xuICB2YXIgaWQsXG4gICAgICB0aW1pbmc7XG5cbiAgaWYgKG5hbWUgaW5zdGFuY2VvZiBUcmFuc2l0aW9uKSB7XG4gICAgaWQgPSBuYW1lLl9pZCwgbmFtZSA9IG5hbWUuX25hbWU7XG4gIH0gZWxzZSB7XG4gICAgaWQgPSBuZXdJZCgpLCAodGltaW5nID0gZGVmYXVsdFRpbWluZykudGltZSA9IG5vdygpLCBuYW1lID0gbmFtZSA9PSBudWxsID8gbnVsbCA6IG5hbWUgKyBcIlwiO1xuICB9XG5cbiAgZm9yICh2YXIgZ3JvdXBzID0gdGhpcy5fZ3JvdXBzLCBtID0gZ3JvdXBzLmxlbmd0aCwgaiA9IDA7IGogPCBtOyArK2opIHtcbiAgICBmb3IgKHZhciBncm91cCA9IGdyb3Vwc1tqXSwgbiA9IGdyb3VwLmxlbmd0aCwgbm9kZSwgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgIGlmIChub2RlID0gZ3JvdXBbaV0pIHtcbiAgICAgICAgc2NoZWR1bGUobm9kZSwgbmFtZSwgaWQsIGksIGdyb3VwLCB0aW1pbmcgfHwgaW5oZXJpdChub2RlLCBpZCkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXcgVHJhbnNpdGlvbihncm91cHMsIHRoaXMuX3BhcmVudHMsIG5hbWUsIGlkKTtcbn1cbiIsImltcG9ydCB7c2VsZWN0aW9ufSBmcm9tIFwiZDMtc2VsZWN0aW9uXCI7XG5pbXBvcnQgc2VsZWN0aW9uX2ludGVycnVwdCBmcm9tIFwiLi9pbnRlcnJ1cHQuanNcIjtcbmltcG9ydCBzZWxlY3Rpb25fdHJhbnNpdGlvbiBmcm9tIFwiLi90cmFuc2l0aW9uLmpzXCI7XG5cbnNlbGVjdGlvbi5wcm90b3R5cGUuaW50ZXJydXB0ID0gc2VsZWN0aW9uX2ludGVycnVwdDtcbnNlbGVjdGlvbi5wcm90b3R5cGUudHJhbnNpdGlvbiA9IHNlbGVjdGlvbl90cmFuc2l0aW9uO1xuIiwiZXhwb3J0IHZhciBwcmVmaXggPSBcIiRcIjtcblxuZnVuY3Rpb24gTWFwKCkge31cblxuTWFwLnByb3RvdHlwZSA9IG1hcC5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBNYXAsXG4gIGhhczogZnVuY3Rpb24oa2V5KSB7XG4gICAgcmV0dXJuIChwcmVmaXggKyBrZXkpIGluIHRoaXM7XG4gIH0sXG4gIGdldDogZnVuY3Rpb24oa2V5KSB7XG4gICAgcmV0dXJuIHRoaXNbcHJlZml4ICsga2V5XTtcbiAgfSxcbiAgc2V0OiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgdGhpc1twcmVmaXggKyBrZXldID0gdmFsdWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIHJlbW92ZTogZnVuY3Rpb24oa2V5KSB7XG4gICAgdmFyIHByb3BlcnR5ID0gcHJlZml4ICsga2V5O1xuICAgIHJldHVybiBwcm9wZXJ0eSBpbiB0aGlzICYmIGRlbGV0ZSB0aGlzW3Byb3BlcnR5XTtcbiAgfSxcbiAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIHByb3BlcnR5IGluIHRoaXMpIGlmIChwcm9wZXJ0eVswXSA9PT0gcHJlZml4KSBkZWxldGUgdGhpc1twcm9wZXJ0eV07XG4gIH0sXG4gIGtleXM6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIgcHJvcGVydHkgaW4gdGhpcykgaWYgKHByb3BlcnR5WzBdID09PSBwcmVmaXgpIGtleXMucHVzaChwcm9wZXJ0eS5zbGljZSgxKSk7XG4gICAgcmV0dXJuIGtleXM7XG4gIH0sXG4gIHZhbHVlczogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZhbHVlcyA9IFtdO1xuICAgIGZvciAodmFyIHByb3BlcnR5IGluIHRoaXMpIGlmIChwcm9wZXJ0eVswXSA9PT0gcHJlZml4KSB2YWx1ZXMucHVzaCh0aGlzW3Byb3BlcnR5XSk7XG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfSxcbiAgZW50cmllczogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVudHJpZXMgPSBbXTtcbiAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiB0aGlzKSBpZiAocHJvcGVydHlbMF0gPT09IHByZWZpeCkgZW50cmllcy5wdXNoKHtrZXk6IHByb3BlcnR5LnNsaWNlKDEpLCB2YWx1ZTogdGhpc1twcm9wZXJ0eV19KTtcbiAgICByZXR1cm4gZW50cmllcztcbiAgfSxcbiAgc2l6ZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNpemUgPSAwO1xuICAgIGZvciAodmFyIHByb3BlcnR5IGluIHRoaXMpIGlmIChwcm9wZXJ0eVswXSA9PT0gcHJlZml4KSArK3NpemU7XG4gICAgcmV0dXJuIHNpemU7XG4gIH0sXG4gIGVtcHR5OiBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiB0aGlzKSBpZiAocHJvcGVydHlbMF0gPT09IHByZWZpeCkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xuICB9LFxuICBlYWNoOiBmdW5jdGlvbihmKSB7XG4gICAgZm9yICh2YXIgcHJvcGVydHkgaW4gdGhpcykgaWYgKHByb3BlcnR5WzBdID09PSBwcmVmaXgpIGYodGhpc1twcm9wZXJ0eV0sIHByb3BlcnR5LnNsaWNlKDEpLCB0aGlzKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gbWFwKG9iamVjdCwgZikge1xuICB2YXIgbWFwID0gbmV3IE1hcDtcblxuICAvLyBDb3B5IGNvbnN0cnVjdG9yLlxuICBpZiAob2JqZWN0IGluc3RhbmNlb2YgTWFwKSBvYmplY3QuZWFjaChmdW5jdGlvbih2YWx1ZSwga2V5KSB7IG1hcC5zZXQoa2V5LCB2YWx1ZSk7IH0pO1xuXG4gIC8vIEluZGV4IGFycmF5IGJ5IG51bWVyaWMgaW5kZXggb3Igc3BlY2lmaWVkIGtleSBmdW5jdGlvbi5cbiAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvYmplY3QpKSB7XG4gICAgdmFyIGkgPSAtMSxcbiAgICAgICAgbiA9IG9iamVjdC5sZW5ndGgsXG4gICAgICAgIG87XG5cbiAgICBpZiAoZiA9PSBudWxsKSB3aGlsZSAoKytpIDwgbikgbWFwLnNldChpLCBvYmplY3RbaV0pO1xuICAgIGVsc2Ugd2hpbGUgKCsraSA8IG4pIG1hcC5zZXQoZihvID0gb2JqZWN0W2ldLCBpLCBvYmplY3QpLCBvKTtcbiAgfVxuXG4gIC8vIENvbnZlcnQgb2JqZWN0IHRvIG1hcC5cbiAgZWxzZSBpZiAob2JqZWN0KSBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSBtYXAuc2V0KGtleSwgb2JqZWN0W2tleV0pO1xuXG4gIHJldHVybiBtYXA7XG59XG5cbmV4cG9ydCBkZWZhdWx0IG1hcDtcbiIsImltcG9ydCB7ZGVmYXVsdCBhcyBtYXAsIHByZWZpeH0gZnJvbSBcIi4vbWFwXCI7XG5cbmZ1bmN0aW9uIFNldCgpIHt9XG5cbnZhciBwcm90byA9IG1hcC5wcm90b3R5cGU7XG5cblNldC5wcm90b3R5cGUgPSBzZXQucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogU2V0LFxuICBoYXM6IHByb3RvLmhhcyxcbiAgYWRkOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHZhbHVlICs9IFwiXCI7XG4gICAgdGhpc1twcmVmaXggKyB2YWx1ZV0gPSB2YWx1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgcmVtb3ZlOiBwcm90by5yZW1vdmUsXG4gIGNsZWFyOiBwcm90by5jbGVhcixcbiAgdmFsdWVzOiBwcm90by5rZXlzLFxuICBzaXplOiBwcm90by5zaXplLFxuICBlbXB0eTogcHJvdG8uZW1wdHksXG4gIGVhY2g6IHByb3RvLmVhY2hcbn07XG5cbmZ1bmN0aW9uIHNldChvYmplY3QsIGYpIHtcbiAgdmFyIHNldCA9IG5ldyBTZXQ7XG5cbiAgLy8gQ29weSBjb25zdHJ1Y3Rvci5cbiAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIFNldCkgb2JqZWN0LmVhY2goZnVuY3Rpb24odmFsdWUpIHsgc2V0LmFkZCh2YWx1ZSk7IH0pO1xuXG4gIC8vIE90aGVyd2lzZSwgYXNzdW1lIGl04oCZcyBhbiBhcnJheS5cbiAgZWxzZSBpZiAob2JqZWN0KSB7XG4gICAgdmFyIGkgPSAtMSwgbiA9IG9iamVjdC5sZW5ndGg7XG4gICAgaWYgKGYgPT0gbnVsbCkgd2hpbGUgKCsraSA8IG4pIHNldC5hZGQob2JqZWN0W2ldKTtcbiAgICBlbHNlIHdoaWxlICgrK2kgPCBuKSBzZXQuYWRkKGYob2JqZWN0W2ldLCBpLCBvYmplY3QpKTtcbiAgfVxuXG4gIHJldHVybiBzZXQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHNldDtcbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIE1hdGguYWJzKHggPSBNYXRoLnJvdW5kKHgpKSA+PSAxZTIxXG4gICAgICA/IHgudG9Mb2NhbGVTdHJpbmcoXCJlblwiKS5yZXBsYWNlKC8sL2csIFwiXCIpXG4gICAgICA6IHgudG9TdHJpbmcoMTApO1xufVxuXG4vLyBDb21wdXRlcyB0aGUgZGVjaW1hbCBjb2VmZmljaWVudCBhbmQgZXhwb25lbnQgb2YgdGhlIHNwZWNpZmllZCBudW1iZXIgeCB3aXRoXG4vLyBzaWduaWZpY2FudCBkaWdpdHMgcCwgd2hlcmUgeCBpcyBwb3NpdGl2ZSBhbmQgcCBpcyBpbiBbMSwgMjFdIG9yIHVuZGVmaW5lZC5cbi8vIEZvciBleGFtcGxlLCBmb3JtYXREZWNpbWFsUGFydHMoMS4yMykgcmV0dXJucyBbXCIxMjNcIiwgMF0uXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RGVjaW1hbFBhcnRzKHgsIHApIHtcbiAgaWYgKChpID0gKHggPSBwID8geC50b0V4cG9uZW50aWFsKHAgLSAxKSA6IHgudG9FeHBvbmVudGlhbCgpKS5pbmRleE9mKFwiZVwiKSkgPCAwKSByZXR1cm4gbnVsbDsgLy8gTmFOLCDCsUluZmluaXR5XG4gIHZhciBpLCBjb2VmZmljaWVudCA9IHguc2xpY2UoMCwgaSk7XG5cbiAgLy8gVGhlIHN0cmluZyByZXR1cm5lZCBieSB0b0V4cG9uZW50aWFsIGVpdGhlciBoYXMgdGhlIGZvcm0gXFxkXFwuXFxkK2VbLStdXFxkK1xuICAvLyAoZS5nLiwgMS4yZSszKSBvciB0aGUgZm9ybSBcXGRlWy0rXVxcZCsgKGUuZy4sIDFlKzMpLlxuICByZXR1cm4gW1xuICAgIGNvZWZmaWNpZW50Lmxlbmd0aCA+IDEgPyBjb2VmZmljaWVudFswXSArIGNvZWZmaWNpZW50LnNsaWNlKDIpIDogY29lZmZpY2llbnQsXG4gICAgK3guc2xpY2UoaSArIDEpXG4gIF07XG59XG4iLCJpbXBvcnQge2Zvcm1hdERlY2ltYWxQYXJ0c30gZnJvbSBcIi4vZm9ybWF0RGVjaW1hbC5qc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbih4KSB7XG4gIHJldHVybiB4ID0gZm9ybWF0RGVjaW1hbFBhcnRzKE1hdGguYWJzKHgpKSwgeCA/IHhbMV0gOiBOYU47XG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbihncm91cGluZywgdGhvdXNhbmRzKSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgd2lkdGgpIHtcbiAgICB2YXIgaSA9IHZhbHVlLmxlbmd0aCxcbiAgICAgICAgdCA9IFtdLFxuICAgICAgICBqID0gMCxcbiAgICAgICAgZyA9IGdyb3VwaW5nWzBdLFxuICAgICAgICBsZW5ndGggPSAwO1xuXG4gICAgd2hpbGUgKGkgPiAwICYmIGcgPiAwKSB7XG4gICAgICBpZiAobGVuZ3RoICsgZyArIDEgPiB3aWR0aCkgZyA9IE1hdGgubWF4KDEsIHdpZHRoIC0gbGVuZ3RoKTtcbiAgICAgIHQucHVzaCh2YWx1ZS5zdWJzdHJpbmcoaSAtPSBnLCBpICsgZykpO1xuICAgICAgaWYgKChsZW5ndGggKz0gZyArIDEpID4gd2lkdGgpIGJyZWFrO1xuICAgICAgZyA9IGdyb3VwaW5nW2ogPSAoaiArIDEpICUgZ3JvdXBpbmcubGVuZ3RoXTtcbiAgICB9XG5cbiAgICByZXR1cm4gdC5yZXZlcnNlKCkuam9pbih0aG91c2FuZHMpO1xuICB9O1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24obnVtZXJhbHMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1swLTldL2csIGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBudW1lcmFsc1sraV07XG4gICAgfSk7XG4gIH07XG59XG4iLCIvLyBbW2ZpbGxdYWxpZ25dW3NpZ25dW3N5bWJvbF1bMF1bd2lkdGhdWyxdWy5wcmVjaXNpb25dW35dW3R5cGVdXG52YXIgcmUgPSAvXig/OiguKT8oWzw+PV5dKSk/KFsrXFwtKCBdKT8oWyQjXSk/KDApPyhcXGQrKT8oLCk/KFxcLlxcZCspPyh+KT8oW2EteiVdKT8kL2k7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGZvcm1hdFNwZWNpZmllcihzcGVjaWZpZXIpIHtcbiAgaWYgKCEobWF0Y2ggPSByZS5leGVjKHNwZWNpZmllcikpKSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIGZvcm1hdDogXCIgKyBzcGVjaWZpZXIpO1xuICB2YXIgbWF0Y2g7XG4gIHJldHVybiBuZXcgRm9ybWF0U3BlY2lmaWVyKHtcbiAgICBmaWxsOiBtYXRjaFsxXSxcbiAgICBhbGlnbjogbWF0Y2hbMl0sXG4gICAgc2lnbjogbWF0Y2hbM10sXG4gICAgc3ltYm9sOiBtYXRjaFs0XSxcbiAgICB6ZXJvOiBtYXRjaFs1XSxcbiAgICB3aWR0aDogbWF0Y2hbNl0sXG4gICAgY29tbWE6IG1hdGNoWzddLFxuICAgIHByZWNpc2lvbjogbWF0Y2hbOF0gJiYgbWF0Y2hbOF0uc2xpY2UoMSksXG4gICAgdHJpbTogbWF0Y2hbOV0sXG4gICAgdHlwZTogbWF0Y2hbMTBdXG4gIH0pO1xufVxuXG5mb3JtYXRTcGVjaWZpZXIucHJvdG90eXBlID0gRm9ybWF0U3BlY2lmaWVyLnByb3RvdHlwZTsgLy8gaW5zdGFuY2VvZlxuXG5leHBvcnQgZnVuY3Rpb24gRm9ybWF0U3BlY2lmaWVyKHNwZWNpZmllcikge1xuICB0aGlzLmZpbGwgPSBzcGVjaWZpZXIuZmlsbCA9PT0gdW5kZWZpbmVkID8gXCIgXCIgOiBzcGVjaWZpZXIuZmlsbCArIFwiXCI7XG4gIHRoaXMuYWxpZ24gPSBzcGVjaWZpZXIuYWxpZ24gPT09IHVuZGVmaW5lZCA/IFwiPlwiIDogc3BlY2lmaWVyLmFsaWduICsgXCJcIjtcbiAgdGhpcy5zaWduID0gc3BlY2lmaWVyLnNpZ24gPT09IHVuZGVmaW5lZCA/IFwiLVwiIDogc3BlY2lmaWVyLnNpZ24gKyBcIlwiO1xuICB0aGlzLnN5bWJvbCA9IHNwZWNpZmllci5zeW1ib2wgPT09IHVuZGVmaW5lZCA/IFwiXCIgOiBzcGVjaWZpZXIuc3ltYm9sICsgXCJcIjtcbiAgdGhpcy56ZXJvID0gISFzcGVjaWZpZXIuemVybztcbiAgdGhpcy53aWR0aCA9IHNwZWNpZmllci53aWR0aCA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogK3NwZWNpZmllci53aWR0aDtcbiAgdGhpcy5jb21tYSA9ICEhc3BlY2lmaWVyLmNvbW1hO1xuICB0aGlzLnByZWNpc2lvbiA9IHNwZWNpZmllci5wcmVjaXNpb24gPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6ICtzcGVjaWZpZXIucHJlY2lzaW9uO1xuICB0aGlzLnRyaW0gPSAhIXNwZWNpZmllci50cmltO1xuICB0aGlzLnR5cGUgPSBzcGVjaWZpZXIudHlwZSA9PT0gdW5kZWZpbmVkID8gXCJcIiA6IHNwZWNpZmllci50eXBlICsgXCJcIjtcbn1cblxuRm9ybWF0U3BlY2lmaWVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5maWxsXG4gICAgICArIHRoaXMuYWxpZ25cbiAgICAgICsgdGhpcy5zaWduXG4gICAgICArIHRoaXMuc3ltYm9sXG4gICAgICArICh0aGlzLnplcm8gPyBcIjBcIiA6IFwiXCIpXG4gICAgICArICh0aGlzLndpZHRoID09PSB1bmRlZmluZWQgPyBcIlwiIDogTWF0aC5tYXgoMSwgdGhpcy53aWR0aCB8IDApKVxuICAgICAgKyAodGhpcy5jb21tYSA/IFwiLFwiIDogXCJcIilcbiAgICAgICsgKHRoaXMucHJlY2lzaW9uID09PSB1bmRlZmluZWQgPyBcIlwiIDogXCIuXCIgKyBNYXRoLm1heCgwLCB0aGlzLnByZWNpc2lvbiB8IDApKVxuICAgICAgKyAodGhpcy50cmltID8gXCJ+XCIgOiBcIlwiKVxuICAgICAgKyB0aGlzLnR5cGU7XG59O1xuIiwiLy8gVHJpbXMgaW5zaWduaWZpY2FudCB6ZXJvcywgZS5nLiwgcmVwbGFjZXMgMS4yMDAwayB3aXRoIDEuMmsuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihzKSB7XG4gIG91dDogZm9yICh2YXIgbiA9IHMubGVuZ3RoLCBpID0gMSwgaTAgPSAtMSwgaTE7IGkgPCBuOyArK2kpIHtcbiAgICBzd2l0Y2ggKHNbaV0pIHtcbiAgICAgIGNhc2UgXCIuXCI6IGkwID0gaTEgPSBpOyBicmVhaztcbiAgICAgIGNhc2UgXCIwXCI6IGlmIChpMCA9PT0gMCkgaTAgPSBpOyBpMSA9IGk7IGJyZWFrO1xuICAgICAgZGVmYXVsdDogaWYgKCErc1tpXSkgYnJlYWsgb3V0OyBpZiAoaTAgPiAwKSBpMCA9IDA7IGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gaTAgPiAwID8gcy5zbGljZSgwLCBpMCkgKyBzLnNsaWNlKGkxICsgMSkgOiBzO1xufVxuIiwiaW1wb3J0IHtmb3JtYXREZWNpbWFsUGFydHN9IGZyb20gXCIuL2Zvcm1hdERlY2ltYWwuanNcIjtcblxuZXhwb3J0IHZhciBwcmVmaXhFeHBvbmVudDtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oeCwgcCkge1xuICB2YXIgZCA9IGZvcm1hdERlY2ltYWxQYXJ0cyh4LCBwKTtcbiAgaWYgKCFkKSByZXR1cm4geCArIFwiXCI7XG4gIHZhciBjb2VmZmljaWVudCA9IGRbMF0sXG4gICAgICBleHBvbmVudCA9IGRbMV0sXG4gICAgICBpID0gZXhwb25lbnQgLSAocHJlZml4RXhwb25lbnQgPSBNYXRoLm1heCgtOCwgTWF0aC5taW4oOCwgTWF0aC5mbG9vcihleHBvbmVudCAvIDMpKSkgKiAzKSArIDEsXG4gICAgICBuID0gY29lZmZpY2llbnQubGVuZ3RoO1xuICByZXR1cm4gaSA9PT0gbiA/IGNvZWZmaWNpZW50XG4gICAgICA6IGkgPiBuID8gY29lZmZpY2llbnQgKyBuZXcgQXJyYXkoaSAtIG4gKyAxKS5qb2luKFwiMFwiKVxuICAgICAgOiBpID4gMCA/IGNvZWZmaWNpZW50LnNsaWNlKDAsIGkpICsgXCIuXCIgKyBjb2VmZmljaWVudC5zbGljZShpKVxuICAgICAgOiBcIjAuXCIgKyBuZXcgQXJyYXkoMSAtIGkpLmpvaW4oXCIwXCIpICsgZm9ybWF0RGVjaW1hbFBhcnRzKHgsIE1hdGgubWF4KDAsIHAgKyBpIC0gMSkpWzBdOyAvLyBsZXNzIHRoYW4gMXkhXG59XG4iLCJpbXBvcnQge2Zvcm1hdERlY2ltYWxQYXJ0c30gZnJvbSBcIi4vZm9ybWF0RGVjaW1hbC5qc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbih4LCBwKSB7XG4gIHZhciBkID0gZm9ybWF0RGVjaW1hbFBhcnRzKHgsIHApO1xuICBpZiAoIWQpIHJldHVybiB4ICsgXCJcIjtcbiAgdmFyIGNvZWZmaWNpZW50ID0gZFswXSxcbiAgICAgIGV4cG9uZW50ID0gZFsxXTtcbiAgcmV0dXJuIGV4cG9uZW50IDwgMCA/IFwiMC5cIiArIG5ldyBBcnJheSgtZXhwb25lbnQpLmpvaW4oXCIwXCIpICsgY29lZmZpY2llbnRcbiAgICAgIDogY29lZmZpY2llbnQubGVuZ3RoID4gZXhwb25lbnQgKyAxID8gY29lZmZpY2llbnQuc2xpY2UoMCwgZXhwb25lbnQgKyAxKSArIFwiLlwiICsgY29lZmZpY2llbnQuc2xpY2UoZXhwb25lbnQgKyAxKVxuICAgICAgOiBjb2VmZmljaWVudCArIG5ldyBBcnJheShleHBvbmVudCAtIGNvZWZmaWNpZW50Lmxlbmd0aCArIDIpLmpvaW4oXCIwXCIpO1xufVxuIiwiaW1wb3J0IGZvcm1hdERlY2ltYWwgZnJvbSBcIi4vZm9ybWF0RGVjaW1hbC5qc1wiO1xuaW1wb3J0IGZvcm1hdFByZWZpeEF1dG8gZnJvbSBcIi4vZm9ybWF0UHJlZml4QXV0by5qc1wiO1xuaW1wb3J0IGZvcm1hdFJvdW5kZWQgZnJvbSBcIi4vZm9ybWF0Um91bmRlZC5qc1wiO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIFwiJVwiOiBmdW5jdGlvbih4LCBwKSB7IHJldHVybiAoeCAqIDEwMCkudG9GaXhlZChwKTsgfSxcbiAgXCJiXCI6IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIE1hdGgucm91bmQoeCkudG9TdHJpbmcoMik7IH0sXG4gIFwiY1wiOiBmdW5jdGlvbih4KSB7IHJldHVybiB4ICsgXCJcIjsgfSxcbiAgXCJkXCI6IGZvcm1hdERlY2ltYWwsXG4gIFwiZVwiOiBmdW5jdGlvbih4LCBwKSB7IHJldHVybiB4LnRvRXhwb25lbnRpYWwocCk7IH0sXG4gIFwiZlwiOiBmdW5jdGlvbih4LCBwKSB7IHJldHVybiB4LnRvRml4ZWQocCk7IH0sXG4gIFwiZ1wiOiBmdW5jdGlvbih4LCBwKSB7IHJldHVybiB4LnRvUHJlY2lzaW9uKHApOyB9LFxuICBcIm9cIjogZnVuY3Rpb24oeCkgeyByZXR1cm4gTWF0aC5yb3VuZCh4KS50b1N0cmluZyg4KTsgfSxcbiAgXCJwXCI6IGZ1bmN0aW9uKHgsIHApIHsgcmV0dXJuIGZvcm1hdFJvdW5kZWQoeCAqIDEwMCwgcCk7IH0sXG4gIFwiclwiOiBmb3JtYXRSb3VuZGVkLFxuICBcInNcIjogZm9ybWF0UHJlZml4QXV0byxcbiAgXCJYXCI6IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIE1hdGgucm91bmQoeCkudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7IH0sXG4gIFwieFwiOiBmdW5jdGlvbih4KSB7IHJldHVybiBNYXRoLnJvdW5kKHgpLnRvU3RyaW5nKDE2KTsgfVxufTtcbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIHg7XG59XG4iLCJpbXBvcnQgZXhwb25lbnQgZnJvbSBcIi4vZXhwb25lbnQuanNcIjtcbmltcG9ydCBmb3JtYXRHcm91cCBmcm9tIFwiLi9mb3JtYXRHcm91cC5qc1wiO1xuaW1wb3J0IGZvcm1hdE51bWVyYWxzIGZyb20gXCIuL2Zvcm1hdE51bWVyYWxzLmpzXCI7XG5pbXBvcnQgZm9ybWF0U3BlY2lmaWVyIGZyb20gXCIuL2Zvcm1hdFNwZWNpZmllci5qc1wiO1xuaW1wb3J0IGZvcm1hdFRyaW0gZnJvbSBcIi4vZm9ybWF0VHJpbS5qc1wiO1xuaW1wb3J0IGZvcm1hdFR5cGVzIGZyb20gXCIuL2Zvcm1hdFR5cGVzLmpzXCI7XG5pbXBvcnQge3ByZWZpeEV4cG9uZW50fSBmcm9tIFwiLi9mb3JtYXRQcmVmaXhBdXRvLmpzXCI7XG5pbXBvcnQgaWRlbnRpdHkgZnJvbSBcIi4vaWRlbnRpdHkuanNcIjtcblxudmFyIG1hcCA9IEFycmF5LnByb3RvdHlwZS5tYXAsXG4gICAgcHJlZml4ZXMgPSBbXCJ5XCIsXCJ6XCIsXCJhXCIsXCJmXCIsXCJwXCIsXCJuXCIsXCLCtVwiLFwibVwiLFwiXCIsXCJrXCIsXCJNXCIsXCJHXCIsXCJUXCIsXCJQXCIsXCJFXCIsXCJaXCIsXCJZXCJdO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihsb2NhbGUpIHtcbiAgdmFyIGdyb3VwID0gbG9jYWxlLmdyb3VwaW5nID09PSB1bmRlZmluZWQgfHwgbG9jYWxlLnRob3VzYW5kcyA9PT0gdW5kZWZpbmVkID8gaWRlbnRpdHkgOiBmb3JtYXRHcm91cChtYXAuY2FsbChsb2NhbGUuZ3JvdXBpbmcsIE51bWJlciksIGxvY2FsZS50aG91c2FuZHMgKyBcIlwiKSxcbiAgICAgIGN1cnJlbmN5UHJlZml4ID0gbG9jYWxlLmN1cnJlbmN5ID09PSB1bmRlZmluZWQgPyBcIlwiIDogbG9jYWxlLmN1cnJlbmN5WzBdICsgXCJcIixcbiAgICAgIGN1cnJlbmN5U3VmZml4ID0gbG9jYWxlLmN1cnJlbmN5ID09PSB1bmRlZmluZWQgPyBcIlwiIDogbG9jYWxlLmN1cnJlbmN5WzFdICsgXCJcIixcbiAgICAgIGRlY2ltYWwgPSBsb2NhbGUuZGVjaW1hbCA9PT0gdW5kZWZpbmVkID8gXCIuXCIgOiBsb2NhbGUuZGVjaW1hbCArIFwiXCIsXG4gICAgICBudW1lcmFscyA9IGxvY2FsZS5udW1lcmFscyA9PT0gdW5kZWZpbmVkID8gaWRlbnRpdHkgOiBmb3JtYXROdW1lcmFscyhtYXAuY2FsbChsb2NhbGUubnVtZXJhbHMsIFN0cmluZykpLFxuICAgICAgcGVyY2VudCA9IGxvY2FsZS5wZXJjZW50ID09PSB1bmRlZmluZWQgPyBcIiVcIiA6IGxvY2FsZS5wZXJjZW50ICsgXCJcIixcbiAgICAgIG1pbnVzID0gbG9jYWxlLm1pbnVzID09PSB1bmRlZmluZWQgPyBcIi1cIiA6IGxvY2FsZS5taW51cyArIFwiXCIsXG4gICAgICBuYW4gPSBsb2NhbGUubmFuID09PSB1bmRlZmluZWQgPyBcIk5hTlwiIDogbG9jYWxlLm5hbiArIFwiXCI7XG5cbiAgZnVuY3Rpb24gbmV3Rm9ybWF0KHNwZWNpZmllcikge1xuICAgIHNwZWNpZmllciA9IGZvcm1hdFNwZWNpZmllcihzcGVjaWZpZXIpO1xuXG4gICAgdmFyIGZpbGwgPSBzcGVjaWZpZXIuZmlsbCxcbiAgICAgICAgYWxpZ24gPSBzcGVjaWZpZXIuYWxpZ24sXG4gICAgICAgIHNpZ24gPSBzcGVjaWZpZXIuc2lnbixcbiAgICAgICAgc3ltYm9sID0gc3BlY2lmaWVyLnN5bWJvbCxcbiAgICAgICAgemVybyA9IHNwZWNpZmllci56ZXJvLFxuICAgICAgICB3aWR0aCA9IHNwZWNpZmllci53aWR0aCxcbiAgICAgICAgY29tbWEgPSBzcGVjaWZpZXIuY29tbWEsXG4gICAgICAgIHByZWNpc2lvbiA9IHNwZWNpZmllci5wcmVjaXNpb24sXG4gICAgICAgIHRyaW0gPSBzcGVjaWZpZXIudHJpbSxcbiAgICAgICAgdHlwZSA9IHNwZWNpZmllci50eXBlO1xuXG4gICAgLy8gVGhlIFwiblwiIHR5cGUgaXMgYW4gYWxpYXMgZm9yIFwiLGdcIi5cbiAgICBpZiAodHlwZSA9PT0gXCJuXCIpIGNvbW1hID0gdHJ1ZSwgdHlwZSA9IFwiZ1wiO1xuXG4gICAgLy8gVGhlIFwiXCIgdHlwZSwgYW5kIGFueSBpbnZhbGlkIHR5cGUsIGlzIGFuIGFsaWFzIGZvciBcIi4xMn5nXCIuXG4gICAgZWxzZSBpZiAoIWZvcm1hdFR5cGVzW3R5cGVdKSBwcmVjaXNpb24gPT09IHVuZGVmaW5lZCAmJiAocHJlY2lzaW9uID0gMTIpLCB0cmltID0gdHJ1ZSwgdHlwZSA9IFwiZ1wiO1xuXG4gICAgLy8gSWYgemVybyBmaWxsIGlzIHNwZWNpZmllZCwgcGFkZGluZyBnb2VzIGFmdGVyIHNpZ24gYW5kIGJlZm9yZSBkaWdpdHMuXG4gICAgaWYgKHplcm8gfHwgKGZpbGwgPT09IFwiMFwiICYmIGFsaWduID09PSBcIj1cIikpIHplcm8gPSB0cnVlLCBmaWxsID0gXCIwXCIsIGFsaWduID0gXCI9XCI7XG5cbiAgICAvLyBDb21wdXRlIHRoZSBwcmVmaXggYW5kIHN1ZmZpeC5cbiAgICAvLyBGb3IgU0ktcHJlZml4LCB0aGUgc3VmZml4IGlzIGxhemlseSBjb21wdXRlZC5cbiAgICB2YXIgcHJlZml4ID0gc3ltYm9sID09PSBcIiRcIiA/IGN1cnJlbmN5UHJlZml4IDogc3ltYm9sID09PSBcIiNcIiAmJiAvW2JveFhdLy50ZXN0KHR5cGUpID8gXCIwXCIgKyB0eXBlLnRvTG93ZXJDYXNlKCkgOiBcIlwiLFxuICAgICAgICBzdWZmaXggPSBzeW1ib2wgPT09IFwiJFwiID8gY3VycmVuY3lTdWZmaXggOiAvWyVwXS8udGVzdCh0eXBlKSA/IHBlcmNlbnQgOiBcIlwiO1xuXG4gICAgLy8gV2hhdCBmb3JtYXQgZnVuY3Rpb24gc2hvdWxkIHdlIHVzZT9cbiAgICAvLyBJcyB0aGlzIGFuIGludGVnZXIgdHlwZT9cbiAgICAvLyBDYW4gdGhpcyB0eXBlIGdlbmVyYXRlIGV4cG9uZW50aWFsIG5vdGF0aW9uP1xuICAgIHZhciBmb3JtYXRUeXBlID0gZm9ybWF0VHlwZXNbdHlwZV0sXG4gICAgICAgIG1heWJlU3VmZml4ID0gL1tkZWZncHJzJV0vLnRlc3QodHlwZSk7XG5cbiAgICAvLyBTZXQgdGhlIGRlZmF1bHQgcHJlY2lzaW9uIGlmIG5vdCBzcGVjaWZpZWQsXG4gICAgLy8gb3IgY2xhbXAgdGhlIHNwZWNpZmllZCBwcmVjaXNpb24gdG8gdGhlIHN1cHBvcnRlZCByYW5nZS5cbiAgICAvLyBGb3Igc2lnbmlmaWNhbnQgcHJlY2lzaW9uLCBpdCBtdXN0IGJlIGluIFsxLCAyMV0uXG4gICAgLy8gRm9yIGZpeGVkIHByZWNpc2lvbiwgaXQgbXVzdCBiZSBpbiBbMCwgMjBdLlxuICAgIHByZWNpc2lvbiA9IHByZWNpc2lvbiA9PT0gdW5kZWZpbmVkID8gNlxuICAgICAgICA6IC9bZ3Byc10vLnRlc3QodHlwZSkgPyBNYXRoLm1heCgxLCBNYXRoLm1pbigyMSwgcHJlY2lzaW9uKSlcbiAgICAgICAgOiBNYXRoLm1heCgwLCBNYXRoLm1pbigyMCwgcHJlY2lzaW9uKSk7XG5cbiAgICBmdW5jdGlvbiBmb3JtYXQodmFsdWUpIHtcbiAgICAgIHZhciB2YWx1ZVByZWZpeCA9IHByZWZpeCxcbiAgICAgICAgICB2YWx1ZVN1ZmZpeCA9IHN1ZmZpeCxcbiAgICAgICAgICBpLCBuLCBjO1xuXG4gICAgICBpZiAodHlwZSA9PT0gXCJjXCIpIHtcbiAgICAgICAgdmFsdWVTdWZmaXggPSBmb3JtYXRUeXBlKHZhbHVlKSArIHZhbHVlU3VmZml4O1xuICAgICAgICB2YWx1ZSA9IFwiXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9ICt2YWx1ZTtcblxuICAgICAgICAvLyBEZXRlcm1pbmUgdGhlIHNpZ24uIC0wIGlzIG5vdCBsZXNzIHRoYW4gMCwgYnV0IDEgLyAtMCBpcyFcbiAgICAgICAgdmFyIHZhbHVlTmVnYXRpdmUgPSB2YWx1ZSA8IDAgfHwgMSAvIHZhbHVlIDwgMDtcblxuICAgICAgICAvLyBQZXJmb3JtIHRoZSBpbml0aWFsIGZvcm1hdHRpbmcuXG4gICAgICAgIHZhbHVlID0gaXNOYU4odmFsdWUpID8gbmFuIDogZm9ybWF0VHlwZShNYXRoLmFicyh2YWx1ZSksIHByZWNpc2lvbik7XG5cbiAgICAgICAgLy8gVHJpbSBpbnNpZ25pZmljYW50IHplcm9zLlxuICAgICAgICBpZiAodHJpbSkgdmFsdWUgPSBmb3JtYXRUcmltKHZhbHVlKTtcblxuICAgICAgICAvLyBJZiBhIG5lZ2F0aXZlIHZhbHVlIHJvdW5kcyB0byB6ZXJvIGFmdGVyIGZvcm1hdHRpbmcsIGFuZCBubyBleHBsaWNpdCBwb3NpdGl2ZSBzaWduIGlzIHJlcXVlc3RlZCwgaGlkZSB0aGUgc2lnbi5cbiAgICAgICAgaWYgKHZhbHVlTmVnYXRpdmUgJiYgK3ZhbHVlID09PSAwICYmIHNpZ24gIT09IFwiK1wiKSB2YWx1ZU5lZ2F0aXZlID0gZmFsc2U7XG5cbiAgICAgICAgLy8gQ29tcHV0ZSB0aGUgcHJlZml4IGFuZCBzdWZmaXguXG4gICAgICAgIHZhbHVlUHJlZml4ID0gKHZhbHVlTmVnYXRpdmUgPyAoc2lnbiA9PT0gXCIoXCIgPyBzaWduIDogbWludXMpIDogc2lnbiA9PT0gXCItXCIgfHwgc2lnbiA9PT0gXCIoXCIgPyBcIlwiIDogc2lnbikgKyB2YWx1ZVByZWZpeDtcbiAgICAgICAgdmFsdWVTdWZmaXggPSAodHlwZSA9PT0gXCJzXCIgPyBwcmVmaXhlc1s4ICsgcHJlZml4RXhwb25lbnQgLyAzXSA6IFwiXCIpICsgdmFsdWVTdWZmaXggKyAodmFsdWVOZWdhdGl2ZSAmJiBzaWduID09PSBcIihcIiA/IFwiKVwiIDogXCJcIik7XG5cbiAgICAgICAgLy8gQnJlYWsgdGhlIGZvcm1hdHRlZCB2YWx1ZSBpbnRvIHRoZSBpbnRlZ2VyIOKAnHZhbHVl4oCdIHBhcnQgdGhhdCBjYW4gYmVcbiAgICAgICAgLy8gZ3JvdXBlZCwgYW5kIGZyYWN0aW9uYWwgb3IgZXhwb25lbnRpYWwg4oCcc3VmZml44oCdIHBhcnQgdGhhdCBpcyBub3QuXG4gICAgICAgIGlmIChtYXliZVN1ZmZpeCkge1xuICAgICAgICAgIGkgPSAtMSwgbiA9IHZhbHVlLmxlbmd0aDtcbiAgICAgICAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgICAgICAgaWYgKGMgPSB2YWx1ZS5jaGFyQ29kZUF0KGkpLCA0OCA+IGMgfHwgYyA+IDU3KSB7XG4gICAgICAgICAgICAgIHZhbHVlU3VmZml4ID0gKGMgPT09IDQ2ID8gZGVjaW1hbCArIHZhbHVlLnNsaWNlKGkgKyAxKSA6IHZhbHVlLnNsaWNlKGkpKSArIHZhbHVlU3VmZml4O1xuICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnNsaWNlKDAsIGkpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIGZpbGwgY2hhcmFjdGVyIGlzIG5vdCBcIjBcIiwgZ3JvdXBpbmcgaXMgYXBwbGllZCBiZWZvcmUgcGFkZGluZy5cbiAgICAgIGlmIChjb21tYSAmJiAhemVybykgdmFsdWUgPSBncm91cCh2YWx1ZSwgSW5maW5pdHkpO1xuXG4gICAgICAvLyBDb21wdXRlIHRoZSBwYWRkaW5nLlxuICAgICAgdmFyIGxlbmd0aCA9IHZhbHVlUHJlZml4Lmxlbmd0aCArIHZhbHVlLmxlbmd0aCArIHZhbHVlU3VmZml4Lmxlbmd0aCxcbiAgICAgICAgICBwYWRkaW5nID0gbGVuZ3RoIDwgd2lkdGggPyBuZXcgQXJyYXkod2lkdGggLSBsZW5ndGggKyAxKS5qb2luKGZpbGwpIDogXCJcIjtcblxuICAgICAgLy8gSWYgdGhlIGZpbGwgY2hhcmFjdGVyIGlzIFwiMFwiLCBncm91cGluZyBpcyBhcHBsaWVkIGFmdGVyIHBhZGRpbmcuXG4gICAgICBpZiAoY29tbWEgJiYgemVybykgdmFsdWUgPSBncm91cChwYWRkaW5nICsgdmFsdWUsIHBhZGRpbmcubGVuZ3RoID8gd2lkdGggLSB2YWx1ZVN1ZmZpeC5sZW5ndGggOiBJbmZpbml0eSksIHBhZGRpbmcgPSBcIlwiO1xuXG4gICAgICAvLyBSZWNvbnN0cnVjdCB0aGUgZmluYWwgb3V0cHV0IGJhc2VkIG9uIHRoZSBkZXNpcmVkIGFsaWdubWVudC5cbiAgICAgIHN3aXRjaCAoYWxpZ24pIHtcbiAgICAgICAgY2FzZSBcIjxcIjogdmFsdWUgPSB2YWx1ZVByZWZpeCArIHZhbHVlICsgdmFsdWVTdWZmaXggKyBwYWRkaW5nOyBicmVhaztcbiAgICAgICAgY2FzZSBcIj1cIjogdmFsdWUgPSB2YWx1ZVByZWZpeCArIHBhZGRpbmcgKyB2YWx1ZSArIHZhbHVlU3VmZml4OyBicmVhaztcbiAgICAgICAgY2FzZSBcIl5cIjogdmFsdWUgPSBwYWRkaW5nLnNsaWNlKDAsIGxlbmd0aCA9IHBhZGRpbmcubGVuZ3RoID4+IDEpICsgdmFsdWVQcmVmaXggKyB2YWx1ZSArIHZhbHVlU3VmZml4ICsgcGFkZGluZy5zbGljZShsZW5ndGgpOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDogdmFsdWUgPSBwYWRkaW5nICsgdmFsdWVQcmVmaXggKyB2YWx1ZSArIHZhbHVlU3VmZml4OyBicmVhaztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG51bWVyYWxzKHZhbHVlKTtcbiAgICB9XG5cbiAgICBmb3JtYXQudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBzcGVjaWZpZXIgKyBcIlwiO1xuICAgIH07XG5cbiAgICByZXR1cm4gZm9ybWF0O1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0UHJlZml4KHNwZWNpZmllciwgdmFsdWUpIHtcbiAgICB2YXIgZiA9IG5ld0Zvcm1hdCgoc3BlY2lmaWVyID0gZm9ybWF0U3BlY2lmaWVyKHNwZWNpZmllciksIHNwZWNpZmllci50eXBlID0gXCJmXCIsIHNwZWNpZmllcikpLFxuICAgICAgICBlID0gTWF0aC5tYXgoLTgsIE1hdGgubWluKDgsIE1hdGguZmxvb3IoZXhwb25lbnQodmFsdWUpIC8gMykpKSAqIDMsXG4gICAgICAgIGsgPSBNYXRoLnBvdygxMCwgLWUpLFxuICAgICAgICBwcmVmaXggPSBwcmVmaXhlc1s4ICsgZSAvIDNdO1xuICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIGYoayAqIHZhbHVlKSArIHByZWZpeDtcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBmb3JtYXQ6IG5ld0Zvcm1hdCxcbiAgICBmb3JtYXRQcmVmaXg6IGZvcm1hdFByZWZpeFxuICB9O1xufVxuIiwiaW1wb3J0IGZvcm1hdExvY2FsZSBmcm9tIFwiLi9sb2NhbGUuanNcIjtcblxudmFyIGxvY2FsZTtcbmV4cG9ydCB2YXIgZm9ybWF0O1xuZXhwb3J0IHZhciBmb3JtYXRQcmVmaXg7XG5cbmRlZmF1bHRMb2NhbGUoe1xuICBkZWNpbWFsOiBcIi5cIixcbiAgdGhvdXNhbmRzOiBcIixcIixcbiAgZ3JvdXBpbmc6IFszXSxcbiAgY3VycmVuY3k6IFtcIiRcIiwgXCJcIl0sXG4gIG1pbnVzOiBcIi1cIlxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRlZmF1bHRMb2NhbGUoZGVmaW5pdGlvbikge1xuICBsb2NhbGUgPSBmb3JtYXRMb2NhbGUoZGVmaW5pdGlvbik7XG4gIGZvcm1hdCA9IGxvY2FsZS5mb3JtYXQ7XG4gIGZvcm1hdFByZWZpeCA9IGxvY2FsZS5mb3JtYXRQcmVmaXg7XG4gIHJldHVybiBsb2NhbGU7XG59XG4iLCIvKiBnbG9iYWwgdmFsdWVzIGZpbHRlckRpbSwgcm9pRGltLCBsYWtlcywgYWdlbmNpZXMsIGp1cmlzZGljdGlvbnMsIHN0YXRlUHJvdiwgc3BlY2llc19saXN0LCBzdHJhaW5zLCBsaWZlc3RhZ2VzLCBzdG9ja2luZ01ldGhvZHMgKi9cblxuaW1wb3J0IGNyb3NzZmlsdGVyIGZyb20gXCJjcm9zc2ZpbHRlcjJcIjtcbmltcG9ydCB7IHNlbGVjdCwgc2VsZWN0QWxsLCBmb3JtYXQgfSBmcm9tIFwiZDNcIjtcblxuLy8gc29tZSBjb25zdGFudHM6XG5cbmxldCBjb21tYUZvcm1hdCA9IGZvcm1hdChcIixkXCIpO1xubGV0IGZpcnN0WWVhciA9IFwiXCI7XG5sZXQgbGFzdFllYXIgPSBcIlwiO1xuXG5jb25zdCBtb250aF9sb29rdXAgPSB7XG4gIDE6IFwiSmFudWFyeVwiLFxuICAyOiBcIkZlYnJ1YXJ5XCIsXG4gIDM6IFwiTWFyY2hcIixcbiAgNDogXCJBcHJpbFwiLFxuICA1OiBcIk1heVwiLFxuICA2OiBcIkp1bmVcIixcbiAgNzogXCJKdWx5XCIsXG4gIDg6IFwiQXVndXN0XCIsXG4gIDk6IFwiU2VwdGVtYmVyXCIsXG4gIDEwOiBcIk9jdG9iZXJcIixcbiAgMTE6IFwiTm92ZW1iZXJcIixcbiAgMTI6IFwiRGVjZW1iZXJcIixcbiAgMDogXCJVbmtub3duL05vdCBSZXBvcnRlZFwiLFxufTtcblxuLy8gYSBsaXR0bGUgc2NydWJiaW5nOlxudmFsdWVzLmZvckVhY2goKGQpID0+IHtcbiAgZC5tb250aCA9IGQubW9udGggPyBcIlwiICsgZC5tb250aCA6IFwiMFwiO1xuICBkLnllYXIgPSBwYXJzZUludChkLnllYXIpO1xuICBkLmV2ZW50cyA9IHBhcnNlSW50KGQuZXZlbnRzKTtcbiAgZC5zdHJhaW4gPSBkLnN0cmFpbiArIFwiXCI7XG4gIHJldHVybiBkO1xufSk7XG5cbi8vIGNyZWF0ZSBvdXIgbG9va3VwIHRhYmxlc1xuXG5jb25zdCBsYWtlX2xvb2t1cCA9IGxha2VzLnJlZHVjZSgoYWNjdW11bGF0b3IsIGQpID0+IHtcbiAgYWNjdW11bGF0b3JbZFswXV0gPSBkWzFdO1xuICByZXR1cm4gYWNjdW11bGF0b3I7XG59LCB7fSk7XG5cbmNvbnN0IGFnZW5jeV9sb29rdXAgPSBhZ2VuY2llcy5yZWR1Y2UoKGFjY3VtdWxhdG9yLCBkKSA9PiB7XG4gIGFjY3VtdWxhdG9yW2RbMF1dID0gZFsxXTtcbiAgcmV0dXJuIGFjY3VtdWxhdG9yO1xufSwge30pO1xuXG5jb25zdCBqdXJpc2RpY3Rpb25fbG9va3VwID0ganVyaXNkaWN0aW9ucy5yZWR1Y2UoKGFjY3VtdWxhdG9yLCBkKSA9PiB7XG4gIGFjY3VtdWxhdG9yW2RbMF1dID0gZFsxXTtcbiAgcmV0dXJuIGFjY3VtdWxhdG9yO1xufSwge30pO1xuXG5jb25zdCBzdGF0ZVByb3ZfbG9va3VwID0gc3RhdGVQcm92LnJlZHVjZSgoYWNjdW11bGF0b3IsIGQpID0+IHtcbiAgYWNjdW11bGF0b3JbZFswXV0gPSBkWzFdO1xuICByZXR1cm4gYWNjdW11bGF0b3I7XG59LCB7fSk7XG5cbmNvbnN0IHNwZWNpZXNfbG9va3VwID0gc3BlY2llc19saXN0LnJlZHVjZSgoYWNjdW11bGF0b3IsIGQpID0+IHtcbiAgYWNjdW11bGF0b3JbZFswXV0gPSBkWzFdO1xuICByZXR1cm4gYWNjdW11bGF0b3I7XG59LCB7fSk7XG5cbmNvbnN0IHN0cmFpbl9sb29rdXAgPSBzdHJhaW5zLnJlZHVjZSgoYWNjdW11bGF0b3IsIGQpID0+IHtcbiAgYWNjdW11bGF0b3JbZFswXV0gPSBkWzFdO1xuICByZXR1cm4gYWNjdW11bGF0b3I7XG59LCB7fSk7XG5cbmNvbnN0IGxpZmVzdGFnZV9sb29rdXAgPSBsaWZlc3RhZ2VzLnJlZHVjZSgoYWNjdW11bGF0b3IsIGQpID0+IHtcbiAgYWNjdW11bGF0b3JbZFswXV0gPSBkWzFdO1xuICByZXR1cm4gYWNjdW11bGF0b3I7XG59LCB7fSk7XG5cbmNvbnN0IG1ldGhvZF9sb29rdXAgPSBzdG9ja2luZ01ldGhvZHMucmVkdWNlKChhY2N1bXVsYXRvciwgZCkgPT4ge1xuICBhY2N1bXVsYXRvcltkWzBdXSA9IGRbMV07XG4gIHJldHVybiBhY2N1bXVsYXRvcjtcbn0sIHt9KTtcblxuLy8gbGV0IG1hblVuaXRfbG9va3VwID0ge307XG4vLyBtYW5hZ2VtZW50VW5pdHMuZm9yRWFjaChcbi8vICAgZCA9PiAobWFuVW5pdF9sb29rdXBbZC5zbHVnXSA9IGAke2QuZGVzY3JpcHRpb259ICgke2QubGFiZWx9KWApXG4vLyApO1xuXG5jb25zdCBnZXRfc2VsZWN0aW9ucyA9IGZ1bmN0aW9uICh3aWRnZXQsIHdoYXQgPSBcInZhbHVlXCIpIHtcbiAgbGV0IHNlbGVjdGVkID0gW107XG4gIGlmICh3aWRnZXQuc2VsZWN0ZWRJbmRleCA+PSAwKSB7XG4gICAgZm9yIChsZXQgaSA9IHdpZGdldC5zZWxlY3RlZEluZGV4OyBpIDwgd2lkZ2V0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAod2lkZ2V0Lm9wdGlvbnNbaV0uc2VsZWN0ZWQpIHtcbiAgICAgICAgc2VsZWN0ZWQucHVzaCh3aWRnZXQub3B0aW9uc1tpXVt3aGF0XSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHNlbGVjdGVkO1xufTtcblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vICAgICAgICAgICBIZWxwZXIgRnVuY3Rpb25zXG5cbi8vIGdldCB0aGUgb3B0aW9ucyB0aGF0IGFyZSBzdGlsbCBhdmFpbGFibGUgaW4gYSBncm91cFxuLy8gZ2l2ZW4gdGhlIGFjdGl2ZSBmaWx0ZXJzOlxuY29uc3QgZ2V0X29wdGlvbnMgPSAoZ3JwKSA9PlxuICBncnBcbiAgICAudG9wKEluZmluaXR5KVxuICAgIC5maWx0ZXIoKGQpID0+IGQudmFsdWUgPiAwKVxuICAgIC5tYXAoKGQpID0+IGQua2V5KTtcblxuLy8gdXBkYXRlIHRoZSBvcHRpb25zIGdpdmVuIGEgc2VsZWN0b3IsIHRoZSBvcHRpb25zLCBhbmQgYSBsb29rdXAgdGFibGVcbmNvbnN0IHVwZGF0ZV9vcHRpb25zID0gKHNlbGVjdG9yLCBvcHRpb25fZGF0YSwgbG9va3VwLCBzb3J0S2V5ID0gXCJsYWJlbFwiKSA9PiB7XG4gIGxldCBvcHRpb25zID0gc2VsZWN0KHNlbGVjdG9yKVxuICAgIC5zZWxlY3RBbGwoXCJvcHRpb25cIilcbiAgICAuZGF0YShvcHRpb25fZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkID8gZCA6IHRoaXMudmFsdWU7XG4gICAgfSk7XG5cbiAgb3B0aW9ucy5leGl0KCkucmVtb3ZlKCk7XG5cbiAgbGV0IG9wdGlvbnNFbnRlciA9IG9wdGlvbnNcbiAgICAuZW50ZXIoKVxuICAgIC5hcHBlbmQoXCJvcHRpb25cIilcbiAgICAudGV4dCgoZCkgPT4gbG9va3VwW2RdKVxuICAgIC5hdHRyKFwidmFsdWVcIiwgKGQpID0+IGQpO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zLm1lcmdlKG9wdGlvbnNFbnRlcik7XG5cbiAgaWYgKHNvcnRLZXkgPT09IFwibGFiZWxcIikge1xuICAgIG9wdGlvbnMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgcmV0dXJuIGxvb2t1cFthXS5sb2NhbGVDb21wYXJlKGxvb2t1cFtiXSk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgb3B0aW9ucy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICByZXR1cm4gYSAtIGI7XG4gICAgfSk7XG4gIH1cbn07XG5cbi8vY29uc3QgZmlsdGVyRGltID0gKGRpbWVuc2lvbiwgc2VsZWN0ZWQpID0+IHtcbi8vICBpZiAoc2VsZWN0ZWQubGVuZ3RoKSB7XG4vLyAgICBkaW1lbnNpb24uZmlsdGVyKChkKSA9PiBzZWxlY3RlZC5pbmRleE9mKGQpID4gLTEpO1xuLy8gIH0gZWxzZSB7XG4vLyAgICBkaW1lbnNpb24uZmlsdGVyQWxsKCk7XG4vLyAgfVxuLy99O1xuLy9cbi8vIG5vdyB3ZSBhcmUgZ29pbmcgdG8gc2V0IHVwIG91ciBjcm9zc2ZpbHRlclxuXG5sZXQgbmR4ID0gY3Jvc3NmaWx0ZXIodmFsdWVzKTtcblxubGV0IGFsbCA9IG5keC5ncm91cEFsbCgpLnJlZHVjZVN1bSgoZCkgPT4gZC5ldmVudHMpO1xuXG5sZXQgeWVhckRpbSA9IG5keC5kaW1lbnNpb24oKGQpID0+IGQueWVhcik7XG5sZXQgbW9udGhEaW0gPSBuZHguZGltZW5zaW9uKChkKSA9PiBkLm1vbnRoKTtcbmxldCBsYWtlRGltID0gbmR4LmRpbWVuc2lvbigoZCkgPT4gZC5sYWtlKTtcbmxldCBqdXJpc2RpY3Rpb25EaW0gPSBuZHguZGltZW5zaW9uKChkKSA9PiBkLmp1cmlzZCk7XG4vL3JvaURpbSA9IG5keC5kaW1lbnNpb24oKGQpID0+IGQuanVyaXNkKTtcbnJvaURpbSA9IG5keC5kaW1lbnNpb24oKGQpID0+IGQubWFuVW5pdCk7XG5sZXQgc3RhdGVEaW0gPSBuZHguZGltZW5zaW9uKChkKSA9PiBkLnN0YXRlKTtcbmxldCBhZ2VuY3lEaW0gPSBuZHguZGltZW5zaW9uKChkKSA9PiBkLmFnZW5jeV9jb2RlKTtcbmxldCBzcGVjaWVzRGltID0gbmR4LmRpbWVuc2lvbigoZCkgPT4gZC5zcGMpO1xubGV0IHN0cmFpbkRpbSA9IG5keC5kaW1lbnNpb24oKGQpID0+IGQuc3RyYWluKTtcbmxldCBtYXJrRGltID0gbmR4LmRpbWVuc2lvbigoZCkgPT4gZC5tYXJrKTtcbmxldCBtZXRob2REaW0gPSBuZHguZGltZW5zaW9uKChkKSA9PiBkLm1ldGhvZCk7XG5sZXQgc3RhZ2VEaW0gPSBuZHguZGltZW5zaW9uKChkKSA9PiBkLnN0YWdlKTtcblxuLy8gc2V0IHVwIG91ciBncm91cHNcbmxldCB5ZWFyR3JvdXAgPSB5ZWFyRGltLmdyb3VwKCkucmVkdWNlU3VtKChkKSA9PiBkLmV2ZW50cyk7XG5sZXQgbW9udGhHcm91cCA9IG1vbnRoRGltLmdyb3VwKCkucmVkdWNlU3VtKChkKSA9PiBkLmV2ZW50cyk7XG5sZXQgbGFrZUdyb3VwID0gbGFrZURpbS5ncm91cCgpLnJlZHVjZVN1bSgoZCkgPT4gZC5ldmVudHMpO1xubGV0IGp1cmlzZGljdGlvbkdyb3VwID0ganVyaXNkaWN0aW9uRGltLmdyb3VwKCkucmVkdWNlU3VtKChkKSA9PiBkLmV2ZW50cyk7XG5sZXQgcm9pR3JvdXAgPSByb2lEaW0uZ3JvdXAoKS5yZWR1Y2VTdW0oKGQpID0+IGQuZXZlbnRzKTtcbmxldCBzdGF0ZUdyb3VwID0gc3RhdGVEaW0uZ3JvdXAoKS5yZWR1Y2VTdW0oKGQpID0+IGQuZXZlbnRzKTtcbmxldCBhZ2VuY3lHcm91cCA9IGFnZW5jeURpbS5ncm91cCgpLnJlZHVjZVN1bSgoZCkgPT4gZC5ldmVudHMpO1xubGV0IHNwZWNpZXNHcm91cCA9IHNwZWNpZXNEaW0uZ3JvdXAoKS5yZWR1Y2VTdW0oKGQpID0+IGQuZXZlbnRzKTtcbmxldCBzdHJhaW5Hcm91cCA9IHN0cmFpbkRpbS5ncm91cCgpLnJlZHVjZVN1bSgoZCkgPT4gZC5ldmVudHMpO1xubGV0IG1hcmtHcm91cCA9IG1hcmtEaW0uZ3JvdXAoKS5yZWR1Y2VTdW0oKGQpID0+IGQuZXZlbnRzKTtcbmxldCBtZXRob2RHcm91cCA9IG1ldGhvZERpbS5ncm91cCgpLnJlZHVjZVN1bSgoZCkgPT4gZC5ldmVudHMpO1xubGV0IHN0YWdlR3JvdXAgPSBzdGFnZURpbS5ncm91cCgpLnJlZHVjZVN1bSgoZCkgPT4gZC5ldmVudHMpO1xuXG5jb25zdCB1cGRhdGVfdG90YWwgPSAoKSA9PiB7XG4gIGxldCB0b3RhbCA9IGFsbC52YWx1ZSgpO1xuICBzZWxlY3QoXCIjZXZlbnQtdG90YWxcIilcbiAgICAudGV4dChjb21tYUZvcm1hdCh0b3RhbCkpXG4gICAgLmNsYXNzZWQoXCJ0b3RhbC16ZXJvXCIsIHRvdGFsIDw9IDAgPyB0cnVlIDogZmFsc2UpO1xufTtcblxuY29uc3QgdXBkYXRlX3dpZGdldHMgPSAoKSA9PiB7XG4gIGxldCBvcHRpb25zID0gZ2V0X29wdGlvbnMobGFrZUdyb3VwKTtcbiAgdXBkYXRlX29wdGlvbnMoXCIjaWRfbGFrZVwiLCBvcHRpb25zLCBsYWtlX2xvb2t1cCk7XG5cbiAgb3B0aW9ucyA9IGdldF9vcHRpb25zKG1vbnRoR3JvdXApO1xuICB1cGRhdGVfb3B0aW9ucyhcIiNpZF9tb250aHNcIiwgb3B0aW9ucywgbW9udGhfbG9va3VwLCBcImlkXCIpO1xuXG4gIG9wdGlvbnMgPSBnZXRfb3B0aW9ucyhzdGF0ZUdyb3VwKTtcbiAgdXBkYXRlX29wdGlvbnMoXCIjaWRfc3RhdGVwcm92XCIsIG9wdGlvbnMsIHN0YXRlUHJvdl9sb29rdXApO1xuXG4gIG9wdGlvbnMgPSBnZXRfb3B0aW9ucyhqdXJpc2RpY3Rpb25Hcm91cCk7XG4gIHVwZGF0ZV9vcHRpb25zKFwiI2lkX2p1cmlzZGljdGlvblwiLCBvcHRpb25zLCBqdXJpc2RpY3Rpb25fbG9va3VwKTtcblxuICBvcHRpb25zID0gZ2V0X29wdGlvbnMoYWdlbmN5R3JvdXApO1xuICB1cGRhdGVfb3B0aW9ucyhcIiNpZF9hZ2VuY3lcIiwgb3B0aW9ucywgYWdlbmN5X2xvb2t1cCk7XG5cbiAgb3B0aW9ucyA9IGdldF9vcHRpb25zKHNwZWNpZXNHcm91cCk7XG4gIHVwZGF0ZV9vcHRpb25zKFwiI2lkX3NwZWNpZXNcIiwgb3B0aW9ucywgc3BlY2llc19sb29rdXApO1xuXG4gIG9wdGlvbnMgPSBnZXRfb3B0aW9ucyhzdHJhaW5Hcm91cCk7XG4gIHVwZGF0ZV9vcHRpb25zKFwiI2lkX3N0cmFpblwiLCBvcHRpb25zLCBzdHJhaW5fbG9va3VwKTtcblxuICAvL29wdGlvbnMgPSBnZXRfb3B0aW9ucyhtYXJrR3JvdXApO1xuICAvL3VwZGF0ZV9vcHRpb25zKFwiI2lkX21hcmtcIiwgb3B0aW9ucywgbWFya19sb29rdXApO1xuXG4gIG9wdGlvbnMgPSBnZXRfb3B0aW9ucyhzdGFnZUdyb3VwKTtcbiAgdXBkYXRlX29wdGlvbnMoXCIjaWRfbGlmZV9zdGFnZVwiLCBvcHRpb25zLCBsaWZlc3RhZ2VfbG9va3VwKTtcblxuICBvcHRpb25zID0gZ2V0X29wdGlvbnMobWV0aG9kR3JvdXApO1xuICB1cGRhdGVfb3B0aW9ucyhcIiNpZF9zdG9ja2luZ19tZXRob2RcIiwgb3B0aW9ucywgbWV0aG9kX2xvb2t1cCk7XG5cbiAgdXBkYXRlX3RvdGFsKCk7XG59O1xuXG5uZHgub25DaGFuZ2UoKCkgPT4ge1xuICB1cGRhdGVfd2lkZ2V0cygpO1xufSk7XG5cbi8vaW5pdGFsaXplIGV2ZXJ5dGhpbmc6XG51cGRhdGVfd2lkZ2V0cygpO1xuXG5jb25zdCBmaWx0ZXJZZWFycyA9IChmaXJzdFllYXIsIGxhc3RZZWFyKSA9PiB7XG4gIC8vY2xlYXIgYW55IGV4aXN0aW5nIGZpbHRlcnMgb24geWVhcjpcblxuICBpZiAoZmlyc3RZZWFyICYmIGxhc3RZZWFyKSB7XG4gICAgbGV0IHRvcCA9IHBhcnNlSW50KGxhc3RZZWFyKSArIDE7XG4gICAgeWVhckRpbS5maWx0ZXIoW3BhcnNlSW50KGZpcnN0WWVhciksIHRvcF0pO1xuICB9IGVsc2UgaWYgKGZpcnN0WWVhciAmJiBsYXN0WWVhciA9PT0gXCJcIikge1xuICAgIHllYXJEaW0uZmlsdGVyRnVuY3Rpb24oKGQpID0+IGQgPj0gcGFyc2VJbnQoZmlyc3RZZWFyKSk7XG4gIH0gZWxzZSBpZiAoZmlyc3RZZWFyID09PSBcIlwiICYmIGxhc3RZZWFyKSB7XG4gICAgeWVhckRpbS5maWx0ZXJGdW5jdGlvbigoZCkgPT4gZCA8PSBwYXJzZUludChsYXN0WWVhcikpO1xuICB9IGVsc2Uge1xuICAgIHllYXJEaW0uZmlsdGVyQWxsKCk7XG4gIH1cbn07XG5cbmNvbnN0IGNoZWNrWWVhcnMgPSAoZmlyc3RZZWFyLCBsYXN0WWVhcikgPT4ge1xuICBsZXQgeWVhcklucHV0cyA9IHNlbGVjdEFsbChcIi55ZWFyLWlucHV0XCIpO1xuICBpZiAoZmlyc3RZZWFyICE9PSBcIlwiICYmIGxhc3RZZWFyICE9PSBcIlwiICYmIGZpcnN0WWVhciA+IGxhc3RZZWFyKSB7XG4gICAgeWVhcklucHV0cy5jbGFzc2VkKFwiZXJyb3JcIiwgdHJ1ZSk7XG4gIH0gZWxzZSB7XG4gICAgeWVhcklucHV0cy5jbGFzc2VkKFwiZXJyb3JcIiwgZmFsc2UpO1xuICB9XG59O1xuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gY3JlYXRlIGxpc3RlbmVycyBmb3IgZWFjaCBvZiBvdXIgZm9ybSB3aWRnZXRzXG5cbnNlbGVjdChcIiNpZF9sYWtlXCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcbiAgbGV0IHNlbGVjdGVkID0gZ2V0X3NlbGVjdGlvbnModGhpcyk7XG4gIGZpbHRlckRpbShsYWtlRGltLCBzZWxlY3RlZCk7XG59KTtcblxuc2VsZWN0KFwiI2lkX3N0YXRlcHJvdlwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XG4gIGxldCBzZWxlY3RlZCA9IGdldF9zZWxlY3Rpb25zKHRoaXMpO1xuICBmaWx0ZXJEaW0oc3RhdGVEaW0sIHNlbGVjdGVkKTtcbn0pO1xuXG5zZWxlY3QoXCIjaWRfanVyaXNkaWN0aW9uXCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcbiAgbGV0IHNlbGVjdGVkID0gZ2V0X3NlbGVjdGlvbnModGhpcyk7XG4gIGZpbHRlckRpbShqdXJpc2RpY3Rpb25EaW0sIHNlbGVjdGVkKTtcbn0pO1xuXG5zZWxlY3QoXCIjaWRfZmlyc3RfeWVhclwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XG4gIGZpcnN0WWVhciA9IHRoaXMudmFsdWUgfHwgXCJcIjtcbiAgY2hlY2tZZWFycyhmaXJzdFllYXIsIGxhc3RZZWFyKTtcbiAgZmlsdGVyWWVhcnMoZmlyc3RZZWFyLCBsYXN0WWVhcik7XG59KTtcblxuc2VsZWN0KFwiI2lkX2xhc3RfeWVhclwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XG4gIGxhc3RZZWFyID0gdGhpcy52YWx1ZSB8fCBcIlwiO1xuICBjaGVja1llYXJzKGZpcnN0WWVhciwgbGFzdFllYXIpO1xuICBmaWx0ZXJZZWFycyhmaXJzdFllYXIsIGxhc3RZZWFyKTtcbn0pO1xuXG5zZWxlY3QoXCIjaWRfbW9udGhzXCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcbiAgbGV0IHNlbGVjdGVkID0gZ2V0X3NlbGVjdGlvbnModGhpcyk7XG4gIGZpbHRlckRpbShtb250aERpbSwgc2VsZWN0ZWQpO1xufSk7XG5cbnNlbGVjdChcIiNpZF9hZ2VuY3lcIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xuICBsZXQgc2VsZWN0ZWQgPSBnZXRfc2VsZWN0aW9ucyh0aGlzKTtcbiAgZmlsdGVyRGltKGFnZW5jeURpbSwgc2VsZWN0ZWQpO1xufSk7XG5cbnNlbGVjdChcIiNpZF9zcGVjaWVzXCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcbiAgbGV0IHNlbGVjdGVkID0gZ2V0X3NlbGVjdGlvbnModGhpcyk7XG4gIGZpbHRlckRpbShzcGVjaWVzRGltLCBzZWxlY3RlZCk7XG59KTtcblxuc2VsZWN0KFwiI2lkX3N0cmFpblwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XG4gIGxldCBzZWxlY3RlZCA9IGdldF9zZWxlY3Rpb25zKHRoaXMpO1xuICBmaWx0ZXJEaW0oc3RyYWluRGltLCBzZWxlY3RlZCk7XG59KTtcblxuc2VsZWN0KFwiI2lkX2xpZmVfc3RhZ2VcIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xuICBsZXQgc2VsZWN0ZWQgPSBnZXRfc2VsZWN0aW9ucyh0aGlzKTtcbiAgZmlsdGVyRGltKHN0YWdlRGltLCBzZWxlY3RlZCk7XG59KTtcblxuc2VsZWN0KFwiI2lkX3N0b2NraW5nX21ldGhvZFwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XG4gIGxldCBzZWxlY3RlZCA9IGdldF9zZWxlY3Rpb25zKHRoaXMpO1xuICBmaWx0ZXJEaW0obWV0aG9kRGltLCBzZWxlY3RlZCk7XG59KTtcblxuc2VsZWN0KFwiI3Jlc2V0LWJ1dHRvblwiKS5vbihcImNsaWNrXCIsICgpID0+IHtcbiAgJChcIiNmaW5kLWV2ZW50cy1mb3JtXCIpLmZvcm0oXCJyZXNldFwiKTtcblxuICAvLyBUT0RPOiAgcmVtb3ZlIHJvaSBmcm9tIGxlYWZsZXQgbWFwXG5cbiAgeWVhckRpbS5maWx0ZXJBbGwoKTtcbiAgbW9udGhEaW0uZmlsdGVyQWxsKCk7XG4gIGxha2VEaW0uZmlsdGVyQWxsKCk7XG4gIGp1cmlzZGljdGlvbkRpbS5maWx0ZXJBbGwoKTtcbiAgcm9pRGltLmZpbHRlckFsbCgpO1xuICBzdGF0ZURpbS5maWx0ZXJBbGwoKTtcbiAgYWdlbmN5RGltLmZpbHRlckFsbCgpO1xuICBzcGVjaWVzRGltLmZpbHRlckFsbCgpO1xuICBzdHJhaW5EaW0uZmlsdGVyQWxsKCk7XG4gIG1hcmtEaW0uZmlsdGVyQWxsKCk7XG4gIG1ldGhvZERpbS5maWx0ZXJBbGwoKTtcbiAgc3RhZ2VEaW0uZmlsdGVyQWxsKCk7XG59KTtcbiJdLCJuYW1lcyI6WyJoIiwiaWRlbnRpdHkiLCJ4RmlsdGVySGVhcCIsImdldCIsInhmaWx0ZXJIZWFwIiwieGZpbHRlckhlYXBzZWxlY3QiLCJhc2NlbmRpbmciLCJwYXJzZVR5cGVuYW1lcyIsInNldCIsIlNlbGVjdGlvbiIsImNvbnN0YW50IiwiYXR0clJlbW92ZSIsImF0dHJSZW1vdmVOUyIsImF0dHJDb25zdGFudCIsImF0dHJDb25zdGFudE5TIiwiYXR0ckZ1bmN0aW9uIiwiYXR0ckZ1bmN0aW9uTlMiLCJzdHlsZVJlbW92ZSIsInN0eWxlQ29uc3RhbnQiLCJzdHlsZUZ1bmN0aW9uIiwidGV4dENvbnN0YW50IiwidGV4dEZ1bmN0aW9uIiwicmdiIiwiY29sb3JSZ2IiLCJudW1iZXIiLCJ0aW1lb3V0IiwiaW50ZXJwb2xhdGVUcmFuc2Zvcm0iLCJzdHlsZSIsImVhc2VDdWJpY0luT3V0IiwibWFwIiwiY29tbWFGb3JtYXQiLCJmb3JtYXQiLCJmaXJzdFllYXIiLCJsYXN0WWVhciIsIm1vbnRoX2xvb2t1cCIsInZhbHVlcyIsImZvckVhY2giLCJkIiwibW9udGgiLCJ5ZWFyIiwicGFyc2VJbnQiLCJldmVudHMiLCJzdHJhaW4iLCJsYWtlX2xvb2t1cCIsImxha2VzIiwicmVkdWNlIiwiYWNjdW11bGF0b3IiLCJhZ2VuY3lfbG9va3VwIiwiYWdlbmNpZXMiLCJqdXJpc2RpY3Rpb25fbG9va3VwIiwianVyaXNkaWN0aW9ucyIsInN0YXRlUHJvdl9sb29rdXAiLCJzdGF0ZVByb3YiLCJzcGVjaWVzX2xvb2t1cCIsInNwZWNpZXNfbGlzdCIsInN0cmFpbl9sb29rdXAiLCJzdHJhaW5zIiwibGlmZXN0YWdlX2xvb2t1cCIsImxpZmVzdGFnZXMiLCJtZXRob2RfbG9va3VwIiwic3RvY2tpbmdNZXRob2RzIiwiZ2V0X3NlbGVjdGlvbnMiLCJ3aWRnZXQiLCJ3aGF0Iiwic2VsZWN0ZWQiLCJzZWxlY3RlZEluZGV4IiwiaSIsImxlbmd0aCIsIm9wdGlvbnMiLCJwdXNoIiwiZ2V0X29wdGlvbnMiLCJncnAiLCJ0b3AiLCJJbmZpbml0eSIsImZpbHRlciIsInZhbHVlIiwia2V5IiwidXBkYXRlX29wdGlvbnMiLCJzZWxlY3RvciIsIm9wdGlvbl9kYXRhIiwibG9va3VwIiwic29ydEtleSIsInNlbGVjdCIsInNlbGVjdEFsbCIsImRhdGEiLCJleGl0IiwicmVtb3ZlIiwib3B0aW9uc0VudGVyIiwiZW50ZXIiLCJhcHBlbmQiLCJ0ZXh0IiwiYXR0ciIsIm1lcmdlIiwic29ydCIsImEiLCJiIiwibG9jYWxlQ29tcGFyZSIsIm5keCIsImNyb3NzZmlsdGVyIiwiYWxsIiwiZ3JvdXBBbGwiLCJyZWR1Y2VTdW0iLCJ5ZWFyRGltIiwiZGltZW5zaW9uIiwibW9udGhEaW0iLCJsYWtlRGltIiwibGFrZSIsImp1cmlzZGljdGlvbkRpbSIsImp1cmlzZCIsInJvaURpbSIsIm1hblVuaXQiLCJzdGF0ZURpbSIsInN0YXRlIiwiYWdlbmN5RGltIiwiYWdlbmN5X2NvZGUiLCJzcGVjaWVzRGltIiwic3BjIiwic3RyYWluRGltIiwibWFya0RpbSIsIm1hcmsiLCJtZXRob2REaW0iLCJtZXRob2QiLCJzdGFnZURpbSIsInN0YWdlIiwiZ3JvdXAiLCJtb250aEdyb3VwIiwibGFrZUdyb3VwIiwianVyaXNkaWN0aW9uR3JvdXAiLCJzdGF0ZUdyb3VwIiwiYWdlbmN5R3JvdXAiLCJzcGVjaWVzR3JvdXAiLCJzdHJhaW5Hcm91cCIsIm1ldGhvZEdyb3VwIiwic3RhZ2VHcm91cCIsInVwZGF0ZV90b3RhbCIsInRvdGFsIiwiY2xhc3NlZCIsInVwZGF0ZV93aWRnZXRzIiwib25DaGFuZ2UiLCJmaWx0ZXJZZWFycyIsImZpbHRlckZ1bmN0aW9uIiwiZmlsdGVyQWxsIiwiY2hlY2tZZWFycyIsInllYXJJbnB1dHMiLCJvbiIsImZpbHRlckRpbSIsIiQiLCJmb3JtIl0sIm1h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LEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRTtFQUNsRCxJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO0VBQ3BCLE1BQU0sT0FBTyxLQUFLLENBQUM7RUFDbkIsS0FBSztFQUNMLEdBQUc7RUFDSCxFQUFFLE9BQU8sSUFBSSxDQUFDO0VBQ2QsQ0FBQyxDQUFDO0FBQ0Y7RUFDQTtFQUNBLFFBQVEsQ0FBQyxTQUFTLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7RUFDMUQsRUFBRSxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUM7RUFDYixFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0VBQ2xELElBQUksSUFBSSxDQUFDLEtBQUssTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO0VBQ3ZELE1BQU0sT0FBTyxLQUFLLENBQUM7RUFDbkIsS0FBSztFQUNMLEdBQUc7RUFDSCxFQUFFLE9BQU8sSUFBSSxDQUFDO0VBQ2QsQ0FBQyxDQUFDO0FBQ0Y7RUFDQTtFQUNBO0VBQ0EsUUFBUSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEdBQUcsU0FBUyxDQUFDLEVBQUUsSUFBSSxFQUFFO0VBQ3RELEVBQUUsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDO0VBQ2IsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRTtFQUNsRCxJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMs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LENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRTtFQUNuQixRQUFRLENBQUMsQ0FBQztFQUNWLElBQUksT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7RUFDbkYsSUFBSSxPQUFPLENBQUMsQ0FBQztFQUNiLEdBQUc7QUFDSDtFQUNBO0VBQ0E7RUFDQTtFQUNBLEVBQUUsU0FBUyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO0VBQzdCLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztFQUN2QixRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2hCLFFBQVEsS0FBSyxDQUFDO0VBQ2QsSUFBSSxPQUFPLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO0VBQ2xDLE1BQU0sSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUM7RUFDeEUsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLE1BQU07RUFDdkMsTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsS0FBSyxD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RUFBRTtFQUMxRCxVQUFVLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakMsVUFBVSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEMsU0FBUztFQUNULE9BQU87QUFDUDtFQUNBO0VBQ0EsTUFBTSxJQUFJLEdBQUcsR0FBRyxHQUFHLEVBQUU7RUFDckIsUUFBUSxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7RUFDMUQsVUFBVSxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQy9CLFVBQVUsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNsQyxTQUFTO0VBQ1QsT0FBTyxNQUFNLElBQUksR0FBRyxHQUFHLEdBQUcsRUFBRTtFQUM1QixRQUFRLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTtFQUMxRCxVQUFVLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakMsVUFBVSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEMsU0FBUztFQUNULE9BQU87QUFDUDtFQUNBLE1BQU0sR0FBRyxDQUFDLFFBQVEsRUFBRTtFQUNwQjtBQUNBO0VBQ0EsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7RUFDdEMsVUFBVSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FB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QUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztFQUNoRixXQUFXLElBQUksUUFBUSxJQUFJLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHQSxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7RUFDcEYsS0FBSztBQUNMO0VBQ0EsSUFBSSxPQUFPLElBQUksQ0FBQztFQUNoQixHQUFHO0VBQ0gsRUFBRSxJQUFJLEVBQUUsV0FBVztFQUNuQixJQUFJLElBQUksSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztFQUM5QixJQUFJLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7RUFDNUMsSUFBSSxPQUFPLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0VBQzlCLEdBQUc7RUFDSCxFQUFFLElBQUksRUFBRSxTQUFTLElBQUksRUFBRSxJQUFJLEVBQUU7RUFDN0IsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLElBQUksSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQzFILElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLE1B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RSxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDOUQsR0FBRztBQUNIO0VBQ0EsRUFBRSxLQUFLLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsVUFBVSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTtFQUNuRyxJQUFJLEtBQUssSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLFNBQVMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTtFQUNySCxNQUFNLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtFQUMzQixRQUFRLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7RUFDNUIsT0FBTztFQUNQLEtBQUs7RUFDTCxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7RUFDaEMsR0FBRztBQUNIO0VBQ0EsRUFBRSxPQUFPLElBQUlBLFdBQVMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO0VBQzFELENBQUM7QUFDRDtFQUNBLFNBQVMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7RUFDekIsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFD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QyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0VBQy9GLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDekgsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDO0VBQ3hGLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDO0VBQy9KLFFBQVEsSUFBSTtFQUNaLFFBQVEsQ0FBQyxDQUFDLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDdEUsUUFBUSxDQUFDLENBQUMsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQztFQUMxRyxRQUFRLENBQUMsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUN2RSxRQUFRLENBQUMsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzRyxRQUFRLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0VBQy9FLFFBQVEsQ0FBQyxDQUFDLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDbkYsUUFBUSxLQUFLLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7RUFDMUQsUUFBUSxNQUFNLEtBQUssYUFBYSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztFQUM1RCxRQUFRLElBQUksQ0FBQztFQUNiLENBQUM7QUFDRDtFQUNBLFNBQVMsSUFBSSxDQUFDLENBQUMsRUFBRTtFQUNqQixFQUFFLE9BQU8sSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztFQUM3RCxDQUFDO0FBQ0Q7RUFDQSxTQUFTLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7RUFDMUIsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDO0VBQzlCLEVBQUUsT0FBTyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUM3QixDQUFDO0FBQ0Q7RUFDTyxTQUFTLFVBQVUsQ0FBQyxDQUFDLEVBQUU7RUFDOUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxZQUFZLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDMUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxHQUFHLENBQUM7RUFDekIsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0VBQ2QsRUFBRSxPQUFPLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztFQUMzQyxDQUFDO0FBQ0Q7RUFDTyxTQUFTLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUU7RUFDdEMsRUFBRSxPQUFPLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxPQUFPLElBQUksSUFBSSxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztFQUNsRyxDQUFDO0FBQ0Q7RUFDTyxTQUFTLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUU7RUFDdEMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ2QsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ2QsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ2QsRUFBRSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDO0VBQzFCLENBQUM7QUFDRDtFQUNBLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUU7RUFDL0IsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLEVBQUU7RUFDeEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJ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SSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7RUFDM0QsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0VBQ3pDLENBQUM7QUFDRDtFQUNBLFNBQVMsR0FBRyxDQUFDLEtBQUssRUFBRTtFQUNwQixFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDN0QsRUFBRSxPQUFPLENBQUMsS0FBSyxHQUFHLEVBQUUsR0FBRyxHQUFHLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDdEQsQ0FBQztBQUNEO0VBQ0EsU0FBUyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0VBQzFCLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztFQUM5QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDO0VBQ3pDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUM7RUFDM0IsRUFBRSxPQUFPLElBQUksR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQzdCLENBQUM7QUFDRDtFQUNPLFNBQVMsVUFBVSxDQUFDLENBQUMsRUFBRTtFQUM5QixFQUFFLElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxPQUFPLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztFQUNqRSxFQUFFLElBQUksRUFBRSxDQUFDLFlBQVksS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMxQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLEdBQUcsQ0FBQztFQUN6QixFQUFFLElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztFQUNqQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7RUFDZCxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRztFQUNuQixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUc7RUFDbkIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHO0VBQ25CLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDN0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUM3QixNQUFNLENBQUMsR0FBRyxHQUFHO0VBQ2IsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUc7RUFDbkIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQztFQUMxQixFQUFFLElBQUksQ0FBQyxFQUFFO0VBQ1QsSUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUNqRCxTQUFTLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDNUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDO0VBQzdDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztFQUNaLEdBQUcsTUFBTTtFQUNULElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQy9CLEdBQUc7RUFDSCxFQUFFLE9BQU8sSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0VBQ3JDLENBQUM7QUFDRDtFQUNPLFNBQVMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRTtFQUN0QyxFQUFFLE9BQU8sU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE9BQU8sSUFBSSxJQUFJLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDO0VBQ2xHLENBQUM7QUFDRDtFQUNBLFNBQVMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRTtFQUMvQixFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDZCxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDZCxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDZCxFQUFFLElB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QyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRUEsaUJBQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRUEsaUJBQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzNFLEtBQUssTUFBTSxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsRUFBRTtFQUNyQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLFFBQVEsR0FBRyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQztFQUN0RCxLQUFLO0VBQ0wsR0FBRztBQUNIO0VBQ0EsRUFBRSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRTtFQUN4QixJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUU7RUFDZCxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7RUFDZixJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMvQixJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUM1RSxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ3JDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDbEMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxD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SSxRQUFRLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztFQUNuQyxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksRUFBRSxRQUFRLEdBQUcsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0VBQ3ZGLEVBQUUsT0FBTyxRQUFRLENBQUM7RUFDbEIsQ0FBQztBQUNEO0VBQ0EsU0FBUyxNQUFNLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUU7RUFDaEMsRUFBRSxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWTtFQUNuQyxNQUFNLEtBQUssQ0FBQztBQUNaO0VBQ0E7RUFDQTtFQUNBLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQztFQUN2QixFQUFFLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzdDO0VBQ0EsRUFBRSxTQUFTLFFBQVEsQ0FBQyxPQUFPLEVBQUU7RUFDN0IsSUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztFQUMzQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNyRDtFQUNBO0VBQ0EsSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQzNELEdBQUc7QUFDSDtFQUNBLEVBQUUsU0FBUyxLQUFLLENBQUMsT0FBTyxFQUFFO0VBQzFCLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDbkI7RUFDQTtFQUNBLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLFNBQVMsRUFBRSxPQUFPLElBQUksRUFB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RUFBRSxFQUFFLENBQUMsRUFBRSxNQUFNLEdBQUcsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0VBQzVLLElBQUksS0FBSyxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7RUFDckksTUFBTSxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFO0VBQ3pDLFFBQVEsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztFQUN4QixPQUFPO0VBQ1AsS0FBSztFQUNMLEdBQUc7QUFDSDtFQUNBLEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO0VBQ3RCLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzQixHQUFHO0FBQ0g7RUFDQSxFQUFFLE9BQU8sSUFBSSxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDckU7O0VDaEJBLFNBQVMsS0FBSyxDQUFDLElBQUksRUFBRTtFQUNyQixFQUFFLE9BQU8sQ0FBQyxJQUFJLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUU7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QUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0VBQzNFLE1BQU0sSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO0VBQzNCLFFBQVEsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztFQUNyQyxRQUFRLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFO0VBQzVDLFVBQVUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUTtFQUMvRCxVQUFVLEtBQUssRUFBRSxDQUFDO0VBQ2xCLFVBQVUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO0VBQ3BDLFVBQVUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO0VBQzVCLFNBQVMsQ0FBQyxDQUFDO0VBQ1gsT0FBTztFQUNQLEtBQUs7RUFDTCxHQUFHO0FBQ0g7RUFDQSxFQUFFLE9BQU8sSUFBSSxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0VBQzFEOztFQ3JCZSx1QkFBUSxHQUFHO0VBQzFCLEVBQUUsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksR0FBRyxJQUFJLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztFQUMvRCxFQUFFLE9BQU8sSUFBSSxPQUFPLENBQUMsU0FBUyxPQUFPLEVBQUUsTUFBTSxFQUFFO0VBQy9DLElBQUksSUFBSSxNQUFNLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDO0VBQ2hDLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsSUFBSSxLQUFLLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNuRTtFQUNBLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXO0VBQ3pCLE1BQU0sSUFBSSxRQUFRLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUM7RUFDbEMsVUFBVSxFQUFFLEdBQUcsUUFBUSxDQUFDLEVBQUUsQ0FBQztBQUMzQjtFQUNBO0VBQ0E7RUFDQTtFQUNBLE1BQU0sSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFO0VBQ3RCLFFBQVEsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQztFQUNoQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztFQUNsQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztFQUNyQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUM1QixPQUFPO0FBQ1A7RUFDQSxNQUFNLFFBQVEsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDO0VBQ3hCLEtBQUssQ0FBQyxDQUFDO0VBQ1AsR0FBRyxDQUFDLENBQUM7RUFDTDs7RUNKQSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDWDtFQUNPLFNBQVMsVUFBVSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRTtFQUN0RCxFQUFFLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO0VBQ3hCLEVBQUUsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7RUFDMUIsRUFBRSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztFQUNwQixFQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO0VBQ2hCLENBQUM7QUFLRDtFQUNPLFNBQVMsS0FBSyxHQUFHO0VBQ3hCLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQztFQUNkLENBQUM7QUFDRDtFQUNBLElBQUksbUJBQW1CLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQztBQUM5QztFQUNBLFVBQVUsQ0FBQyxTQUFTLEdBQTBCO0VBQzlDLEVBQUUsV0FBVyxFQUFFLFVBQVU7RUFDekIsRUFBRSxNQUFNLEVBQUUsaUJBQWlCO0VBQzNCLEVBQUUsU0FBUyxFQUFFLG9CQUFvQjtFQUNqQyxFQUFFLE1BQU0sRUFBRSxpQkFBaUI7RUFDM0IsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCO0VBQ3pCLEVBQUUsU0FBUyxFQUFFLG9CQUFvQjtFQUNqQyxFQUFFLFVBQVUsRUFBRSxxQkFBcUI7RUFDbkMsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLENBQUMsSUFBSTtFQUNoQyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxLQUFLO0VBQ2xDLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixDQUFDLElBQUk7RUFDaEMsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLENBQUMsSUFBSTtFQUNoQyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxLQUFLO0VBQ2xDLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixDQUFDLElBQUk7RUFDaEMsRUFBRSxFQUFFLEVBQUUsYUFBYTtFQUNuQixFQUFFLElBQUksRUFBRSxlQUFlO0VBQ3ZCLEVBQUUsU0FBUyxFQUFFLG9CQUFvQjtFQUNqQyxFQUFFLEtBQUssRUFBRSxnQkFBZ0I7RUFDekIsRUFBRSxVQUFVLEVBQUUscUJBQXFCO0VBQ25DLEVBQUUsSUFBSSxFQUFFLGVBQWU7RUFDdkIsRUFBRSxTQUFTLEVBQUUsb0JBQW9CO0VBQ2pDLEVBQUUsTUFBTSxFQUFFLGlCQUFpQjtFQUMzQixFQUFFLEtBQUssRUFBRSxnQkFBZ0I7RUFDekIsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCO0VBQ3pCLEVBQUUsUUFBUSxFQUFFLG1CQUFtQjtFQUMvQixFQUFFLElBQUksRUFBRSxlQUFlO0VBQ3ZCLEVBQUUsR0FBRyxFQUFFLGNBQWM7RUFDckIsQ0FBQzs7RUMzRE0sU0FBUyxVQUFVLENBQUMsQ0FBQyxFQUFFO0VBQzlCLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUNoRTs7RUNMQSxJQUFJLGFBQWEsR0FBRztFQUNwQixFQUFFLElBQUksRUFBRSxJQUFJO0VBQ1osRUFBRSxLQUFLLEVBQUUsQ0FBQztFQUNWLEVBQUUsUUFBUSxFQUFFLEdBQUc7RUFDZixFQUFFLElBQUksRUFBRUUsVUFBYztFQUN0QixDQUFDLENBQUM7QUFDRjtFQUNBLFNBQVMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUU7RUFDM0IsRUFBRSxJQUFJLE1BQU0sQ0FBQztFQUNiLEVBQUUsT0FBTyxFQUFFLE1BQU0sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxNQUFNLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7RUFDbEUsSUFBSSxJQUFJLEVBQUUsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtFQUNuQyxNQUFNLE9BQU8sYUFBYSxDQUFDLElBQUksR0FBRyxHQUFHLEVBQUUsRUFBRSxhQUFhLENBQUM7RUFDdkQsS0FBSztFQUNMLEdBQUc7RUFDSCxFQUFFLE9BQU8sTUFBTSxDQUFDO0VBQ2hCLENBQUM7QUFDRDtFQUNlLDZCQUFRLENBQUMsSUFBSSxFQUFFO0VBQzlCLEVBQUUsSUFBSSxFQUFFO0VBQ1IsTUFBTSxNQUFNLENBQUM7QUFDYjtFQUNBLEVBQUUsSUFBSSxJQUFJLFlBQVksVUFBVSxFQUFFO0VBQ2xDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7RUFDckMsR0FBRyxNQUFNO0VBQ1QsSUFBSSxFQUFFLEdBQUcsS0FBSyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEdBQUcsYUFBYSxFQUFFLElBQUksR0FBRyxHQUFHLEVBQUUsRUFBRSxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztFQUNoRyxHQUFHO0FBQ0g7RUFDQSxFQUFFLEtBQUssSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7RUFDeEUsSUFBSSxLQUFLLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0VBQzNFLE1BQU0sSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO0VBQzNCLFFBQVEsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsTUFBTSxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUN4RSxPQUFPO0VBQ1AsS0FBSztFQUNMLEdBQUc7QUFDSDtFQUNBLEVBQUUsT0FBTyxJQUFJLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7RUFDekQ7O0VDckNBLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLG1CQUFtQixDQUFDO0VBQ3BELFNBQVMsQ0FBQyxTQUFTLENBQUMsVUFBVSxHQUFHLG9CQUFvQjs7RUNMOUMsSUFBSSxNQUFNLEdBQUcsR0FBRyxDQUFDO0FBQ3hCO0VBQ0EsU0FBUyxHQUFHLEdBQUcsRUFBRTtBQUNqQjtFQUNBLEdBQUcsQ0FBQyxTQUFTLEdBQUdDLEtBQUcsQ0FBQyxTQUFTLEdBQUc7RUFDaEMsRUFBRSxXQUFXLEVBQUUsR0FBRztFQUNsQixFQUFFLEdBQUcsRUFBRSxTQUFTLEdBQUcsRUFBRTtFQUNyQixJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsR0FBRyxLQUFLLElBQUksQ0FBQztFQUNsQyxHQUFHO0VBQ0gsRUFBRSxHQUFHLEVBQUUsU0FBUyxHQUFHLEVBQUU7RUFDckIsSUFBSSxPQUFPLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUM7RUFDOUIsR0FBRztFQUNILEVBQUUsR0FBRyxFQUFFLFNBQVMsR0FBRyxFQUFFLEtBQUssRUFBRTtFQUM1QixJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO0VBQy9CLElBQUksT0FBTyxJQUFJLENBQUM7RUFDaEIsR0FBRztFQUNILEVBQUUsTUFBTSxFQUFFLFNBQVMsR0FBRyxFQUFFO0VBQ3hCLElBQUksSUFBSSxRQUFRLEdBQUcsTUFBTSxHQUFHLEdBQUcsQ0FBQztFQUNoQyxJQUFJLE9BQU8sUUFBUSxJQUFJLElBQUksSUFBSSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztFQUNyRCxHQUFHO0VBQ0gsRUFBRSxLQUFLLEVBQUUsV0FBVztFQUNwQixJQUFJLEtBQUssSUFBSSxRQUFRLElBQUksSUFBSSxFQUFFLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLE1BQU0sRUFBRSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztFQUNqRixHQUFHO0VBQ0gsRUFBRSxJQUFJLEVBQUUsV0FBVztFQUNuQixJQUFJLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztFQUNsQixJQUFJLEtBQUssSUFBSSxRQUFRLElBQUksSUFBSSxFQUFFLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUN4RixJQUFJLE9BQU8sSUFBSSxDQUFDO0VBQ2hCLEdBQUc7RUFDSCxFQUFFLE1BQU0sRUFBRSxXQUFXO0VBQ3JCLElBQUksSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0VBQ3BCLElBQUksS0FBSyxJQUFJLFFBQVEsSUFBSSxJQUFJLEVBQUUsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7RUFDdkYsSUFBSSxPQUFPLE1BQU0sQ0FBQztFQUNsQixHQUFHO0VBQ0gsRUFBRSxPQUFPLEVBQUUsV0FBVztFQUN0QixJQUFJLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztFQUNyQixJQUFJLEtBQUssSUFBSSxRQUFRLElBQUksSUFBSSxFQUFFLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLE1BQU0sRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDekgsSUFBSSxPQUFPLE9BQU8sQ0FBQztFQUNuQixHQUFHO0VBQ0gsRUFBRSxJQUFJLEVBQUUsV0FBVztFQUNuQixJQUFJLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztFQUNqQixJQUFJLEtBQUssSUFBSSxRQUFRLElBQUksSUFBSSxFQUFFLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLE1BQU0sRUFBRSxFQUFFLElBQUksQ0FBQztFQUNsRSxJQUFJLE9BQU8sSUFBSSxDQUFDO0VBQ2hCLEdBQUc7RUFDSCxFQUFFLEtBQUssRUFBRSxXQUFXO0VBQ3BCLElBQUksS0FBSyxJQUFJLFFBQVEsSUFBSSxJQUFJLEVBQUUsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssTUFBTSxFQUFFLE9BQU8sS0FBSyxDQUFDO0VBQ3hFLElBQUksT0FBTyxJQUFJLENBQUM7RUFDaEIsR0FBRztFQUNILEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxFQUFFO0VBQ3BCLElBQUksS0FBSyxJQUFJLFFBQVEsSUFBSSxJQUFJLEVBQUUsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssTUFBTSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztFQUN0RyxHQUFHO0VBQ0gsQ0FBQyxDQUFDO0FBQ0Y7RUFDQSxTQUFTQSxLQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRTtFQUN4QixFQUFFLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDO0FBQ3BCO0VBQ0E7RUFDQSxFQUFFLElBQUksTUFBTSxZQUFZLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3hGO0VBQ0E7RUFDQSxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtFQUNsQyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNkLFFBQVEsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNO0VBQ3pCLFFBQVEsQ0FBQyxDQUFDO0FBQ1Y7RUFDQSxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUN6RCxTQUFTLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ2pFLEdBQUc7QUFDSDtFQUNBO0VBQ0EsT0FBTyxJQUFJLE1BQU0sRUFBRSxLQUFLLElBQUksR0FBRyxJQUFJLE1BQU0sRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNyRTtFQUNBLEVBQUUsT0FBTyxHQUFHLENBQUM7RUFDYjs7RUN0RUEsU0FBUyxHQUFHLEdBQUcsRUFBRTtBQUNqQjtFQUNBLElBQUksS0FBSyxHQUFHQSxLQUFHLENBQUMsU0FBUyxDQUFDO0FBQzFCO0VBQ0EsR0FBRyxDQUFDLFNBQVMsR0FBbUI7RUFDaEMsRUFBRSxXQUFXLEVBQUUsR0FBRztFQUNsQixFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRztFQUNoQixFQUFFLEdBQUcsRUFBRSxTQUFTLEtBQUssRUFBRTtFQUN2QixJQUFJLEtBQUssSUFBSSxFQUFFLENBQUM7RUFDaEIsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQztFQUNqQyxJQUFJLE9BQU8sSUFBSSxDQUFDO0VBQ2hCLEdBQUc7RUFDSCxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTTtFQUN0QixFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSztFQUNwQixFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsSUFBSTtFQUNwQixFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtFQUNsQixFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSztFQUNwQixFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtFQUNsQixDQUFDOztFQ3BCYyxzQkFBUSxDQUFDLENBQUMsRUFBRTtFQUMzQixFQUFFLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUk7RUFDNUMsUUFBUSxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDO0VBQ2hELFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUN2QixDQUFDO0FBQ0Q7RUFDQTtFQUNBO0VBQ0E7RUFDTyxTQUFTLGtCQUFrQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7RUFDekMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsYUFBYSxFQUFFLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQztFQUMvRixFQUFFLElBQUksQ0FBQyxFQUFFLFdBQVcsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNyQztFQUNBO0VBQ0E7RUFDQSxFQUFFLE9BQU87RUFDVCxJQUFJLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLFdBQVc7RUFDaEYsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNuQixHQUFHLENBQUM7RUFDSjs7RUNqQmUsaUJBQVEsQ0FBQyxDQUFDLEVBQUU7RUFDM0IsRUFBRSxPQUFPLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7RUFDN0Q7O0VDSmUsb0JBQVEsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFO0VBQzdDLEVBQUUsT0FBTyxTQUFTLEtBQUssRUFBRSxLQUFLLEVBQUU7RUFDaEMsSUFBSSxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTTtFQUN4QixRQUFRLENBQUMsR0FBRyxFQUFFO0VBQ2QsUUFBUSxDQUFDLEdBQUcsQ0FBQztFQUNiLFFBQVEsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUM7RUFDdkIsUUFBUSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ25CO0VBQ0EsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtFQUMzQixNQUFNLElBQUksTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUM7RUFDbEUsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM3QyxNQUFNLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLEVBQUUsTUFBTTtFQUMzQyxNQUFNLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7RUFDbEQsS0FBSztBQUNMO0VBQ0EsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7RUFDdkMsR0FBRyxDQUFDO0VBQ0o7O0VDakJlLHVCQUFRLENBQUMsUUFBUSxFQUFFO0VBQ2xDLEVBQUUsT0FBTyxTQUFTLEtBQUssRUFBRTtFQUN6QixJQUFJLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLEVBQUU7RUFDL0MsTUFBTSxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzFCLEtBQUssQ0FBQyxDQUFDO0VBQ1AsR0FBRyxDQUFDO0VBQ0o7O0VDTkE7RUFDQSxJQUFJLEVBQUUsR0FBRywwRUFBMEUsQ0FBQztBQUNwRjtFQUNlLFNBQVMsZUFBZSxDQUFDLFNBQVMsRUFBRTtFQUNuRCxFQUFFLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLEdBQUcsU0FBUyxDQUFDLENBQUM7RUFDckYsRUFBRSxJQUFJLEtBQUssQ0FBQztFQUNaLEVBQUUsT0FBTyxJQUFJLGVBQWUsQ0FBQztFQUM3QixJQUFJLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLElBQUksS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7RUFDbkIsSUFBSSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztFQUNsQixJQUFJLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLElBQUksSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7RUFDbEIsSUFBSSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztFQUNuQixJQUFJLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0VBQ25CLElBQUksU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztFQUM1QyxJQUFJLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLElBQUksSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7RUFDbkIsR0FBRyxDQUFDLENBQUM7RUFDTCxDQUFDO0FBQ0Q7RUFDQSxlQUFlLENBQUMsU0FBUyxHQUFHLGVBQWUsQ0FBQyxTQUFTLENBQUM7QUFDdEQ7RUFDTyxTQUFTLGVBQWUsQ0FBQyxTQUFTLEVBQUU7RUFDM0MsRUFBRSxJQUFJLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQyxJQUFJLEtBQUssU0FBUyxHQUFHLEdBQUcsR0FBRyxTQUFTLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztFQUN2RSxFQUFFLElBQUksQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDLEtBQUssS0FBSyxTQUFTLEdBQUcsR0FBRyxHQUFHLFNBQVMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0VBQzFFLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxTQUFTLENBQUMsSUFBSSxLQUFLLFNBQVMsR0FBRyxHQUFHLEdBQUcsU0FBUyxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7RUFDdkUsRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLEtBQUssU0FBUyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztFQUM1RSxFQUFFLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7RUFDL0IsRUFBRSxJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLEtBQUssU0FBUyxHQUFHLFNBQVMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUM7RUFDNUUsRUFBRSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO0VBQ2pDLEVBQUUsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsU0FBUyxLQUFLLFNBQVMsR0FBRyxTQUFTLEdBQUcsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDO0VBQ3hGLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztFQUMvQixFQUFFLElBQUksQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFDLElBQUksS0FBSyxTQUFTLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO0VBQ3RFLENBQUM7QUFDRDtFQUNBLGVBQWUsQ0FBQyxTQUFTLENBQUMsUUFBUSxHQUFHLFdBQVc7RUFDaEQsRUFBRSxPQUFPLElBQUksQ0FBQyxJQUFJO0VBQ2xCLFFBQVEsSUFBSSxDQUFDLEtBQUs7RUFDbEIsUUFBUSxJQUFJLENBQUMsSUFBSTtFQUNqQixRQUFRLElBQUksQ0FBQyxNQUFNO0VBQ25CLFNBQVMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDO0VBQzlCLFNBQVMsSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDckUsU0FBUyxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUM7RUFDL0IsU0FBUyxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVMsR0FBRyxFQUFFLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDbkYsU0FBUyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUM7RUFDOUIsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDO0VBQ2xCLENBQUM7O0VDOUNEO0VBQ2UsbUJBQVEsQ0FBQyxDQUFDLEVBQUU7RUFDM0IsRUFBRSxHQUFHLEVBQUUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0VBQzlELElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2hCLE1BQU0sS0FBSyxHQUFHLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNO0VBQ25DLE1BQU0sS0FBSyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTTtFQUNwRCxNQUFNLFNBQVMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFD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O0VBQ0EsSUFBSSxTQUFTLEdBQUcsU0FBUyxLQUFLLFNBQVMsR0FBRyxDQUFDO0VBQzNDLFVBQVUsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQztFQUNwRSxVQUFVLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDL0M7RUFDQSxJQUFJLFNBQVMsTUFBTSxDQUFDLEtBQUssRUFBRTtFQUMzQixNQUFNLElBQUksV0FBVyxHQUFHLE1BQU07RUFDOUIsVUFBVSxXQUFXLEdBQUcsTUFBTTtFQUM5QixVQUFVLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ2xCO0VBQ0EsTUFBTSxJQUFJLElBQUksS0FBSyxHQUFHLEVBQUU7RUFDeEIsUUFBUSxXQUFXLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLFdBQVcsQ0FBQztFQUN0RCxRQUFRLEtBQUssR0FBRyxFQUFFLENBQUM7RUFDbkIsT0FBTyxNQUFNO0VBQ2IsUUFBUSxLQUFLLEdBQUcsQ0FBQyxLQUFLLENBQUM7QUFDdkI7RUFDQTtFQUNBLFFBQVEsSUFBSSxhQUFhLEdBQUcsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUN2RDtFQUNBO0VBQ0EsUUFBUSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUM1RTtFQUNBO0VBQ0EsUUFBUSxJQUFJLElBQUksRUFBRSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzVDO0VBQ0E7RUFDQSxRQUFRLElBQUksYUFBYSxJQUFJLENBQUMs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
