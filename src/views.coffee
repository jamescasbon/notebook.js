# use [[]] for underscore templates (i.e. client side templating)
_.templateSettings = {interpolate : /\[\[=(.+?)\]\]/g, evaluate: /\[\[(.+?)\]\]/g}

root = exports ? this

   

class NotebookView extends Backbone.View
    el: "#notebook"
  
    events: => ( 
        "click #spawner": 'spawnCell'
    )

    initialize: =>
        @title = @$('#title')
        @cells = @$('#cells')
        @render()
        
        @model.cells.bind 'add', @addOne
        @model.cells.bind 'refresh', @addAll
        
        @model.cells.fetch(success: @addAll)

    render: =>
        console.log 'rendering notebook' + @model.get('title')
        @title.html(@model.get("title"))
        
    addOne: (cell) =>
        console.log('adding cell', cell)
        view = new CellView(model: cell)
        newEl = view.render()
        $(newEl).appendTo(@cells)

    addAll: (cells) =>
        console.log(cells)
        cells.each @addOne

    spawnCell: => 
        console.log 'spawning cell'
        @model.cells.create()



    


class CellView extends Backbone.View

    events: => (
        "click .evaluate":  "evaluate",
        "click .delete": "destroy"
    )

    initialize: => 
        @template =  _.template($('#cell-template').html())
        @model.bind 'all', @render
        @model.bind 'destroy', @remove

    render: =>
        console.log('render cell', @model.toJSON())
        $(@el).html(@template(@model.toJSON()))
        @input = @$('.cell-input') 
        @el

    evaluate: =>
        console.log 'in cellview evaluate handler'
        @model.set(input: @input.val()) 
        @model.evaluate()

    destroy: =>
        console.log 'in cellview destroy handler'
        @model.destroy()

    remove: => 
        $(@el).fadeOut('fast', $(@el).remove)



$(document).ready ->
    console.log 'creating app'
    notebooks = new Notebooks()
    notebook = notebooks.create()
    app = new NotebookView(model: notebook)
    window.ev = new JavascriptEval()

    window.n = notebook
    window.C = Cell
    window.N = Notebook
