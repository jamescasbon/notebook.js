(function() {
  var evals,
    _this = this;

  evals = {};

  self.onmessage = function(ev) {
    var inputId, print, result, src;
    inputId = ev.data.id;
    src = ev.data.src;
    self.postMessage({
      inputId: inputId,
      msg: 'worker msg handler start'
    });
    print = function(d) {
      return self.postMessage({
        inputId: inputId,
        msg: 'print',
        data: d
      });
    };
    try {
      self.postMessage({
        inputId: inputId,
        msg: 'evalBegin'
      });
      result = eval(src);
      if (result != null) {
        return self.postMessage({
          inputId: inputId,
          msg: 'result',
          data: result.toString()
        });
      }
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
