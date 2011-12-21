(function() {
  var JavascriptContext, JavascriptEval, MarkdownEval, WorkerEval, engines, root,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  JavascriptContext = (function() {

    function JavascriptContext() {}

    JavascriptContext.prototype.foo = 42;

    return JavascriptContext;

  })();

  JavascriptEval = (function() {

    function JavascriptEval() {
      this.evaluate = __bind(this.evaluate, this);
    }

    JavascriptEval.prototype.evaluate = function(input, onSuccess, onErr) {
      var output;
      try {
        output = eval(input);
        return onSuccess(output.toString());
      } catch (error) {
        return onErr(error.toString());
      }
    };

    return JavascriptEval;

  })();

  MarkdownEval = (function() {

    function MarkdownEval() {
      this.evaluate = __bind(this.evaluate, this);
    }

    MarkdownEval.prototype.evaluate = function(input, onSuccess, onErr) {
      var html, markdownConvertor;
      try {
        markdownConvertor = new Showdown.converter();
        html = markdownConvertor.makeHtml(input);
        return onSuccess(html);
      } catch (error) {
        return onError(error.message);
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
      console.log('got msg from worker', ev.data);
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
