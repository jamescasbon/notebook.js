(function() {
  var Cell, Cells, Notebook, NotebookView, Notebooks;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  Notebook = (function() {
    __extends(Notebook, Backbone.Model);
    function Notebook() {
      this.initialize = __bind(this.initialize, this);
      this.defaults = __bind(this.defaults, this);
      Notebook.__super__.constructor.apply(this, arguments);
    }
    Notebook.prototype.defaults = function() {
      return {
        title: "untitled"
      };
    };
    Notebook.prototype.initialize = function() {
      this.cells = new Cells();
      return this.cells.localStorage = new Store('Cells');
    };
    return Notebook;
  })();
  Notebooks = (function() {
    __extends(Notebooks, Backbone.Collection);
    function Notebooks() {
      Notebooks.__super__.constructor.apply(this, arguments);
    }
    Notebooks.prototype.localStorage = new Store("Notebooks");
    Notebooks.prototype.model = Notebook;
    return Notebooks;
  })();
  NotebookView = (function() {
    __extends(NotebookView, Backbone.View);
    function NotebookView() {
      this.render = __bind(this.render, this);
      this.initialize = __bind(this.initialize, this);
      NotebookView.__super__.constructor.apply(this, arguments);
    }
    NotebookView.prototype.el = "#notebook";
    NotebookView.prototype.initialize = function() {
      this.title = $('#title');
      return this.render();
    };
    NotebookView.prototype.render = function() {
      console.log('rendering' + this.model.get('title'));
      return this.title.html(this.model.get("title"));
    };
    return NotebookView;
  })();
  Cell = (function() {
    __extends(Cell, Backbone.Model);
    function Cell() {
      this.defaults = __bind(this.defaults, this);
      Cell.__super__.constructor.apply(this, arguments);
    }
    Cell.prototype.defaults = function() {
      return {
        input: "something"
      };
    };
    return Cell;
  })();
  Cells = (function() {
    __extends(Cells, Backbone.Collection);
    function Cells() {
      Cells.__super__.constructor.apply(this, arguments);
    }
    Cells.prototype.model = Cell;
    return Cells;
  })();
  $(document).ready(function() {
    var app, notebook, notebooks;
    console.log('creating app');
    notebooks = new Notebooks();
    notebook = notebooks.create();
    app = new NotebookView({
      model: notebook
    });
    window.n = notebook;
    window.C = Cell;
    return window.N = Notebook;
  });
}).call(this);
