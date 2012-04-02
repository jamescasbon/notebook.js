(function() {
  var Cell, Cells, Notebook, NotebookJS, Notebooks, root, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  NotebookJS = root.NotebookJS = (_ref = root.NotebookJS) != null ? _ref : {};

  Notebook = (function(_super) {

    __extends(Notebook, _super);

    function Notebook() {
      this.stop = __bind(this.stop, this);
      this.start = __bind(this.start, this);
      this.cellChanged = __bind(this.cellChanged, this);
      this.cellAdded = __bind(this.cellAdded, this);
      this.cellsFetched = __bind(this.cellsFetched, this);
      this.serialize = __bind(this.serialize, this);
      this.readyCells = __bind(this.readyCells, this);
      this.initialize = __bind(this.initialize, this);
      this.defaults = __bind(this.defaults, this);
      Notebook.__super__.constructor.apply(this, arguments);
    }

    Notebook.prototype.defaults = function() {
      return {
        title: "untitled",
        language: 'Javascript',
        state: null,
        pendingSaves: false
      };
    };

    Notebook.prototype.initialize = function() {
      this.cells = new Cells();
      this.cells.on('add', this.cellAdded);
      this.cells.on('change', this.cellChanged);
      this.cells.on('remove', this.cellChanged);
      this.cells.on('fetch', this.cellsFetched);
      return this.engines = null;
    };

    Notebook.prototype.readyCells = function() {
      return this.cells.localStorage = new Store('cells-' + this.get('id'));
    };

    Notebook.prototype.serialize = function() {
      var data;
      data = this.toJSON();
      data.cells = this.cells.toJSON();
      return JSON.stringify(data);
    };

    Notebook.prototype.cellsFetched = function(cells) {
      return cells.each(function(cell) {
        return cell.engines = this.engines;
      });
    };

    Notebook.prototype.cellAdded = function(cell) {
      cell.engines = this.engines;
      return this.set({
        pendingSaves: true
      });
    };

    Notebook.prototype.cellChanged = function() {
      return this.set({
        pendingSaves: true
      });
    };

    Notebook.prototype.start = function() {
      var _this = this;
      this.set({
        state: 'running'
      });
      this.engines = {
        code: new NotebookJS.engines.Javascript(),
        markdown: new NotebookJS.engines.Markdown()
      };
      return this.cells.each(function(cell) {
        return cell.engines = _this.engines;
      });
    };

    Notebook.prototype.stop = function() {
      this.set({
        state: null
      });
      return this.engines = null;
    };

    return Notebook;

  })(Backbone.Model);

  Notebooks = (function(_super) {

    __extends(Notebooks, _super);

    function Notebooks() {
      Notebooks.__super__.constructor.apply(this, arguments);
    }

    Notebooks.prototype.model = Notebook;

    Notebooks.prototype.localStorage = new Store('notebook.js');

    return Notebooks;

  })(Backbone.Collection);

  Cell = (function(_super) {

    __extends(Cell, _super);

    function Cell() {
      this.evalEnd = __bind(this.evalEnd, this);
      this.evalBegin = __bind(this.evalBegin, this);
      this.addOutput = __bind(this.addOutput, this);
      this.interrupt = __bind(this.interrupt, this);
      this.evaluate = __bind(this.evaluate, this);
      this.toggleInputFold = __bind(this.toggleInputFold, this);
      this.toggleType = __bind(this.toggleType, this);
      this.defaults = __bind(this.defaults, this);
      Cell.__super__.constructor.apply(this, arguments);
    }

    Cell.prototype.tagName = 'li';

    Cell.prototype.defaults = function() {
      return {
        input: "",
        type: "code",
        inputFold: false,
        output: null,
        position: null,
        error: null,
        state: null
      };
    };

    Cell.prototype.toggleType = function() {
      if (this.get('type') === 'code') {
        this.set({
          type: 'markdown'
        });
      } else {
        this.set({
          type: 'code'
        });
      }
      return this.set({
        state: 'dirty'
      });
    };

    Cell.prototype.toggleInputFold = function() {
      return this.set({
        inputFold: !this.get('inputFold')
      });
    };

    Cell.prototype.evaluate = function() {
      this.set({
        output: null,
        error: null
      });
      this.set({
        state: 'evaluating'
      });
      return this.engines[this.get('type')].evaluate(this.get('input'), this);
    };

    Cell.prototype.interrupt = function() {
      this.addOutput('Interrupted', 'error');
      this.engines[this.get('type')].interrupt();
      return this.set({
        state: null
      });
    };

    Cell.prototype.addOutput = function(data, elName) {
      var current;
      current = this.get('output') || "";
      return this.set({
        output: current.concat('<div class="' + elName + '">' + data + '</div>')
      });
    };

    Cell.prototype.error = function(data) {
      return this.addOutput(data, 'error');
    };

    Cell.prototype.print = function(data) {
      return this.addOutput(data, 'print');
    };

    Cell.prototype.result = function(data) {
      return this.addOutput(data, 'print');
    };

    Cell.prototype.evalBegin = function() {};

    Cell.prototype.evalEnd = function() {
      return this.set({
        state: null
      });
    };

    return Cell;

  })(Backbone.Model);

  Cells = (function(_super) {

    __extends(Cells, _super);

    function Cells() {
      this.comparator = __bind(this.comparator, this);
      Cells.__super__.constructor.apply(this, arguments);
    }

    Cells.prototype.model = Cell;

    Cells.prototype.posJump = Math.pow(2, 16);

    Cells.prototype.comparator = function(l, r) {
      l = l.get('position');
      r = r.get('position');
      if (l > r) return 1;
      if (l < r) return -1;
      return 0;
    };

    Cells.prototype.createAtEnd = function() {
      var pos;
      if (this.length) {
        pos = this.at(this.length - 1).get('position') + this.posJump;
      } else {
        pos = this.posJump;
      }
      return this.create({
        position: pos
      });
    };

    Cells.prototype.createBefore = function(cell) {
      var cellIndex, cellPos, prevPos;
      cellIndex = this.indexOf(cell);
      cellPos = cell.get('position');
      if (cellIndex === 0) {
        prevPos = 0;
      } else {
        prevPos = this.at(cellIndex - 1).get('position');
      }
      return this.create({
        position: (cellPos + prevPos) / 2
      });
    };

    return Cells;

  })(Backbone.Collection);

  NotebookJS.Notebook = Notebook;

  NotebookJS.Notebooks = Notebooks;

  NotebookJS.Cell = Cell;

  NotebookJS.Cells = Cells;

}).call(this);
