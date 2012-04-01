root = exports ? this
NotebookJS = root.NotebookJS = root.NotebookJS ? {}


class Notebook extends Backbone.Model
  defaults: =>
    title: "untitled", 
    language: 'Javascript'
    state: null

  initialize: =>
    @cells = new Cells()
    @cells.on 'add', @cellAdded
    @engines = null

  # we need this hook for localStorage because the id is not available at init
  readyCells: =>
    #console.log('creating store for nb id', @get('id'))
    @cells.localStorage = new Store('cells-' + @get('id'))

  serialize: =>
    data = @toJSON()
    data.cells = @cells.toJSON()
    return JSON.stringify(data)

  cellAdded: (cell) =>
    cell.engine = null

  start: => 
    @engines = (code: new NotebookJS.engines.Javascript(), markdown: new NotebookJS.engines.Markdown())

class Notebooks extends Backbone.Collection
  model: Notebook
  localStorage: new Store('notebook.js')


# Cell has state and dispatches evaluations to handler
#
# States:
#  - null: default unedited state
#  - dirty: edits to input made
#  - evaluating: waiting for handler
#
class Cell extends Backbone.Model
  tagName: 'li'
  defaults: =>
    input: "",
    type: "Javascript",
    inputFold: false
    output: null,
    position: null,
    error: null,
    state: null

  toggleType: =>
    if @get('type') == 'Javascript'
      @set type: 'Markdown'
    else
      @set type: 'Javascript'
    @set state: 'dirty'
    #@evaluate()

  toggleInputFold: =>
    @set inputFold: not @get('inputFold')

  evaluate: =>
    @set(output: null, error: null)
    @set state: 'evaluating'
    @engine.evaluate @get('input'), @

  interrupt: =>
    @addOutput('Interrupted', 'error')
    @engine.interrupt()
    @set state: null

  addOutput: (data, elName) =>
    current = @get('output') or ""
    @set(output: current.concat('<div class="' + elName + '">' + data + '</div>'))

  # engine protocol
  error: (data) -> @addOutput data, 'error'
  print: (data) -> @addOutput data, 'print'
  result: (data) -> @addOutput data, 'print'
  evalBegin: => 
    return 
  evalEnd: =>
    @set(state: null)




class Cells extends Backbone.Collection
  model: Cell

  # sort by position and put large jumps in the position to allow insertion
  posJump: Math.pow(2, 16)
  comparator: (l,r) =>
    l = l.get('position')
    r = r.get('position')
    if l > r
      return 1
    if l < r
      return -1
    return 0

  # creation methods that preserve the ordering of the notebook
  createAtEnd: ->
    if @length
      pos = @at(@length - 1).get('position') + @posJump
    else
      pos = @posJump
    @create position: pos

  createBefore: (cell) ->
    cellIndex = @indexOf(cell)
    cellPos = cell.get('position')
    if cellIndex == 0
      prevPos = 0
    else
      prevPos = @at(cellIndex - 1).get('position')
    @create position: (cellPos + prevPos)/2


NotebookJS.Notebook = Notebook
NotebookJS.Notebooks = Notebooks
NotebookJS.Cell = Cell
NotebookJS.Cells = Cells
