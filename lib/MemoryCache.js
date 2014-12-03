/* A simple in-memory cache for storing the static query results. */

// Creates a new MemoryCache
function MemoryCache() {
  if (!(this instanceof MemoryCache))
    return new MemoryCache();
  this._data = {};
}

MemoryCache.prototype.put = function(key, value) {
  this._data[key] = value;
};

MemoryCache.prototype.get = function(key) {
  return this._data[key];
};

MemoryCache.prototype.hasKey = function(key) {
  return !!this._data[key];
};

MemoryCache.prototype.remove = function(key) {
  delete this._data[key];
};

module.exports = MemoryCache;