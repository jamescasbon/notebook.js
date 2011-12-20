root = exports ? this


class Notebook extends Backbone.Model
    defaults: => (title: "untitled")

    initialize: =>
        @cells = new Cells()
        @cells.localStorage = new Store('Cells')


class Notebooks extends Backbone.Collection
    model: Notebook
    localStorage:  new Store('Notebooks') 


class Cell extends Backbone.Model
    tagName: 'li'
    defaults: => (input: "something", type: "javascript", output: null, position: null)
    
    toggleType: =>
        if @get('type') == 'javascript'
            @set type: 'markdown'
        else
            @set type: 'javascript'

    evaluate: =>
        # should we save the model at this point?
        # how to look up handler?
        handler = root.engines[@get('type')]
        handler.evaluate @get('input'), @evaluateSuccess

    evaluateSuccess: (output) => 
        @set(output: output)
        @save()


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

