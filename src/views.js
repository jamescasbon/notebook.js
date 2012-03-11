(function() {
  var CellView, NotebookView, root,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _.templateSettings = {
    interpolate: /\[\[=(.+?)\]\]/g,
    evaluate: /\[\[(.+?)\]\]/g
  };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  NotebookView = (function(_super) {

    __extends(NotebookView, _super);

    function NotebookView() {
      this.mathjaxReady = __bind(this.mathjaxReady, this);
      this.spawnKeypress = __bind(this.spawnKeypress, this);
      this.spawnCellAtEnd = __bind(this.spawnCellAtEnd, this);
      this.addAll = __bind(this.addAll, this);
      this.addOne = __bind(this.addOne, this);
      this.render = __bind(this.render, this);
      this.initialize = __bind(this.initialize, this);
      this.events = __bind(this.events, this);
      NotebookView.__super__.constructor.apply(this, arguments);
    }

    NotebookView.prototype.el = "#notebook";

    NotebookView.prototype.events = function() {
      return {
        "dblclick #spawner": 'spawnCellAtEnd',
        "keyup #spawner": 'spawnKeypress'
      };
    };

    NotebookView.prototype.initialize = function() {
      this.title = this.$('#title');
      this.cells = this.$('#cells');
      this.render();
      this.model.cells.bind('add', this.addOne);
      this.model.cells.bind('refresh', this.addAll);
      return this.model.cells.fetch({
        success: this.addAll
      });
    };

    NotebookView.prototype.render = function() {
      console.log('rendering notebook' + this.model.get('title'));
      return this.title.html(this.model.get("title"));
    };

    NotebookView.prototype.addOne = function(cell) {
      var index, newEl, previous, previousView, view;
      console.log('adding cell', cell);
      view = new CellView({
        model: cell
      });
      newEl = view.render();
      index = this.model.cells.indexOf(cell);
      if (index === 0) {
        this.cells.prepend(newEl);
      } else {
        previous = this.model.cells.at(index - 1);
        previousView = previous.view;
        $(previousView.el).after(newEl);
      }
      view.afterDomInsert();
      return view.focusInput();
    };

    NotebookView.prototype.addAll = function(cells) {
      return cells.each(this.addOne);
    };

    NotebookView.prototype.spawnCellAtEnd = function() {
      return this.model.cells.createAtEnd();
    };

    NotebookView.prototype.spawnKeypress = function(e) {
      var ncells;
      if (e.keyCode === 13) {
        return this.model.cells.createAtEnd();
      } else if (e.keyCode === 38) {
        ncells = this.model.cells.length;
        return this.model.cells.at(ncells - 1).view.output.focus();
      }
    };

    NotebookView.prototype.mathjaxReady = function() {
      return _.each(this.$('.cell-output'), function(el) {
        return MathJax.Hub.Typeset(el);
      });
    };

    return NotebookView;

  })(Backbone.View);

  CellView = (function(_super) {

    __extends(CellView, _super);

    function CellView() {
      this.switchIoViews = __bind(this.switchIoViews, this);
      this.inputChange = __bind(this.inputChange, this);
      this.toggle = __bind(this.toggle, this);
      this.spawnAbove = __bind(this.spawnAbove, this);
      this.remove = __bind(this.remove, this);
      this.interrupt = __bind(this.interrupt, this);
      this.destroy = __bind(this.destroy, this);
      this.evaluate = __bind(this.evaluate, this);
      this.setEditorHighlightMode = __bind(this.setEditorHighlightMode, this);
      this.focus = __bind(this.focus, this);
      this.focusCellBelow = __bind(this.focusCellBelow, this);
      this.focusCellAbove = __bind(this.focusCellAbove, this);
      this.blurInput = __bind(this.blurInput, this);
      this.focusInput = __bind(this.focusInput, this);
      this.changeInputFold = __bind(this.changeInputFold, this);
      this.toggleInputFold = __bind(this.toggleInputFold, this);
      this.handleKeypress = __bind(this.handleKeypress, this);
      this.editorChange = __bind(this.editorChange, this);
      this.afterDomInsert = __bind(this.afterDomInsert, this);
      this.changeState = __bind(this.changeState, this);
      this.changeOutput = __bind(this.changeOutput, this);
      this.changeType = __bind(this.changeType, this);
      this.render = __bind(this.render, this);
      this.logev = __bind(this.logev, this);
      this.initialize = __bind(this.initialize, this);
      this.events = __bind(this.events, this);
      CellView.__super__.constructor.apply(this, arguments);
    }

    CellView.prototype.tagName = 'li';

    CellView.prototype.events = function() {
      return {
        "keyup .spawn-above": 'handleKeypress',
        "dblclick .spawn-above": "spawnAbove",
        "click .evaluate": "evaluate",
        "click .delete": "destroy",
        "click .toggle": 'toggle',
        "click .type": 'toggle',
        "click .cell-output": 'switchIoViews',
        "click .marker-input": 'toggleInputFold',
        "dblclick .cell-output": 'toggleInputFold',
        "evaluate": "evaluate",
        "toggle": "toggle",
        "click .interrupt": "interrupt",
        "keyup .cell-output": 'handleKeypress',
        "focus .cell-input": "focusInput",
        "blur .cell-input": "blurInput"
      };
    };

    CellView.prototype.initialize = function() {
      this.template = _.template($('#cell-template').html());
      this.model.bind('change:state', this.changeState);
      this.model.bind('change:type', this.changeType);
      this.model.bind('change:output', this.changeOutput);
      this.model.bind('change:inputFold', this.changeInputFold);
      this.model.bind('destroy', this.remove);
      this.model.view = this;
      this.editor = null;
      return this.model.bind('all', this.logev);
    };

    CellView.prototype.logev = function(ev) {
      return console.log('in ev', ev);
    };

    CellView.prototype.render = function(ev) {
      if (!(this.editor != null)) {
        $(this.el).html(this.template(this.model.toJSON()));
        this.spawn = this.$('.spawn-above');
        this.input = this.$('.cell-input');
        this.output = this.$('.cell-output');
        this.inputContainer = this.$('.ace-container');
        this.type = this.$('.type');
        this.intButton = this.$('.interrupt');
        this.evalButton = this.$('.evaluate');
      }
      return this.el;
    };

    CellView.prototype.changeType = function() {
      this.setEditorHighlightMode();
      return this.type.html(this.model.get('type'));
    };

    CellView.prototype.changeOutput = function() {
      console.log('changeOputput');
      this.output.html(this.model.get('output'));
      return MathJax.Hub.Typeset(this.output[0]);
    };

    CellView.prototype.changeState = function() {
      console.log('view changing state to', this.model.get('state'));
      switch (this.model.get('state')) {
        case 'evaluating':
          console.log('add active to', this.intButton);
          this.output.html('...');
          this.intButton.addClass('active');
          return this.evalButton.removeClass('active');
        case 'dirty':
          console.log('vd');
          return this.evalButton.addClass('active');
        case null:
          return this.intButton.removeClass('active');
      }
    };

    CellView.prototype.afterDomInsert = function() {
      var _this = this;
      this.editor = ace.edit('input-' + this.model.id);
      this.editor.resize();
      this.editor.getSession().setValue(this.model.get('input'));
      this.model.set({
        state: null
      });
      this.editor.getSession().on('change', this.editorChange);
      this.editor.getSession().setUseWrapMode(true);
      this.editor.renderer.setShowGutter(false);
      this.editor.renderer.setHScrollBarAlwaysVisible(false);
      this.editor.renderer.setShowPrintMargin(false);
      this.editor.setHighlightActiveLine(false);
      this.$('.ace_sb').css({
        display: 'none'
      });
      this.editor.getSession().on('change', this.inputChange);
      this.setEditorHighlightMode();
      this.inputChange();
      this.switchIoViews();
      if (this.model.get('inputFold')) this.changeInputFold();
      this.editor.commands.addCommand({
        name: 'evaluate',
        bindKey: {
          win: 'Ctrl-E',
          mac: 'Command-E',
          sender: 'editor'
        },
        exec: function(env, args, request) {
          return _this.evaluate();
        }
      });
      this.editor.commands.addCommand({
        name: 'toggleMode',
        bindKey: {
          win: 'Ctrl-M',
          mac: 'Command-M',
          sender: 'editor'
        },
        exec: function(env, args, request) {
          return _this.toggle();
        }
      });
      this.editor.commands.addCommand({
        name: 'toggleMode',
        bindKey: {
          win: 'Ctrl-C',
          mac: 'Ctrl-C',
          sender: 'editor'
        },
        exec: function(env, args, request) {
          return _this.interrupt();
        }
      });
      this.editor.commands.addCommand({
        name: "golineup",
        bindKey: {
          win: "Up",
          mac: "Up|Ctrl-P",
          sender: 'editor'
        },
        exec: function(ed, args) {
          var row;
          row = ed.getSession().getSelection().getCursor().row;
          if (row === 0) {
            _this.spawn.focus();
            return _this.rogueKeyup = true;
          } else {
            return ed.navigateUp(args.times);
          }
        }
      });
      this.editor.commands.addCommand({
        name: "golinedown",
        bindKey: {
          win: "Down",
          mac: "Down",
          sender: 'editor'
        },
        exec: function(ed, args) {
          var last, row;
          row = ed.getSession().getSelection().getCursor().row;
          last = _this.editor.getSession().getDocument().getLength() - 1;
          if (row === last) {
            _this.output.focus();
            return _this.rogueKeyup = true;
          } else {
            return ed.navigateDown(args.times);
          }
        }
      });
      return this.editor.commands.addCommand({
        name: "backspace",
        bindKey: {
          win: "Backspace",
          mac: "Backspace",
          sender: 'editor'
        },
        exec: function(ed, args) {
          var session;
          session = ed.getSession();
          if (session.getLength() === 1 && session.getValue() === "") {
            return _this.destroy();
          } else {
            return _this.editor.remove("left");
          }
        }
      });
    };

    CellView.prototype.editorChange = function() {
      return this.model.set({
        state: 'dirty'
      });
    };

    CellView.prototype.handleKeypress = function(e) {
      var inFold, target;
      if (this.rogueKeyup === true) {
        this.rogueKeyup = false;
        return;
      }
      inFold = this.model.get('inputFold');
      target = e.target.className;
      console.log('kp', e.keyCode, target);
      if (e.keyCode === 38) {
        switch (target) {
          case 'cell-output':
            if (inFold) {
              return this.spawn.focus();
            } else {
              return this.focusInput('bottom');
            }
            break;
          case 'spawn-above':
            return this.focusCellAbove();
        }
      } else if (e.keyCode === 40) {
        switch (target) {
          case 'cell-output':
            return this.focusCellBelow();
          case 'spawn-above':
            if (inFold) {
              return this.output.focus();
            } else {
              return this.focusInput('top');
            }
        }
      } else if (e.keyCode === 13) {
        switch (target) {
          case 'spawn-above':
            return this.spawnAbove();
          case 'cell-output':
            return this.toggleInputFold();
        }
      }
    };

    CellView.prototype.toggleInputFold = function() {
      console.log('tif');
      return this.model.toggleInputFold();
    };

    CellView.prototype.changeInputFold = function() {
      this.inputContainer.toggleClass('input-fold');
      return this.$('.marker-input').toggleClass('input-fold');
    };

    CellView.prototype.focusInput = function(where) {
      if (where === 'top') {
        this.editor.gotoLine(1);
        this.editor.focus();
      } else if (where === 'bottom') {
        this.editor.gotoLine(this.editor.getSession().getDocument().getLength());
        this.editor.focus();
      }
      if (this.editor != null) {
        this.editor.setHighlightActiveLine(true);
        return this.$('.ace_cursor-layer').show();
      }
    };

    CellView.prototype.blurInput = function() {
      if (this.editor != null) {
        this.editor.setHighlightActiveLine(false);
        return this.$('.ace_cursor-layer').hide();
      }
    };

    CellView.prototype.focusCellAbove = function() {
      var index, next;
      index = this.model.collection.indexOf(this.model);
      next = this.model.collection.at(index - 1);
      if (next != null) return next.view.output.focus();
    };

    CellView.prototype.focusCellBelow = function() {
      var index, next;
      index = this.model.collection.indexOf(this.model);
      next = this.model.collection.at(index + 1);
      console.log('fcb', next);
      if (next != null) {
        return next.view.spawn.focus();
      } else {
        console.log('focus nb spawn');
        return $('#spawner').focus();
      }
    };

    CellView.prototype.focus = function() {
      return console.log('focus');
    };

    CellView.prototype.setEditorHighlightMode = function() {
      var mode;
      if (this.model.get('type') === 'javascript') {
        mode = require("ace/mode/javascript").Mode;
      } else if (this.model.get('type') === 'markdown') {
        mode = require("ace/mode/markdown").Mode;
      }
      if (mode != null) return this.editor.getSession().setMode(new mode());
    };

    CellView.prototype.evaluate = function() {
      console.log('in cellview evaluate handler');
      this.model.set({
        input: this.editor.getSession().getValue()
      });
      this.model.evaluate();
      return this.switchIoViews();
    };

    CellView.prototype.destroy = function() {
      return this.model.destroy();
    };

    CellView.prototype.interrupt = function() {
      console.log('int');
      return this.model.interrupt();
    };

    CellView.prototype.remove = function() {
      return $(this.el).fadeOut('fast', $(this.el).remove);
    };

    CellView.prototype.spawnAbove = function() {
      console.log('sa');
      return this.model.collection.createBefore(this.model);
    };

    CellView.prototype.toggle = function() {
      return this.model.toggleType();
    };

    CellView.prototype.inputChange = function() {
      var line_height, lines;
      line_height = this.editor.renderer.$textLayer.getLineHeight();
      lines = this.editor.getSession().getDocument().getLength();
      this.$('.ace-container').height(20 + (18 * lines));
      return this.editor.resize();
    };

    CellView.prototype.switchIoViews = function() {
      return 0;
      if (this.model.get('type') === 'markdown') {
        if (this.$('.ace-container').is(":hidden")) {
          this.inputContainer.show();
          this.output.hide();
          this.editor.resize();
          return this.editor.focus();
        } else {
          this.output.show();
          return this.inputContainer.hide();
        }
      }
    };

    return CellView;

  })(Backbone.View);

  $(document).ready(function() {
    var notebook, notebooks;
    console.log('creating app');
    notebooks = new Notebooks();
    notebook = notebooks.create();
    root.app = new NotebookView({
      model: notebook
    });
    MathJax.Hub.Register.StartupHook('End', root.app.mathjaxReady);
    return root.n = notebook;
  });

}).call(this);
