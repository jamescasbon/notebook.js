
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
        @title = $('#title')
        @render()

    render: =>
        console.log 'rendering' + @model.get('title')
        @title.html(@model.get("title"))

class Cell extends Backbone.Model
    defaults: => (input: "something")


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
