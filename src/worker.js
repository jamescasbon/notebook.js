(function() {
  var _this = this;

  importScripts('/lib/underscore/underscore-min.js');

  self.onmessage = function(ev) {
    var inputId, print, result, src;
    inputId = ev.data.id;
    src = ev.data.src;
    print = function(d) {
      return self.postMessage({
        inputId: inputId,
        msg: 'print',
        data: d.toString()
      });
    };
    try {
      self.postMessage({
        inputId: inputId,
        msg: 'evalBegin'
      });
      result = eval(src);
      if (!(result != null)) result = '-';
      if (_.isFunction(result)) result = '-';
      return self.postMessage({
        inputId: inputId,
        msg: 'result',
        data: result.toString()
      });
    } catch (error) {
      return self.postMessage({
        inputId: inputId,
        msg: 'error',
        data: error.toString()
      });
    } finally {
      self.postMessage({
        inputId: inputId,
        msg: 'evalEnd'
      });
    }
  };

}).call(this);
