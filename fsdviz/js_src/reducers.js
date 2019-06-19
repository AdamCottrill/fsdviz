// our spatial dimensions will need custom reducer functions that will
// keep track of the number of events, yealing equivalents, and total
// number stocked by species - if the species exists update, if not
// create it, if event count is 0 delete it.

// for each group('sliceVar'), we want to return an object of the form:

//{
// yreq : ,
// total: ,
// events: ,
//}

// agency_abbrev
// life_stage
// mark
// species_name
// stateprov
// stk_method
// strain

export const stockingAdd = (p, v) => {
  let counts = p[v[sliceVar]] || { yreq: 0, total: 0, events: 0 };
  counts.yreq += v.yreq;
  counts.total += v.total_stocked;
  counts.events += v.events;
  p[v[sliceVar]] = counts;
  return p;
};

export const stockingRemove = (p, v) => {
  let counts = p[v[sliceVar]] || { yreq: 0, total: 0, events: 0 };
  counts.yreq -= v.yreq;
  counts.total -= v.total_stocked;
  counts.events -= v.events;
  //p[v[sliceVar]] = (p[v[sliceVar]] || 0) - v.yreq;
  p[v[sliceVar]] = counts;
  return p;
};

export const stockingInitial = () => {
  return {};
};
