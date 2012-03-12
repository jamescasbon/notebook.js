(function() {
  var Cell, Cells, Notebook, Notebooks, root,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  Notebook = (function(_super) {

    __extends(Notebook, _super);

    function Notebook() {
      this.serialize = __bind(this.serialize, this);
      this.readyCells = __bind(this.readyCells, this);
      this.initialize = __bind(this.initialize, this);
      this.defaults = __bind(this.defaults, this);
      Notebook.__super__.constructor.apply(this, arguments);
    }

    Notebook.prototype.defaults = function() {
      return {
        title: "untitled"
      };
    };

    Notebook.prototype.initialize = function() {};

    Notebook.prototype.readyCells = function() {
      console.log('creating store for nb id', this.get('id'));
      this.cells = new Cells();
      return this.cells.localStorage = new Store('cells-' + this.get('id'));
    };

    Notebook.prototype.serialize = function() {
      var data;
      data = this.toJSON();
      data.cells = this.cells.toJSON();
      return JSON.stringify(data);
    };

    return Notebook;

  })(Backbone.Model);

  Notebooks = (function(_super) {

    __extends(Notebooks, _super);

    function Notebooks() {
      Notebooks.__super__.constructor.apply(this, arguments);
    }

    Notebooks.prototype.model = Notebook;

    Notebooks.prototype.localStorage = new Store('Notebooks1');

    return Notebooks;

  })(Backbone.Collection);

  Cell = (function(_super) {

    __extends(Cell, _super);

    function Cell() {
      this.handleMessage = __bind(this.handleMessage, this);
      this.evaluateError = __bind(this.evaluateError, this);
      this.evaluateSuccess = __bind(this.evaluateSuccess, this);
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
        type: "javascript",
        inputFold: false,
        output: null,
        position: null,
        error: null,
        state: null
      };
    };

    Cell.prototype.toggleType = function() {
      if (this.get('type') === 'javascript') {
        this.set({
          type: 'markdown'
        });
      } else {
        this.set({
          type: 'javascript'
        });
      }
      return this.set({
        state: 'dirty'
      });
    };

    Cell.prototype.toggleInputFold = function() {
      this.set({
        inputFold: !this.get('inputFold')
      });
      return this.save();
    };

    Cell.prototype.evaluate = function() {
      this.set({
        output: null,
        error: null
      });
      this.set({
        state: 'evaluating'
      });
      this.save();
      this.handler = root.engines[this.get('type')];
      return this.handler.evaluate(this.get('input'), this);
    };

    Cell.prototype.interrupt = function() {
      if (this.handler != null) {
        this.onPrint('Interrupted', 'error');
        this.handler.interrupt();
        this.set({
          state: null
        });
        return this.save();
      }
    };

    Cell.prototype.evaluateSuccess = function(output) {
      this.set({
        output: output,
        error: null
      });
      return this.save();
    };

    Cell.prototype.evaluateError = function(error) {
      this.set({
        error: error
      });
      return this.save;
    };

    Cell.prototype.handleMessage = function(data) {
      console.log('cell handling message from engine', data);
      switch (data.msg) {
        case 'evalEnd':
          this.set({
            state: null
          });
          return this.save();
        case 'error':
          return this.onPrint(data.data, 'error');
        case 'print':
          return this.onPrint(data.data, 'print');
        case 'result':
          return this.onPrint(data.data, 'print');
        case 'raw':
          return this.onPrint(data.data, 'raw');
      }
    };

    Cell.prototype.onError = function(error) {
      return this.set({
        error: error
      });
    };

    Cell.prototype.onPrint = function(data, elName) {
      var current;
      current = this.get('output') || "";
      this.set({
        output: current.concat('<div class="' + elName + '">' + data + '</div>')
      });
      return console.log('current output', this.get('output'));
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

  root.Notebook = Notebook;

  root.Cell = Cell;

  root.Notebooks = Notebooks;

  root.Cells = Cells;

}).call(this);
