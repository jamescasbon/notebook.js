(function() {
  var BaseNotebookView, CellEditView, EditNotebookView, IndexView, NAVBAR_HEIGHT, NewView, NotebookJS, NotebookRouter, ViewNotebookView, isScrolledIntoView, loadNotebook, mathjaxReady, root, scrollToAtBottom, scrollToAtTop, setTitle, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    _this = this;

  _.templateSettings = {
    interpolate: /\[\[=(.+?)\]\]/g,
    evaluate: /\[\[(.+?)\]\]/g
  };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  NotebookJS = root.NotebookJS = (_ref = root.NotebookJS) != null ? _ref : {};

  NAVBAR_HEIGHT = 30;

  isScrolledIntoView = function(elem) {
    var docViewBottom, docViewTop, elemBottom, elemTop;
    docViewTop = $(window).scrollTop() + (2 * NAVBAR_HEIGHT);
    docViewBottom = $(window).scrollTop() + $(window).height() - NAVBAR_HEIGHT;
    elemTop = elem.offset().top;
    elemBottom = elemTop + elem.height();
    return (elemBottom <= docViewBottom) && (elemTop >= docViewTop);
  };

  scrollToAtTop = function(elem) {
    var target;
    target = elem.offset().top - 3 * NAVBAR_HEIGHT;
    return $(window).scrollTop(target);
  };

  scrollToAtBottom = function(elem) {
    var bottom, scrollbottom, scrolltop;
    bottom = elem.offset().top + elem.height();
    scrollbottom = bottom + (2 * NAVBAR_HEIGHT);
    scrolltop = scrollbottom - $(window).height();
    return $('body').scrollTop(scrolltop);
  };

  BaseNotebookView = (function(_super) {

    __extends(BaseNotebookView, _super);

    function BaseNotebookView() {
      this.generateToc = __bind(this.generateToc, this);
      this.typeset = __bind(this.typeset, this);
      this.share = __bind(this.share, this);
      this.saveToFile = __bind(this.saveToFile, this);
      this.mathjaxReady = __bind(this.mathjaxReady, this);
      this.handleTocJump = __bind(this.handleTocJump, this);
      BaseNotebookView.__super__.constructor.apply(this, arguments);
    }

    BaseNotebookView.prototype.className = "app";

    BaseNotebookView.prototype.handleTocJump = function(e) {
      var target;
      window.e = e;
      target = $(e.target).attr('href');
      if (target) {
        target = $('#' + target);
        return scrollToAtTop(target);
      }
    };

    BaseNotebookView.prototype.mathjaxReady = function() {
      return this.typeset();
    };

    BaseNotebookView.prototype.saveToFile = function(e) {
      var data;
      data = this.model.serialize();
      $(e.target).attr('download', "notebook-" + (new Date().toISOString().slice(0, 10)) + ".json");
      return $(e.target).attr('href', 'data:application/json;charset=utf-8,' + escape(data));
    };

    BaseNotebookView.prototype.share = function() {
      var enc, modal, tmpl, url;
      enc = NotebookJS.util.base64UrlEncode(this.model.serialize());
      url = "http://" + location.host + "/#import/" + (escape(enc)) + "/";
      tmpl = _.template($('#share-notebook').html());
      modal = new NotebookJS.util.ModalDialog(tmpl({
        url: url
      }));
      return modal.element.find('input').focus().select();
    };

    BaseNotebookView.prototype.typeset = function() {
      var el, _i, _len, _ref2;
      prettyPrint();
      _ref2 = this.$('#notebook');
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        el = _ref2[_i];
        MathJax.Hub.Typeset(el);
      }
      return this.$('#toc').html(this.generateToc());
    };

    BaseNotebookView.prototype.generateToc = function() {
      var toc,
        _this = this;
      toc = $(document.createElement('div'));
      this.$('.cell').each(function(i, cell) {
        var celldiv;
        celldiv = $(document.createElement('div')).appendTo(toc);
        celldiv.addClass('toc-cell');
        celldiv.attr('href', $(cell).attr('id'));
        return $(cell).find('h1, h2, h3').each(function(j, heading) {
          var el, linkid;
          linkid = "title" + i + '_' + j;
          $(heading).attr('id', linkid);
          el = $(document.createElement('div'));
          el.addClass(heading.tagName);
          el.addClass('toc-entry');
          el.attr('href', linkid);
          el.html($(heading).html());
          return toc.append(el);
        });
      });
      return toc;
    };

    return BaseNotebookView;

  })(Backbone.View);

  ViewNotebookView = (function(_super) {

    __extends(ViewNotebookView, _super);

    function ViewNotebookView() {
      this.renderCell = __bind(this.renderCell, this);
      this.addAll = __bind(this.addAll, this);
      this.addOne = __bind(this.addOne, this);
      this.render = __bind(this.render, this);
      this.initialize = __bind(this.initialize, this);
      this.toggleEdit = __bind(this.toggleEdit, this);
      ViewNotebookView.__super__.constructor.apply(this, arguments);
    }

    ViewNotebookView.prototype.events = {
      'click #toc': 'handleTocJump',
      "click #toggle-edit": "toggleEdit",
      "click #save-to-file": "saveToFile",
      "click #share-url": "share",
      'dblclick #notebook': 'toggleEdit'
    };

    ViewNotebookView.prototype.toggleEdit = function() {
      return NotebookJS.router.navigate(this.model.get('id') + '/edit/', {
        trigger: true
      });
    };

    ViewNotebookView.prototype.initialize = function() {
      this.template = _.template($('#notebook-template').html());
      this.cellTemplate = _.template($('#cell-view-template').html());
      $('.container').append(this.render());
      this.cells = this.$('.cells');
      this.model.cells.fetch({
        success: this.addAll
      });
      if (NotebookJS.mathjaxReady) return this.typeset();
    };

    ViewNotebookView.prototype.render = function() {
      $(this.el).html(this.template());
      return this.el;
    };

    ViewNotebookView.prototype.addOne = function(cell) {
      var newEl;
      newEl = this.renderCell(cell);
      return this.cells.append(newEl);
    };

    ViewNotebookView.prototype.addAll = function(cells) {
      return cells.each(this.addOne);
    };

    ViewNotebookView.prototype.renderCell = function(cell) {
      var data;
      data = cell.toJSON();
      data.input = data.input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return this.cellTemplate(data);
    };

    return ViewNotebookView;

  })(BaseNotebookView);

  EditNotebookView = (function(_super) {

    __extends(EditNotebookView, _super);

    function EditNotebookView() {
      this.save = __bind(this.save, this);
      this.toggleEdit = __bind(this.toggleEdit, this);
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
        'click #toc': 'handleTocJump',
        "dblclick #spawner": 'spawnCellAtEnd',
        "keyup #spawner": 'spawnKeypress',
        "click #toggle-edit": "toggleEdit",
        "click #save-to-file": "saveToFile",
        "click #share-url": "share",
        "click #save": "save"
      };
    };

    EditNotebookView.prototype.initialize = function() {
      this.template = _.template($('#notebook-template').html());
      $('.container').append(this.render());
      this.cells = this.$('.cells');
      this.model.cells.bind('add', this.addOne, this);
      this.model.cells.bind('refresh', this.addAll, this);
      this.model.cells.fetch({
        success: this.addAll
      });
      if (NotebookJS.mathjaxReady) return this.typeset();
    };

    EditNotebookView.prototype.render = function() {
      $(this.el).html(this.template());
      return this.el;
    };

    EditNotebookView.prototype.addOne = function(cell) {
      var index, newEl, previous, previousView, view;
      console.log('addOne');
      NotebookJS.c = cell;
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
        return this.model.cells.at(ncells - 1).view.output.focus();
      }
    };

    EditNotebookView.prototype.toggleEdit = function() {
      return NotebookJS.router.navigate(this.model.get('id') + '/view/', {
        trigger: true
      });
    };

    EditNotebookView.prototype.save = function() {
      this.model.save();
      this.model.cells.each(function(c) {
        return c.save();
      });
      return this.model.set({
        pendingSaves: false
      });
    };

    return EditNotebookView;

  })(BaseNotebookView);

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
      this.focusCellBelow = __bind(this.focusCellBelow, this);
      this.focusCellAbove = __bind(this.focusCellAbove, this);
      this.blurOutput = __bind(this.blurOutput, this);
      this.focusOutput = __bind(this.focusOutput, this);
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
        "focus .cell-output": "focusOutput",
        "blur .cell-input": "blurInput",
        "blur .cell-output": "blurOutput"
      };
    };

    CellEditView.prototype.initialize = function() {
      this.template = _.template($('#cell-edit-template').html());
      this.model.bind('change:state', this.changeState, this);
      this.model.bind('change:type', this.changeType, this);
      this.model.bind('change:output', this.changeOutput, this);
      this.model.bind('change:inputFold', this.changeInputFold, this);
      this.model.bind('destroy', this.remove, this);
      this.model.view = this;
      return this.editor = null;
    };

    CellEditView.prototype.logev = function(ev) {
      return console.log('in ev', ev);
    };

    CellEditView.prototype.render = function(ev) {
      var dat;
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
      this.output.html(this.model.get('output'));
      if (NotebookJS.mathjaxReady) return MathJax.Hub.Typeset(this.output[0]);
    };

    CellEditView.prototype.changeState = function() {
      console.log('view changing state to', this.model.get('state'));
      switch (this.model.get('state')) {
        case 'evaluating':
          this.output.html('...');
          $(this.el).addClass('eval-cell');
          return $(this.el).removeClass('dirty-cell');
        case 'dirty':
          return $(this.el).addClass('dirty-cell');
        case null:
          return $(this.el).removeClass('eval-cell');
      }
    };

    CellEditView.prototype.afterDomInsert = function() {
      var ace_id, crs_to_add, input,
        _this = this;
      if (this.model.id != null) {
        ace_id = this.model.id;
      } else {
        ace_id = this.model.cid;
      }
      this.editor = ace.edit('input-' + ace_id);
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
      input = this.model.get('input');
      crs_to_add = Math.max(3 - _.string.count(input, '\n'), 0);
      input = input + '\n';
      this.editor.getSession().setValue(input);
      this.resizeEditor();
      this.editor.getSession().on('change', this.inputChange);
      this.setEditorHighlightMode();
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
          if (!isScrolledIntoView(cursor)) scrollToAtTop(cursor);
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
          if (!isScrolledIntoView(cursor)) scrollToAtBottom(cursor);
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
      return this.model.toggleInputFold();
    };

    CellEditView.prototype.changeInputFold = function() {
      this.inputContainer.toggleClass('input-fold');
      this.$('.fold-button').toggleClass('input-fold');
      return this.$('hr').toggleClass('input-fold');
    };

    CellEditView.prototype.focusInput = function(where) {
      $(this.el).addClass('active-cell');
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
      $(this.el).removeClass('active-cell');
      if (this.editor != null) {
        this.editor.setHighlightActiveLine(false);
        return this.$('.ace_cursor-layer').hide();
      }
    };

    CellEditView.prototype.focusOutput = function() {
      return $(this.el).addClass('active-cell');
    };

    CellEditView.prototype.blurOutput = function() {
      return $(this.el).removeClass('active-cell');
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
        return $('#spawner').focus();
      }
    };

    CellEditView.prototype.setEditorHighlightMode = function() {
      var mode;
      if (this.model.get('type') === 'code') {
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
      console.log('destroy');
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
      lines = this.editor.getSession().getScreenLength();
      if (line_height === 1) {
        setTimeout(this.resizeEditor, 200);
        return;
      }
      this.$('.ace-container').height(20 + (line_height * lines));
      return this.editor.resize();
    };

    return CellEditView;

  })(Backbone.View);

  IndexView = (function(_super) {

    __extends(IndexView, _super);

    function IndexView() {
      this.mathjaxReady = __bind(this.mathjaxReady, this);
      this.loadFile = __bind(this.loadFile, this);
      this["new"] = __bind(this["new"], this);
      this.addNbs = __bind(this.addNbs, this);
      this.addNb = __bind(this.addNb, this);
      this.render = __bind(this.render, this);
      this.initialize = __bind(this.initialize, this);
      IndexView.__super__.constructor.apply(this, arguments);
    }

    IndexView.prototype.className = 'app';

    IndexView.prototype.events = {
      'click #new-notebook-button': 'new',
      'change #load-file': 'loadFile'
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
      this.nbtemplate = _.template($('#notebook-index-template').html());
      return NotebookJS.notebooks.each(this.addNb);
    };

    IndexView.prototype["new"] = function() {
      console.log('new');
      return NotebookJS.router.navigate('new/', {
        trigger: true
      });
    };

    IndexView.prototype.loadFile = function(ev) {
      var file, reader,
        _this = this;
      file = ev.target.files[0];
      reader = new FileReader();
      reader.onload = function(e) {
        var nbdata, notebook;
        nbdata = JSON.parse(e.target.result);
        notebook = loadNotebook(nbdata);
        return NotebookJS.router.navigate(notebook.get('id') + '/view/', {
          trigger: true
        });
      };
      return reader.readAsText(file);
    };

    IndexView.prototype.mathjaxReady = function() {};

    return IndexView;

  })(Backbone.View);

  NewView = (function(_super) {

    __extends(NewView, _super);

    function NewView() {
      this.mathjaxReady = __bind(this.mathjaxReady, this);
      this.create = __bind(this.create, this);
      this.render = __bind(this.render, this);
      this.initialize = __bind(this.initialize, this);
      NewView.__super__.constructor.apply(this, arguments);
    }

    NewView.prototype.className = 'app';

    NewView.prototype.events = {
      'click #create': 'create'
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
      var nb, title;
      title = this.$('input').val();
      if (title === '') return;
      nb = NotebookJS.notebooks.create({
        title: title
      }, {
        wait: true
      });
      nb.readyCells();
      nb.cells.create({
        position: nb.cells.posJump
      });
      return NotebookJS.router.navigate(nb.get('id') + '/edit/', {
        trigger: true
      });
    };

    NewView.prototype.mathjaxReady = function() {};

    return NewView;

  })(Backbone.View);

  NotebookRouter = (function(_super) {

    __extends(NotebookRouter, _super);

    function NotebookRouter() {
      this.onbeforeunload = __bind(this.onbeforeunload, this);
      this["import"] = __bind(this["import"], this);
      this.loadUrl = __bind(this.loadUrl, this);
      this.index = __bind(this.index, this);
      this["new"] = __bind(this["new"], this);
      this["delete"] = __bind(this["delete"], this);
      this.view = __bind(this.view, this);
      this.edit = __bind(this.edit, this);
      this.getNotebook = __bind(this.getNotebook, this);
      this.removeView = __bind(this.removeView, this);
      this.unmatched = __bind(this.unmatched, this);
      NotebookRouter.__super__.constructor.apply(this, arguments);
    }

    NotebookRouter.prototype.routes = {
      ":nb/edit/": "edit",
      ":nb/view/": "view",
      ":nb/delete/": "delete",
      'load/*url': 'loadUrl',
      "new/": "new",
      "import/*data/": 'import',
      "": "index"
    };

    NotebookRouter.prototype.unmatched = function(p) {
      return console.log(p);
    };

    NotebookRouter.prototype.removeView = function() {
      var n, view;
      view = NotebookJS.app;
      if (view != null) view.remove();
      if (NotebookJS.nb != null) {
        n = NotebookJS.nb;
        n.saveAll();
        if (view != null) {
          n.off(null, null, view);
          n.cells.off(null, null, view);
        }
        n.cells.each(function(c) {
          if (c.view != null) {
            c.view = null;
            return c.off(null, null, c.view);
          }
        });
        return NotebookJS.nb = null;
      }
    };

    NotebookRouter.prototype.getNotebook = function(nb) {
      var notebook;
      notebook = NotebookJS.notebooks.get(nb);
      notebook.readyCells();
      NotebookJS.nb = notebook;
      return notebook;
    };

    NotebookRouter.prototype.edit = function(nb) {
      var notebook;
      this.removeView();
      console.log('activated edit route', nb);
      notebook = this.getNotebook(nb);
      NotebookJS.app = new EditNotebookView({
        model: notebook
      });
      setTitle(notebook.get('title') + ' (Editing)');
      if (!(notebook.get('running') != null)) return notebook.start();
    };

    NotebookRouter.prototype.view = function(nb) {
      var notebook;
      this.removeView();
      console.log('activated view route');
      notebook = this.getNotebook(nb);
      setTitle(notebook.get('title') + ' (Viewing)');
      return NotebookJS.app = new ViewNotebookView({
        model: notebook
      });
    };

    NotebookRouter.prototype["delete"] = function(nb) {
      var confirmed, notebook;
      confirmed = confirm('You really want to delete that?');
      if (confirmed) {
        notebook = this.getNotebook(nb);
        notebook.destroyAll();
        NotebookJS.nb = null;
      }
      return NotebookJS.router.navigate('', {
        trigger: true,
        replace: true
      });
    };

    NotebookRouter.prototype["new"] = function(nb) {
      console.log('new view');
      this.removeView();
      return NotebookJS.app = new NewView();
    };

    NotebookRouter.prototype.index = function() {
      this.removeView();
      console.log('index view');
      setTitle('');
      return NotebookJS.app = new IndexView();
    };

    NotebookRouter.prototype.loadUrl = function(url) {
      var _this = this;
      console.log('loading url');
      return $.getJSON(url, function(data) {
        var notebook;
        notebook = loadNotebook(data);
        return NotebookJS.router.navigate(notebook.get('id') + '/view/', {
          trigger: true,
          replace: true
        });
      });
    };

    NotebookRouter.prototype["import"] = function(data) {
      var notebook;
      data = JSON.parse(NotebookJS.util.base64UrlDecode(data));
      notebook = loadNotebook(data);
      return NotebookJS.router.navigate(notebook.get('id') + '/view/', {
        trigger: true,
        replace: true
      });
    };

    NotebookRouter.prototype.onbeforeunload = function(e) {
      if (NotebookJS.nb != null) NotebookJS.nb.saveAll();
      if (_.any(NotebookJS.notebooks.map(function(x) {
        return x.get('state') === 'running';
      }))) {
        return 'You have running notebooks, are you sure?';
      }
    };

    return NotebookRouter;

  })(Backbone.Router);

  setTitle = function(title) {
    return $('#title').html(title);
  };

  loadNotebook = function(nbdata) {
    var c, celldata, notebook, _fn, _i, _len;
    celldata = nbdata.cells;
    delete nbdata.cells;
    nbdata.title = nbdata.title;
    try {
      if (NotebookJS.notebooks.get(nbdata.id)) raise('duplicate');
      console.log('no such nb', nbdata.id);
      console.log('import notebook');
      notebook = NotebookJS.notebooks.create(nbdata);
      notebook.readyCells();
      _fn = function(c) {
        return notebook.cells.create(c);
      };
      for (_i = 0, _len = celldata.length; _i < _len; _i++) {
        c = celldata[_i];
        _fn(c);
      }
      return notebook;
    } catch (error) {
      alert('Could not import notebook probably because it already exists.  try deleting');
      return console.log(error);
    }
  };

  mathjaxReady = function() {
    NotebookJS.mathjaxReady = true;
    return NotebookJS.app.mathjaxReady();
  };

  $(document).ready(function() {
    console.log('creating app');
    NotebookJS.notebooks = new NotebookJS.Notebooks();
    NotebookJS.notebooks.fetch();
    NotebookJS.mathjaxReady = false;
    NotebookJS.router = new NotebookRouter();
    Backbone.history.start();
    MathJax.Hub.Register.StartupHook('End', mathjaxReady);
    return window.onbeforeunload = NotebookJS.router.onbeforeunload;
  });

}).call(this);
