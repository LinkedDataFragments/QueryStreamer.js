/* A bunch of time-related util functions. */

function TimeUtils() {
  if (!(this instanceof TimeUtils))
    return new TimeUtils();
}

/**
 * Get the minimum update time.
 * updateAt can be undefined.
 */
TimeUtils.prototype.replaceUpdateTime = function(updateAt, newUpdateAt) {
  return (updateAt && updateAt < newUpdateAt) ? updateAt : newUpdateAt;
};

/**
 * Get the minimum update time for given variables.
 * The variables must be time variables.
 */
TimeUtils.prototype.getMinimumUpdateTime = function(variables, taCounter) {
  var minimumUpdateTime = -1;
  for(var i = 0; i < taCounter; i++) {
    var updateTime = this._getUpdateTime(variables, i);
    if(updateTime < minimumUpdateTime || minimumUpdateTime == -1) {
      minimumUpdateTime = updateTime;
    }
  }
  return minimumUpdateTime;
};

/**
 * Get the update time for given variable.
 * The variable must be a time variable.
 */
TimeUtils.prototype._getUpdateTime = function(variables, variableCount) {
  return this._parseTimeVariable(variables["?final" + variableCount]);
};

/**
 * Check if all given time variables are 'now'.
 */
TimeUtils.prototype.areAllCurrent = function(variables, current, taCounter) {
  for(var i = 0; i < taCounter; i++) {
    if(!this._isCurrent(variables, current, i)) return false;
  }
  return true;
};

/**
 * Check if given time variables (initial and final) encapsulate the current time.
 */
TimeUtils.prototype._isCurrent = function(variables, current, variableCount) {
  var initial = this._parseTimeVariable(variables["?initial" + variableCount]);
  var final = this._parseTimeVariable(variables["?final" + variableCount]);
  current = current || new Date().getTime();
  return initial < current && current <= final;
};

/**
 * Parse the given time variable to a timestamp.
 */
TimeUtils.prototype._parseTimeVariable = function(timeVariable) {
  var timeString = timeVariable.replace(/\^\^.*/g, "").replace(/"/g, "");
  return Date.parse(timeString);
};

/**
 * Get the current numerical time.
 */
TimeUtils.prototype.getTime = function() {
  return new Date().getTime();
};

module.exports = new TimeUtils();