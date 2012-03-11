(function() {
  var CellView, EditNotebookView, IndexView, NAVBAR_HEIGHT, NotebookRouter, isScrolledIntoView, root,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _.templateSettings = {
    interpolate: /\[\[=(.+?)\]\]/g,
    evaluate: /\[\[(.+?)\]\]/g
  };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  NAVBAR_HEIGHT = 30;

  isScrolledIntoView = function(elem) {
    var docViewBottom, docViewTop, elemBottom, elemTop;
    docViewTop = $(window).scrollTop() + (2 * NAVBAR_HEIGHT);
    docViewBottom = docViewTop + $(window).height() - (2 * NAVBAR_HEIGHT);
    elemTop = elem.offset().top;
    elemBottom = elemTop + elem.height();
    return (elemBottom <= docViewBottom) && (elemTop >= docViewTop);
  };

  EditNotebookView = (function(_super) {

    __extends(EditNotebookView, _super);

    function EditNotebookView() {
      this.mathjaxReady = __bind(this.mathjaxReady, this);
      this.spawnKeypress = __bind(this.spawnKeypress, this);
      this.spawnCellAtEnd = __bind(this.spawnCellAtEnd, this);
      this.addAll = __bind(this.addAll, this);
      this.addOne = __bind(this.addOne, this);
      this.render = __bind(this.render, this);
      this.initialize = __bind(this.initialize, this);
      this.events = __bind(this.events, this);
      EditNotebookView.__super__.constructor.apply(this, arguments);
    }

    EditNotebookView.prototype.events = function() {
      return {
        "dblclick #spawner": 'spawnCellAtEnd',
        "keyup #spawner": 'spawnKeypress'
      };
    };

    EditNotebookView.prototype.initialize = function() {
      this.template = _.template($('#notebook-edit-template').html());
      $('.container').append(this.render());
      this.cells = this.$('.cells');
      this.model.cells.bind('add', this.addOne);
      this.model.cells.bind('refresh', this.addAll);
      return this.model.cells.fetch({
        success: this.addAll
      });
    };

    EditNotebookView.prototype.render = function() {
      $(this.el).html(this.template());
      return this.el;
    };

    EditNotebookView.prototype.addOne = function(cell) {
      var index, newEl, previous, previousView, view;
      console.log('adding cell', this.cells);
      root.c = cell;
      console.log('creating view');
      view = new CellView({
        model: cell
      });
      console.log('render view');
      newEl = view.render();
      console.log('insert view', newEl, this.cells);
      index = this.model.cells.indexOf(cell);
      if (index === 0) {
        console.log('prepend');
        this.cells.prepend(newEl);
      } else {
        previous = this.model.cells.at(index - 1);
        previousView = previous.view;
        $(previousView.el).after(newEl);
      }
      console.log('acivate editor', this.cells);
      view.afterDomInsert();
      return view.focusInput();
    };

    EditNotebookView.prototype.addAll = function(cells) {
      return cells.each(this.addOne);
    };

    EditNotebookView.prototype.spawnCellAtEnd = function() {
      return this.model.cells.createAtEnd();
    };

    EditNotebookView.prototype.spawnKeypress = function(e) {
      var ncells;
      if (e.keyCode === 13) {
        return this.model.cells.createAtEnd();
      } else if (e.keyCode === 38) {
        ncells = this.model.cells.length;
        return this.model.cells.at(ncells - 1).view.output.focus();
      }
    };

    EditNotebookView.prototype.mathjaxReady = function() {
      return _.each(this.$('.cell-output'), function(el) {
        return MathJax.Hub.Typeset(el);
      });
    };

    return EditNotebookView;

  })(Backbone.View);

  CellView = (function(_super) {

    __extends(CellView, _super);

    function CellView() {
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
        "click .fold-button": 'toggleInputFold',
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
      this.template = _.template($('#cell-edit-template').html());
      this.model.bind('change:state', this.changeState);
      this.model.bind('change:type', this.changeType);
      this.model.bind('change:output', this.changeOutput);
      this.model.bind('change:inputFold', this.changeInputFold);
      this.model.bind('destroy', this.remove);
      this.model.view = this;
      return this.editor = null;
    };

    CellView.prototype.logev = function(ev) {
      return console.log('in ev', ev);
    };

    CellView.prototype.render = function(ev) {
      console.log('model', this.model.toJSON());
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
      console.log('updatting output to', this.model.get('output'));
      this.output.html(this.model.get('output'));
      return MathJax.Hub.Typeset(this.output[0]);
    };

    CellView.prototype.changeState = function() {
      console.log('view changing state to', this.model.get('state'));
      switch (this.model.get('state')) {
        case 'evaluating':
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
      console.log('binding', this.model.id);
      this.editor = ace.edit('input-' + this.model.id);
      this.editor.resize();
      this.editor.getSession().setValue(this.model.get('input'));
      this.model.set({
        state: null
      });
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
          var cursor, row;
          cursor = _this.$('.ace_cursor');
          console.log('lineup,inview?', isScrolledIntoView(cursor));
          if (!isScrolledIntoView(cursor)) {
            $('body').scrollTop(cursor.offset().top - 4 * NAVBAR_HEIGHT);
          }
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
          var cursor, last, row;
          cursor = _this.$('.ace_cursor');
          if (!isScrolledIntoView(cursor)) {
            $('body').scrollTop(cursor.offset().top - $(window).height() + 3 * NAVBAR_HEIGHT);
          }
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
      this.$('.fold-button').toggleClass('input-fold');
      return this.$('hr').toggleClass('input-fold');
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
      this.model.set({
        input: this.editor.getSession().getValue()
      });
      return this.model.evaluate();
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
      this.model.set({
        dirty: true
      });
      line_height = this.editor.renderer.$textLayer.getLineHeight();
      lines = this.editor.getSession().getDocument().getLength();
      this.$('.ace-container').height(20 + (18 * lines));
      return this.editor.resize();
    };

    return CellView;

  })(Backbone.View);

  IndexView = (function(_super) {

    __extends(IndexView, _super);

    function IndexView() {
      this.render = __bind(this.render, this);
      this.initialize = __bind(this.initialize, this);
      IndexView.__super__.constructor.apply(this, arguments);
    }

    IndexView.prototype.tagName = 'div';

    IndexView.prototype.initialize = function() {
      this.template = _.template($('#index-template').html());
      return $('.container').append(this.render());
    };

    IndexView.prototype.render = function() {
      $(this.el).html(this.template());
      console.log(this.template());
      console.log(this.el);
      return this.el;
    };

    return IndexView;

  })(Backbone.View);

  NotebookRouter = (function(_super) {

    __extends(NotebookRouter, _super);

    function NotebookRouter() {
      this.index = __bind(this.index, this);
      this.view = __bind(this.view, this);
      this.edit = __bind(this.edit, this);
      NotebookRouter.__super__.constructor.apply(this, arguments);
    }

    NotebookRouter.prototype.routes = {
      "edit": "edit",
      "*all": "index"
    };

    NotebookRouter.prototype.edit = function() {
      var notebook, notebooks;
      if (root.app) root.app.remove();
      console.log('activated edit route');
      notebooks = new Notebooks();
      notebook = notebooks.create();
      root.app = new EditNotebookView({
        model: notebook
      });
      return console.log('created enbv');
    };

    NotebookRouter.prototype.view = function() {
      return console.log('activated view route');
    };

    NotebookRouter.prototype.index = function() {
      if (root.app) root.app.remove();
      console.log('index view');
      return root.app = new IndexView();
    };

    return NotebookRouter;

  })(Backbone.Router);

  $(document).ready(function() {
    console.log('creating app');
    root.router = new NotebookRouter();
    return Backbone.history.start();
  });

}).call(this);
