
class Notebook extends Backbone.Model
    defaults: => (title: "untitled")

    initialize: =>
        @cells = new Cells()
        @cells.localStorage = new Store('Cells')
        @setupCellStorage()

    setupCellStorage: =>
        console.log 'base cell storage hook'
        


class Notebooks extends Backbone.Collection
    model: Notebook
    localStorage:  new Store('Notebooks') 


class Cell extends Backbone.Model
    tagName: 'li'
    defaults: => (input: "something", type: "javascript", output: null)

    evaluate: =>
        # should we save the model at this point?
        # how to look up handler?
        handler = new JavascriptEval()
        handler.evaluate @get('input'), @evaluateSuccess

    evaluateSuccess: (output) => 
        @set(output: output)
        @save()


class Cells extends Backbone.Collection
    model: Cell

class JavascriptEval
    evaluate: (input, onSuccess) -> 
        output = eval(input)
        console.log 'eval produced', input,  output
        onSuccess output


root = exports ? this
root.Notebook = Notebook
root.Cell = Cell
root.Notebooks = Notebooks
root.Cells = Cells
root.JavascriptEval = JavascriptEval

