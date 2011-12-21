(function() {
  var _this = this;

  self.onmessage = function(ev) {
    var inputId, print, result, src;
    inputId = ev.data.id;
    src = ev.data.src;
    print = function(d) {
      return self.postMessage({
        inputId: inputId,
        msg: 'print',
        data: d
      });
    };
    self.postMessage({
      inputId: inputId,
      msg: 'evalBegin'
    });
    try {
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
