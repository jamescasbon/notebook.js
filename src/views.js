(function() {
  var CellEditView, EditNotebookView, IndexView, NAVBAR_HEIGHT, NewView, NotebookRouter, ViewNotebookView, isScrolledIntoView, root, setTitle,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    _this = this;

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

  ViewNotebookView = (function(_super) {

    __extends(ViewNotebookView, _super);

    function ViewNotebookView() {
      this.mathjaxReady = __bind(this.mathjaxReady, this);
      this.renderCell = __bind(this.renderCell, this);
      this.addAll = __bind(this.addAll, this);
      this.addOne = __bind(this.addOne, this);
      this.render = __bind(this.render, this);
      this.initialize = __bind(this.initialize, this);
      this.toggleEdit = __bind(this.toggleEdit, this);
      ViewNotebookView.__super__.constructor.apply(this, arguments);
    }

    ViewNotebookView.prototype.className = "app";

    ViewNotebookView.prototype.events = {
      "click #toggle-edit": "toggleEdit"
    };

    ViewNotebookView.prototype.toggleEdit = function() {
      return root.router.navigate(this.model.get('id') + '/edit/', {
        trigger: true
      });
    };

    ViewNotebookView.prototype.initialize = function() {
      console.log('init vnv');
      this.template = _.template($('#notebook-template').html());
      this.cellTemplate = _.template($('#cell-view-template').html());
      $('.container').append(this.render());
      this.cells = this.$('.cells');
      console.log(this.cells);
      return this.model.cells.fetch({
        success: this.addAll
      });
    };

    ViewNotebookView.prototype.render = function() {
      console.log('render vnv');
      $(this.el).html(this.template());
      return this.el;
    };

    ViewNotebookView.prototype.addOne = function(cell) {
      var newEl;
      console.log('addone');
      newEl = this.renderCell(cell);
      return this.cells.append(newEl);
    };

    ViewNotebookView.prototype.addAll = function(cells) {
      return cells.each(this.addOne);
    };

    ViewNotebookView.prototype.renderCell = function(cell) {
      return this.cellTemplate(cell.toJSON());
    };

    ViewNotebookView.prototype.mathjaxReady = function() {
      return _.each(this.$('.cell-output'), function(el) {
        return MathJax.Hub.Typeset(el);
      });
    };

    return ViewNotebookView;

  })(Backbone.View);

  EditNotebookView = (function(_super) {

    __extends(EditNotebookView, _super);

    function EditNotebookView() {
      this.toggleEdit = __bind(this.toggleEdit, this);
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

    EditNotebookView.prototype.className = "app";

    EditNotebookView.prototype.events = function() {
      return {
        "dblclick #spawner": 'spawnCellAtEnd',
        "keyup #spawner": 'spawnKeypress',
        "click #toggle-edit": "toggleEdit"
      };
    };

    EditNotebookView.prototype.initialize = function() {
      this.template = _.template($('#notebook-template').html());
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
      root.c = cell;
      view = new CellEditView({
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
        console.log(ncells);
        return this.model.cells.at(ncells - 1).view.output.focus();
      }
    };

    EditNotebookView.prototype.mathjaxReady = function() {
      return _.each(this.$('.cell-output'), function(el) {
        return MathJax.Hub.Typeset(el);
      });
    };

    EditNotebookView.prototype.toggleEdit = function() {
      return root.router.navigate(this.model.get('id') + '/view/', {
        trigger: true
      });
    };

    return EditNotebookView;

  })(Backbone.View);

  CellEditView = (function(_super) {

    __extends(CellEditView, _super);

    function CellEditView() {
      this.resizeEditor = __bind(this.resizeEditor, this);
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
      CellEditView.__super__.constructor.apply(this, arguments);
    }

    CellEditView.prototype.tagName = 'li';

    CellEditView.prototype.events = function() {
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

    CellEditView.prototype.initialize = function() {
      this.template = _.template($('#cell-edit-template').html());
      this.model.bind('change:state', this.changeState);
      this.model.bind('change:type', this.changeType);
      this.model.bind('change:output', this.changeOutput);
      this.model.bind('change:inputFold', this.changeInputFold);
      this.model.bind('destroy', this.remove);
      this.model.bind('all', this.logev);
      this.model.view = this;
      return this.editor = null;
    };

    CellEditView.prototype.logev = function(ev) {
      return console.log('in ev', ev);
    };

    CellEditView.prototype.render = function(ev) {
      var dat;
      console.log('model', this.model.cid, this.model.id, this.model.toJSON());
      if (!(this.editor != null)) {
        dat = this.model.toJSON();
        if (!(this.model.id != null)) dat.id = this.model.cid;
        $(this.el).html(this.template(dat));
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

    CellEditView.prototype.changeType = function() {
      this.setEditorHighlightMode();
      return this.type.html(this.model.get('type'));
    };

    CellEditView.prototype.changeOutput = function() {
      console.log('updatting output to', this.model.get('output'));
      this.output.html(this.model.get('output'));
      return MathJax.Hub.Typeset(this.output[0]);
    };

    CellEditView.prototype.changeState = function() {
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

    CellEditView.prototype.afterDomInsert = function() {
      var ace_id,
        _this = this;
      console.log('binding', this.model.id);
      console.log(this.model.id);
      if (this.model.id != null) {
        ace_id = this.model.id;
      } else {
        ace_id = this.model.cid;
      }
      this.editor = ace.edit('input-' + ace_id);
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
      this.resizeEditor();
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
        name: 'interrupt',
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

    CellEditView.prototype.handleKeypress = function(e) {
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

    CellEditView.prototype.toggleInputFold = function() {
      console.log('tif');
      return this.model.toggleInputFold();
    };

    CellEditView.prototype.changeInputFold = function() {
      this.inputContainer.toggleClass('input-fold');
      this.$('.fold-button').toggleClass('input-fold');
      return this.$('hr').toggleClass('input-fold');
    };

    CellEditView.prototype.focusInput = function(where) {
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

    CellEditView.prototype.blurInput = function() {
      if (this.editor != null) {
        this.editor.setHighlightActiveLine(false);
        return this.$('.ace_cursor-layer').hide();
      }
    };

    CellEditView.prototype.focusCellAbove = function() {
      var index, next;
      index = this.model.collection.indexOf(this.model);
      next = this.model.collection.at(index - 1);
      if (next != null) return next.view.output.focus();
    };

    CellEditView.prototype.focusCellBelow = function() {
      var index, next;
      index = this.model.collection.indexOf(this.model);
      next = this.model.collection.at(index + 1);
      if (next != null) {
        return next.view.spawn.focus();
      } else {
        console.log('focus nb spawn');
        return $('#spawner').focus();
      }
    };

    CellEditView.prototype.focus = function() {
      return console.log('focus');
    };

    CellEditView.prototype.setEditorHighlightMode = function() {
      var mode;
      if (this.model.get('type') === 'javascript') {
        mode = require("ace/mode/javascript").Mode;
      } else if (this.model.get('type') === 'markdown') {
        mode = require("ace/mode/markdown").Mode;
      }
      if (mode != null) return this.editor.getSession().setMode(new mode());
    };

    CellEditView.prototype.evaluate = function() {
      this.model.set({
        input: this.editor.getSession().getValue()
      });
      return this.model.evaluate();
    };

    CellEditView.prototype.destroy = function() {
      return this.model.destroy();
    };

    CellEditView.prototype.interrupt = function() {
      return this.model.interrupt();
    };

    CellEditView.prototype.remove = function() {
      return $(this.el).fadeOut('fast', $(this.el).remove);
    };

    CellEditView.prototype.spawnAbove = function() {
      return this.model.collection.createBefore(this.model);
    };

    CellEditView.prototype.toggle = function() {
      return this.model.toggleType();
    };

    CellEditView.prototype.inputChange = function() {
      this.model.set({
        state: 'dirty'
      });
      return this.resizeEditor();
    };

    CellEditView.prototype.resizeEditor = function() {
      var line_height, lines;
      line_height = this.editor.renderer.$textLayer.getLineHeight();
      lines = this.editor.getSession().getDocument().getLength();
      this.$('.ace-container').height(20 + (18 * lines));
      return this.editor.resize();
    };

    return CellEditView;

  })(Backbone.View);

  IndexView = (function(_super) {

    __extends(IndexView, _super);

    function IndexView() {
      this["new"] = __bind(this["new"], this);
      this.addNbs = __bind(this.addNbs, this);
      this.addNb = __bind(this.addNb, this);
      this.render = __bind(this.render, this);
      this.initialize = __bind(this.initialize, this);
      IndexView.__super__.constructor.apply(this, arguments);
    }

    IndexView.prototype.className = 'app';

    IndexView.prototype.events = {
      'click button': 'new'
    };

    IndexView.prototype.initialize = function() {
      this.template = _.template($('#index-template').html());
      $('.container').append(this.render());
      return this.addNbs();
    };

    IndexView.prototype.render = function() {
      $(this.el).html(this.template());
      return this.el;
    };

    IndexView.prototype.addNb = function(nb) {
      return $('#notebooks').append(this.nbtemplate(nb.toJSON()));
    };

    IndexView.prototype.addNbs = function() {
      console.log('addNbs');
      this.nbtemplate = _.template($('#notebook-index-template').html());
      return root.notebooks.each(this.addNb);
    };

    IndexView.prototype["new"] = function() {
      return root.router.navigate('new/', {
        trigger: true
      });
    };

    return IndexView;

  })(Backbone.View);

  NewView = (function(_super) {

    __extends(NewView, _super);

    function NewView() {
      this.create = __bind(this.create, this);
      this.render = __bind(this.render, this);
      this.initialize = __bind(this.initialize, this);
      NewView.__super__.constructor.apply(this, arguments);
    }

    NewView.prototype.className = 'app';

    NewView.prototype.events = {
      'click button': 'create'
    };

    NewView.prototype.initialize = function() {
      this.template = _.template($('#new-notebook-form').html());
      return $('.container').append(this.render());
    };

    NewView.prototype.render = function() {
      $(this.el).html(this.template());
      return this.el;
    };

    NewView.prototype.create = function() {
      var nb;
      console.log('creating');
      nb = root.notebooks.create({
        title: this.$('input').val()
      });
      nb.readyCells();
      nb.cells.create();
      return root.router.navigate(nb.id + '/edit/', {
        trigger: true
      });
    };

    return NewView;

  })(Backbone.View);

  NotebookRouter = (function(_super) {

    __extends(NotebookRouter, _super);

    function NotebookRouter() {
      this.index = __bind(this.index, this);
      this["new"] = __bind(this["new"], this);
      this["delete"] = __bind(this["delete"], this);
      this.view = __bind(this.view, this);
      this.edit = __bind(this.edit, this);
      this.getNotebook = __bind(this.getNotebook, this);
      NotebookRouter.__super__.constructor.apply(this, arguments);
    }

    NotebookRouter.prototype.routes = {
      ":nb/edit/": "edit",
      ":nb/view/": "view",
      ":nb/delete/": "delete",
      "new/": "new",
      "": "index"
    };

    NotebookRouter.prototype.getNotebook = function(nb) {
      var notebook;
      console.log('finding notebook', nb);
      notebook = root.notebooks.get(nb);
      notebook.readyCells();
      root.nb = notebook;
      console.log('notebook loaded; id=' + notebook.get('id'));
      notebook.readyCells();
      return notebook;
    };

    NotebookRouter.prototype.edit = function(nb) {
      var notebook;
      if (root.app) root.app.remove();
      console.log('activated edit route', nb);
      notebook = this.getNotebook(nb);
      root.app = new EditNotebookView({
        model: notebook
      });
      return setTitle(notebook.get('title') + ' (Editing)');
    };

    NotebookRouter.prototype.view = function(nb) {
      var notebook;
      if (root.app) root.app.remove();
      console.log('activated view route');
      notebook = this.getNotebook(nb);
      setTitle(notebook.get('title') + ' (Viewing)');
      return root.app = new ViewNotebookView({
        model: notebook
      });
    };

    NotebookRouter.prototype["delete"] = function(nb) {
      var confirmed, notebook;
      console.log('deleting nb', nb);
      confirmed = confirm('You really want to delete that?');
      if (confirmed) {
        notebook = this.getNotebook(nb);
        notebook.cells.each(function(x) {
          return x.destroy();
        });
        notebook.destroy();
        console.log('deleted');
      }
      return root.router.navigate('', {
        trigger: true
      });
    };

    NotebookRouter.prototype["new"] = function(nb) {
      console.log('new view');
      if (root.app) root.app.remove();
      return root.app = new NewView();
    };

    NotebookRouter.prototype.index = function() {
      if (root.app) root.app.remove();
      console.log('index view');
      return root.app = new IndexView();
    };

    return NotebookRouter;

  })(Backbone.Router);

  setTitle = function(title) {
    console.log('set title', title);
    return $('#title').html(title);
  };

  $(document).ready(function() {
    console.log('creating app');
    root.notebooks = new Notebooks();
    root.notebooks.fetch();
    root.router = new NotebookRouter();
    Backbone.history.start();
    return MathJax.Hub.Register.StartupHook('End', root.app.mathjaxReady);
  });

}).call(this);
