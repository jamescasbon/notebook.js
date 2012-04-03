root = exports ? this
NotebookJS = root.NotebookJS = root.NotebookJS ? {}


class Notebook extends Backbone.Model
  defaults: =>
    title: "untitled"
    description: ""
    language: 'Javascript'
    state: null
    pendingSaves: false
    engineUrl: null
    gist: null

  initialize: =>
    
    # if the browser is closed, notebooks are left hanging 
    if @get('state') == 'running' and @get('engineUrl') == 'browser://'
      @set state: null, engineUrl: null

    @cells = new Cells()
    @cells.on 'add', @cellAdded
    @cells.on 'change', @cellChanged
    @cells.on 'remove', @cellChanged
    @cells.on 'fetch', @cellsFetched
    @engines = null

  # we need this hook for localStorage because the id is not available at init
  readyCells: =>
    @cells.localStorage = new Store('cells-' + @get('id'))

  serialize: =>
    data = @toJSON()
    data.cells = @cells.toJSON()
    return JSON.stringify(data, null, 2)

  # update cell engine refs when fetched 
  cellsFetched: (cells) =>
    cells.each (cell) ->
      cell.engines = @engines

  # new cells need a reference to the engines and the notebooks needs saving
  cellAdded: (cell) =>
    cell.engines = @engines
    @set pendingSaves: true

  # set the notebook as needing to be saved when a cell changes
  cellChanged: =>  
    @set pendingSaves: true

  # start the engines for this notebook
  start: => 
    @set state: 'running'
    @set engineUrl: 'browser://'
    @engines = 
      code: new NotebookJS.engines.Javascript(),
      markdown: new NotebookJS.engines.Markdown()
    @cells.each (cell) => 
      cell.engines = @engines

  # stop the engines for this notebook
  stop: => 
    @set state: null
    @engines = null

  saveAll: => 
    console.log 'saving nb'
    @save()
    @cells.each (c) -> c.save()
    @set pendingSaves: false

  destroyAll: =>
    @cells.fetch success: (cells) ->
      cells.each (cell) ->
        cell.destroy()
    @destroy()
   
  asScript: =>
    script = ""

    @cells.each (c) -> 
      if c.get('type') == 'markdown' then script += '/*\n'
      script += c.get('input')
      if c.get('type') == 'markdown' then script += '*/\n'
      script += '\n'
    
    script


  asGist: =>
    description: @get('title')
    public: true
    files:  
      'notebook.json': 
        content: @serialize()
      'notebook.js': 
        content: @asScript()
      


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
    type: "code",
    inputFold: false
    output: null,
    position: null,
    error: null,
    state: null

  initialize: => 
    # backwards compatibility shim for new release, can go v soon
    if @get('type') == 'javascript' then @set type: 'code'

  toggleType: =>
    # TODO: check if evaluating here and interrupt?
    if @get('type') == 'code'
      @set type: 'markdown'
    else
      @set type: 'code'
    @set state: 'dirty'
    #@evaluate()

  toggleInputFold: =>
    @set inputFold: not @get('inputFold')

  evaluate: =>
    if not @engines?
      console.log 'WARNING: evaluation called with no engines'
      return 
    @set(output: null, error: null)
    @set state: 'evaluating'
    @engines[@get('type')].evaluate @get('input'), @

  interrupt: =>
    if not @engines?
      console.log 'WARNING: interrupt called with no engines'
      return 
    @addOutput('Interrupted', 'error')
    @engines[@get('type')].interrupt()
    @set state: null

  addOutput: (data, elName) =>
    current = @get('output') or ""
    if @get('type') == 'markdown'
      elName = 'markdown'
    
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
