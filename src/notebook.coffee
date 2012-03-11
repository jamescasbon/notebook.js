root = exports ? this


class Notebook extends Backbone.Model
  defaults: => (title: "untitled")

  initialize: =>
    @cells = new Cells()
    @cells.localStorage = new Store('Cells')


class Notebooks extends Backbone.Collection
  model: Notebook
  localStorage: new Store('Notebooks') 


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
    type: "javascript", 
    inputFold: false
    output: null, 
    position: null,
    error: null,
    state: null
  
  toggleType: =>
    if @get('type') == 'javascript'
      @set type: 'markdown'
    else
      @set type: 'javascript'
    @set state: 'dirty'
    #@evaluate()

  toggleInputFold: => 
    @set inputFold: not @get('inputFold')
    @save()
      
  evaluate: =>
    @set(output: null, error: null)
    @set state: 'evaluating'
    @save()
    # should we save the model at this point?
    # how to look up handler?
    @handler = root.engines[@get('type')]
    @handler.evaluate @get('input'), @

  interrupt: => 
    if @handler?

      @onPrint('Interrupted', 'error')
      @handler.interrupt()
      @set state: null
      @save()

  evaluateSuccess: (output) => 
    @set output: output, error: null
    @save()

  evaluateError: (error) => 
    @set error: error
    @save

  handleMessage: (data) => 
    switch data.msg
      when 'evalEnd' 
        @set(state: null)
        @save()
      when 'error' then @onPrint(data.data, 'error')
      when 'print' then @onPrint(data.data, 'print')
      when 'result' then @onPrint(data.data, 'print')
      when 'raw' then @onPrint(data.data, 'raw')

  onError: (error) -> 
    @set(error: error)

  onPrint: (data, elName) ->
    el = document.createElement('div')
    el.className = elName
    el.innerHTML = data 
    current = @get('output') or ""
    @set(output: current.concat(el.outerHTML))
    
    


class Cells extends Backbone.Collection
  model: Cell
  
  # sort by position and put large jumps in the position to allow insertion
  posJump: Math.pow(2, 16)
  comparator: (cell) => cell.get('position') 
  
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
    



root.Notebook = Notebook
root.Cell = Cell
root.Notebooks = Notebooks
root.Cells = Cells

