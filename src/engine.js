(function() {
  var JavascriptEval, MarkdownEval, WorkerEval, engines, root,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  JavascriptEval = (function() {

    function JavascriptEval() {
      this.evaluate = __bind(this.evaluate, this);
    }

    JavascriptEval.prototype.evaluate = function(input, handler) {
      var print, result;
      try {
        print = function(d) {
          return handler.handleMessage({
            msg: 'print',
            data: d.toString()
          });
        };
        result = eval(input);
        if (result != null) {
          console.log('result', result);
          return handler.handleMessage({
            msg: 'result',
            data: result.toString()
          });
        }
      } catch (error) {
        console.log(error.message, error.stack);
        return handler.handleMessage({
          msg: 'error',
          data: error.toString()
        });
      } finally {
        handler.handleMessage({
          msg: 'evalEnd'
        });
      }
    };

    return JavascriptEval;

  })();

  MarkdownEval = (function() {

    function MarkdownEval() {
      this.evaluate = __bind(this.evaluate, this);
    }

    MarkdownEval.prototype.evaluate = function(input, handler) {
      var html, markdownConvertor;
      try {
        markdownConvertor = new Showdown.converter();
        html = markdownConvertor.makeHtml(input);
        return handler.handleMessage({
          msg: 'raw',
          data: html
        });
      } catch (error) {
        console.log(error.message);
        return onErr(error.message);
      } finally {
        handler.handleMessage({
          msg: 'evalEnd'
        });
      }
    };

    return MarkdownEval;

  })();

  WorkerEval = (function() {

    function WorkerEval() {
      this.handleMessage = __bind(this.handleMessage, this);
      this.evaluate = __bind(this.evaluate, this);      this.worker = new Worker('/src/worker.js');
      this.worker.onmessage = this.handleMessage;
      this.inputId = 0;
      this.handlers = {};
    }

    WorkerEval.prototype.evaluate = function(input, handler) {
      this.inputId += 1;
      this.handlers[this.inputId] = handler;
      return this.worker.postMessage({
        src: input,
        id: this.inputId
      });
    };

    WorkerEval.prototype.handleMessage = function(ev) {
      var handler, inputId;
      console.log('got msg from worker', ev.msg);
      inputId = ev.data.inputId;
      handler = this.handlers[inputId];
      return handler.handleMessage(ev.data);
    };

    return WorkerEval;

  })();

  engines = {};

  engines.javascript = new WorkerEval();

  engines.markdown = new MarkdownEval();

  root.engines = engines;

}).call(this);
