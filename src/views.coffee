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
        
        index = @model.cells.indexOf(cell)
        if index == 0
            @cells.prepend(newEl)
        else 
            previous = @model.cells.at(index - 1)
            previousView = previous.view
            $(previousView.el).after(newEl)

        view.afterDomInsert()

    addAll: (cells) =>
        console.log(cells)
        cells.each @addOne

    spawnCell: => 
        console.log 'spawning cell'
        @model.cells.createAtEnd()



class CellView extends Backbone.View
    tagName: 'li'

    events: => (
        "click .spawn-above": 'spawnAbove',
        "click .evaluate":  "evaluate",
        "click .delete": "destroy"
        "click .toggle": 'toggle'
    )

    initialize: => 
        @template =  _.template($('#cell-template').html())
        @model.bind 'all', @render
        @model.bind 'destroy', @remove
        @model.view = @
        @editor = null

    render: =>
        if not @editor?
            console.log 'render cell', @model.toJSON()
            $(@el).html(@template(@model.toJSON()))
            @input = @$('.cell-input') 
            @output = @$('.cell-output')
            @type = @$('.type')
        else
            console.log 'rerender'
            @type.html @model.get('type')
            if not @model.get('error')?
                @output.html @model.get('output') 
            else 
                console.log 'error', @model.get('error')
                @output.html @model.get('error')
        @el
    
    afterDomInsert: =>
        @editor = ace.edit('input-' + @model.id)
        @editor.resize()
        @editor.getSession().setUseWrapMode(true)
        @editor.renderer.setShowGutter(false)
        @editor.renderer.setHScrollBarAlwaysVisible(false)
        @editor.renderer.setShowPrintMargin(false)
        @editor.setHighlightActiveLine(false)
        
        # TODO: hide scrollbar when sizing elements correctly 
        #this.$('.ace_sb').css({overflow: 'hidden'});
        
        #@editor.getSession().on('change', this.inputChange);
        #// trigger initial sizing of element.  TODO: correctly size when creating template
        #this.inputChange();
        
        #@setEditorHighlightMode()
    
    setEditorHighlightMode: => 
        if @model.get('type') == 'javascript'
            mode = require("ace/mode/javascript").Mode
        else if @model.get('mode') == 'markdown'
            mode = require("ace/mode/text").Mode
        @editor.getSession().setMode(new mode())

    evaluate: =>
        console.log 'in cellview evaluate handler'
        @model.set(input: @editor.getSession().getValue()) 
        @model.evaluate()

    destroy: =>
        console.log 'in cellview destroy handler'
        @model.destroy()

    remove: => 
        $(@el).fadeOut('fast', $(@el).remove)

    spawnAbove: =>
        @model.collection.createBefore @model
    
    toggle: => 
        @model.toggleType()


$(document).ready ->
    console.log 'creating app'
    notebooks = new Notebooks()
    notebook = notebooks.create()
    root.app = new NotebookView(model: notebook)

    root.n = notebook
