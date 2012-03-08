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
        "click .delete": "destroy",
        "click .toggle": 'toggle',
        "click .cell-output":   'switchIoViews',
        "evaluate": "evaluate",
        "toggle": "toggle"
    )

    initialize: => 
        @template =  _.template($('#cell-template').html())
        @model.bind 'change', @render
        @model.bind 'destroy', @remove
        @model.view = @
        @editor = null
        @model.bind 'all', @logev

    logev: (ev) =>
        console.log('in ev', ev)

    render: =>
        if not @editor?
            # initialize
            console.log 'render cell', @model.toJSON()
            $(@el).html(@template(@model.toJSON()))
            @input = @$('.cell-input') 
            @output = @$('.cell-output')
            @inputContainer = @$('.ace-container')
            @type = @$('.type')
        else
            # update
            console.log 'rerender'
            @type.html @model.get('type')
            if not @model.get('error')?
                @output.html @model.get('output') 
            else 
                console.log 'error', @model.get('error')
                @output.html @model.get('error')
            @setEditorHighlightMode()
        @el
    
    afterDomInsert: =>
        @editor = ace.edit('input-' + @model.id)
        
        @editor.resize()
        # wrap doesnt work - upgrade ace?
        @editor.getSession().setUseWrapMode false
        @editor.renderer.setShowGutter false
        @editor.renderer.setHScrollBarAlwaysVisible false
        @editor.renderer.setShowPrintMargin false
        @editor.setHighlightActiveLine true
        
        # TODO: size of line highlight not correct
        @$('.ace_sb').css({display: 'none'})
        
        @editor.getSession().on('change', this.inputChange)
        @setEditorHighlightMode()
        # there is a race condition here looking up the line height
        @inputChange()
        
        console.log('scroller', @$('.ace_scroller'))

        #$(window).scroll @scroll
        # hide markdown editors 
        if @model.get('type') == 'markdown'
            @switchIoViews()
        
        @editor.commands.addCommand
            name: 'evaluate', 
            bindKey: { win: 'Ctrl-E', mac: 'Command-E', sender: 'editor' },
            exec: (env, args, request) =>
                console.log 'canon eval handler', 
                @evaluate()
        
        @editor.commands.addCommand
            name: 'toggleMode', 
            bindKey: { win: 'Ctrl-M', mac: 'Command-M', sender: 'editor' },
            exec: (env, args, request) =>
                console.log 'canon eval handler'
                @toggle()



    scroll: => 
        console.log 'scroll'
        return false

    setEditorHighlightMode: => 
        # TODO: text mode not found, better lookup of modes
        # TODO: ace markdown support
        if @model.get('type') == 'javascript'
            mode = require("ace/mode/javascript").Mode
        else if @model.get('mode') == 'markdown'
            mode = require("ace/mode/markdown").Mode
        if mode?
            @editor.getSession().setMode(new mode())

    evaluate: =>
        console.log 'in cellview evaluate handler'
        @model.set(input: @editor.getSession().getValue()) 
        @model.evaluate()
        @switchIoViews()

    destroy: =>
        console.log 'in cellview destroy handler'
        @model.destroy()

    remove: => 
        $(@el).fadeOut('fast', $(@el).remove)

    spawnAbove: =>
        @model.collection.createBefore @model
    
    toggle: =>
        if @model.get('type') == 'markdown'
            @inputContainer.show()
            @output.show()
            @editor.resize()
        @model.toggleType()
    
    inputChange: => 
        # resize the editor container
        # TODO: implement real renderer for ace
        line_height = @editor.renderer.$textLayer.getLineHeight()
        lines = @editor.getSession().getDocument().getLength()
        # Add 20 here to allow scroll while wrap is broken
        @$('.ace-container').height(20 + (18 * lines))
        @editor.resize()
        # TODO get real line height 
        console.log('resized editor on', 18, lines)
    
    switchIoViews: => 
        if @model.get('type') == 'markdown'
    
            if @$('.ace-container').is(":hidden")
                @inputContainer.show()
                @output.hide()
                @editor.resize()
            else
                @output.show()
                @inputContainer.hide()





$(document).ready ->
    console.log 'creating app'
    notebooks = new Notebooks()
    notebook = notebooks.create()
    root.app = new NotebookView(model: notebook)

    root.n = notebook
