# use [[]] for underscore templates (i.e. client side templating)
_.templateSettings = {interpolate : /\[\[=(.+?)\]\]/g, evaluate: /\[\[(.+?)\]\]/g}


class Notebook extends Backbone.Model
    defaults: => (title: "untitled")
    
    initialize: =>
        @cells = new Cells()
        @cells.localStorage = new Store('Cells')


class Notebooks extends Backbone.Collection
    localStorage: new Store("Notebooks") 
    model: Notebook


class NotebookView extends Backbone.View
    el: "#notebook"
   
    initialize: =>
        @title = @$('#title')
        @cells = @$('#cells')
        @render()
        
        @model.cells.bind 'add', @addOne
        @model.cells.bind 'refresh', @addAll
        
        @model.cells.fetch(success: @addAll)

    render: =>
        console.log 'rendering' + @model.get('title')
        @title.html(@model.get("title"))
        
    addOne: (cell) =>
        console.log('adding cell', cell)
        view = new CellView(model: cell)
        newEl = view.render()
        console.log('cell view', newEl, @cells)
        $(newEl).appendTo(@cells)

    addAll: (cells) => 
        cells.each @addOne

class Cell extends Backbone.Model
    tagName: 'li'
    defaults: => (input: "something")


class CellView extends Backbone.View
    initialize: => 
        @template =  _.template($('#cell-template').html())

    render: =>
        console.log('render cell', @model.toJSON())
        $(@el).html(@template(@model.toJSON()))
        @input = @$('.todo-input') 
        @el


class Cells extends Backbone.Collection
    model: Cell


$(document).ready ->
    console.log 'creating app'
    notebooks = new Notebooks()
    notebook = notebooks.create()
    app = new NotebookView(model: notebook)


    window.n = notebook
    window.C = Cell
    window.N = Notebook
