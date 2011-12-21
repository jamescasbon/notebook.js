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
      this.spawnCell = __bind(this.spawnCell, this);
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
        "click #spawner": 'spawnCell'
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
      return view.afterDomInsert();
    };

    NotebookView.prototype.addAll = function(cells) {
      console.log(cells);
      return cells.each(this.addOne);
    };

    NotebookView.prototype.spawnCell = function() {
      console.log('spawning cell');
      return this.model.cells.createAtEnd();
    };

    return NotebookView;

  })(Backbone.View);

  CellView = (function(_super) {

    __extends(CellView, _super);

    function CellView() {
      this.toggle = __bind(this.toggle, this);
      this.spawnAbove = __bind(this.spawnAbove, this);
      this.remove = __bind(this.remove, this);
      this.destroy = __bind(this.destroy, this);
      this.evaluate = __bind(this.evaluate, this);
      this.setEditorHighlightMode = __bind(this.setEditorHighlightMode, this);
      this.afterDomInsert = __bind(this.afterDomInsert, this);
      this.render = __bind(this.render, this);
      this.logev = __bind(this.logev, this);
      this.initialize = __bind(this.initialize, this);
      this.events = __bind(this.events, this);
      CellView.__super__.constructor.apply(this, arguments);
    }

    CellView.prototype.tagName = 'li';

    CellView.prototype.events = function() {
      return {
        "click .spawn-above": 'spawnAbove',
        "click .evaluate": "evaluate",
        "click .delete": "destroy",
        "click .toggle": 'toggle',
        "evaluate": "evaluate",
        "toggle": "toggle"
      };
    };

    CellView.prototype.initialize = function() {
      this.template = _.template($('#cell-template').html());
      this.model.bind('change', this.render);
      this.model.bind('destroy', this.remove);
      this.model.view = this;
      this.editor = null;
      return this.model.bind('all', this.logev);
    };

    CellView.prototype.logev = function(ev) {
      return console.log('in ev', ev);
    };

    CellView.prototype.render = function() {
      if (!(this.editor != null)) {
        console.log('render cell', this.model.toJSON());
        $(this.el).html(this.template(this.model.toJSON()));
        this.input = this.$('.cell-input');
        this.output = this.$('.cell-output');
        this.type = this.$('.type');
      } else {
        console.log('rerender');
        this.type.html(this.model.get('type'));
        if (!(this.model.get('error') != null)) {
          this.output.html(this.model.get('output'));
        } else {
          console.log('error', this.model.get('error'));
          this.output.html(this.model.get('error'));
        }
        this.setEditorHighlightMode();
      }
      return this.el;
    };

    CellView.prototype.afterDomInsert = function() {
      this.editor = ace.edit('input-' + this.model.id);
      this.editor.resize();
      this.editor.getSession().setUseWrapMode(true);
      this.editor.renderer.setShowGutter(false);
      this.editor.renderer.setHScrollBarAlwaysVisible(false);
      this.editor.renderer.setShowPrintMargin(false);
      this.editor.setHighlightActiveLine(true);
      return this.setEditorHighlightMode();
    };

    CellView.prototype.setEditorHighlightMode = function() {
      var mode;
      if (this.model.get('type') === 'javascript') {
        mode = require("ace/mode/javascript").Mode;
      } else if (this.model.get('mode') === 'markdown') {
        mode = require("ace/mode/text").Mode;
      }
      if (mode != null) return this.editor.getSession().setMode(new mode());
    };

    CellView.prototype.evaluate = function() {
      console.log('in cellview evaluate handler');
      this.model.set({
        input: this.editor.getSession().getValue()
      });
      return this.model.evaluate();
    };

    CellView.prototype.destroy = function() {
      console.log('in cellview destroy handler');
      return this.model.destroy();
    };

    CellView.prototype.remove = function() {
      return $(this.el).fadeOut('fast', $(this.el).remove);
    };

    CellView.prototype.spawnAbove = function() {
      return this.model.collection.createBefore(this.model);
    };

    CellView.prototype.toggle = function() {
      return this.model.toggleType();
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
    return root.n = notebook;
  });

}).call(this);
