// our spatial dimensions will need custom reducer functions that will
// keep track of the number of events, yealing equivalents, and total
// number stocked by species - if the species exists update, if not
// create it, if event count is 0 delete it.

// for each group('sliceVar'), we want to return an object of the form:

export const stockingAdd = (column) => {
  return (p, v) => {
    const counts = p[v[column]] || { yreq: 0, total: 0, events: 0 };
    counts.yreq += v.yreq;
    counts.total += v.total;
    counts.events += v.events;
    p[v[column]] = counts;
    return p;
  };
};

export const stockingRemove = (column) => {
  return (p, v) => {
    const counts = p[v[column]] || { yreq: 0, total: 0, events: 0 };
    counts.yreq -= v.yreq;
    counts.total -= v.total;
    counts.events -= v.events;
    p[v[column]] = counts;
    return p;
  };
};

export const stockingInitial = () => {
  return {};
};
