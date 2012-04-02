(function() {
  var BaseEngine, BaseHandler, Javascript, JavascriptWindow, Markdown, NotebookJS, engines, root, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  NotebookJS = root.NotebookJS = (_ref = root.NotebookJS) != null ? _ref : {};

  BaseHandler = (function() {

    function BaseHandler() {
      this.handleMessage = __bind(this.handleMessage, this);
      this.error = __bind(this.error, this);
      this.print = __bind(this.print, this);
      this.result = __bind(this.result, this);
      this.evalEnd = __bind(this.evalEnd, this);
      this.evalBegin = __bind(this.evalBegin, this);
    }

    BaseHandler.prototype.evalBegin = function() {};

    BaseHandler.prototype.evalEnd = function() {};

    BaseHandler.prototype.result = function(data) {};

    BaseHandler.prototype.print = function(data) {};

    BaseHandler.prototype.error = function(data) {};

    BaseHandler.prototype.handleMessage = function() {};

    return BaseHandler;

  })();

  BaseEngine = (function() {

    function BaseEngine() {
      this.halt = __bind(this.halt, this);
      this.interrupt = __bind(this.interrupt, this);
      this.evaluate = __bind(this.evaluate, this);
    }

    BaseEngine.prototype.evaluate = function() {};

    BaseEngine.prototype.interrupt = function() {};

    BaseEngine.prototype.halt = function() {};

    return BaseEngine;

  })();

  JavascriptWindow = (function(_super) {

    __extends(JavascriptWindow, _super);

    function JavascriptWindow() {
      this.evaluate = __bind(this.evaluate, this);
      JavascriptWindow.__super__.constructor.apply(this, arguments);
    }

    JavascriptWindow.prototype.evaluate = function(input, handler) {
      var print, result;
      try {
        handler.evalBegin();
        print = function(d) {
          return handler.print(d.toString());
        };
        result = eval(input);
        if (result != null) return handler.result(result.toString());
      } catch (error) {
        console.log(error.message, error.stack);
        return handler.error(error.toString());
      } finally {
        handler.evalEnd();
      }
    };

    return JavascriptWindow;

  })(BaseEngine);

  Markdown = (function(_super) {

    __extends(Markdown, _super);

    function Markdown() {
      this.evaluate = __bind(this.evaluate, this);
      Markdown.__super__.constructor.apply(this, arguments);
    }

    Markdown.prototype.evaluate = function(input, handler) {
      var html, markdownConvertor;
      try {
        handler.evalBegin();
        markdownConvertor = new Showdown.converter();
        html = markdownConvertor.makeHtml(input);
        return handler.result(html);
      } catch (error) {
        console.log(error.message);
        return handler.error(error.toString());
      } finally {
        handler.evalEnd();
      }
    };

    return Markdown;

  })(BaseEngine);

  Javascript = (function(_super) {

    __extends(Javascript, _super);

    function Javascript() {
      this.halt = __bind(this.halt, this);
      this.interrupt = __bind(this.interrupt, this);
      this.handleMessage = __bind(this.handleMessage, this);
      this.evaluate = __bind(this.evaluate, this);      this.worker = new Worker('/src/worker.js');
      this.worker.onmessage = this.handleMessage;
      this.inputId = 0;
      this.handlers = {};
    }

    Javascript.prototype.evaluate = function(input, handler) {
      this.inputId += 1;
      this.handlers[this.inputId] = handler;
      return this.worker.postMessage({
        src: input,
        id: this.inputId
      });
    };

    Javascript.prototype.handleMessage = function(ev) {
      var handler, inputId;
      inputId = ev.data.inputId;
      handler = this.handlers[inputId];
      switch (ev.data.msg) {
        case 'log':
          return console.log(ev.data.data);
        case 'evalBegin':
          return handler.evalBegin();
        case 'evalEnd':
          handler.evalEnd();
          return this.handlers[inputId] = null;
        case 'print':
          return handler.print(ev.data.data);
        case 'result':
          return handler.result(ev.data.data);
        case 'error':
          return handler.error(ev.data.data);
      }
    };

    Javascript.prototype.interrupt = function() {
      this.worker.terminate();
      this.worker = new Worker('/src/worker.js');
      return this.worker.onmessage = this.handleMessage;
    };

    Javascript.prototype.halt = function() {
      this.worker.terminate();
      return this.worker = null;
    };

    return Javascript;

  })(BaseEngine);

  engines = {};

  engines.BaseHandler = BaseHandler;

  engines.JavascriptWindow = JavascriptWindow;

  engines.Markdown = Markdown;

  engines.Javascript = Javascript;

  NotebookJS.engines = engines;

}).call(this);
