# use [[]] for underscore templates (i.e. client side templating)
_.templateSettings = {interpolate : /\[\[=(.+?)\]\]/g, evaluate: /\[\[(.+?)\]\]/g}

root = exports ? this
  

# NotebookView is the main app view and manages a list of cells
class NotebookView extends Backbone.View
  el: "#notebook"
 
  events: => (
    # there is a lone spawner at the bottom of the page
    "click #spawner": 'spawnCellAtEnd'
  )

  # bind to dom and model events, fetch cells
  initialize: =>
    @title = @$('#title')
    @cells = @$('#cells')
    @render()
    
    @model.cells.bind 'add', @addOne
    @model.cells.bind 'refresh', @addAll
    @model.cells.fetch(success: @addAll)

  # render by setting up title and meta elements
  render: =>
    console.log 'rendering notebook' + @model.get('title')
    @title.html(@model.get("title"))
    
  # add a cell by finding the correct order from the collection and inserting
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
   
    # provide a hook for the view after insertion of the el into the DOM
    view.afterDomInsert()

  addAll: (cells) =>
    cells.each @addOne
   
  spawnCellAtEnd: => 
    @model.cells.createAtEnd()

  mathjaxReady: => 
    # perform initial typeset of output elements
    _.each(@$('.cell-output'), (el) -> MathJax.Hub.Typeset(el) )

# Cell view does the management of Ace and the focus model
class CellView extends Backbone.View
  tagName: 'li'

  events: => (
    # TODO: change this click to a keypress
    #"click .spawn-above": 'spawnAbove',
    "click .evaluate": "evaluate",
    "click .delete": "destroy",
    "click .toggle": 'toggle',
    "click .type": 'toggle',
    "click .cell-output":  'switchIoViews',
    "evaluate": "evaluate",
    "toggle": "toggle",
    "keydown .cell-output": 'handleKeypress',
    "keydown .spawn-above": 'handleKeypress',
    "focus .cell-input" : "focusInput"
    "blur .cell-input" : "blurInput"
  )
 
  # get template and bind to events
  initialize: => 
    @template = _.template($('#cell-template').html())
    @model.bind 'change', @render
    @model.bind 'destroy', @remove
    @model.view = @
    @editor = null
    @model.bind 'all', @logev

  logev: (ev) =>
    console.log('in ev', ev)

  # we render the element or update if it exists
  render: =>
    if not @editor?
      # initialize
      $(@el).html(@template(@model.toJSON()))
      @spawn = @$('.spawn-above')
      @input = @$('.cell-input')
      @output = @$('.cell-output')
      @inputContainer = @$('.ace-container')
      @type = @$('.type')
    else
      # update
      @type.html @model.get('type')
      if not @model.get('error')?
        @output.html @model.get('output')
      else 
        console.log 'error', @model.get('error')
        @output.html @model.get('error')
      @setEditorHighlightMode()
      
      # TODO: the update method could be more efficient by only updating the output 
      # if it has changed
      MathJax.Hub.Typeset(@output[0])


    @el
  
  # Ace initialization and configuration happens after DOM insertion
  afterDomInsert: =>
    
    @editor = ace.edit('input-' + @model.id)
    
    @editor.resize()
    @editor.getSession().setUseWrapMode true
    @editor.renderer.setShowGutter false
    @editor.renderer.setHScrollBarAlwaysVisible false
    @editor.renderer.setShowPrintMargin false
    @editor.setHighlightActiveLine false
    
    # TODO: size of line highlight not correct
    @$('.ace_sb').css({display: 'none'})
    
    @editor.getSession().on('change', this.inputChange)
    @setEditorHighlightMode()
    # there is a race condition here looking up the line height
    @inputChange()
    
    @switchIoViews()
    
    @editor.commands.addCommand
      name: 'evaluate', 
      bindKey: { win: 'Ctrl-E', mac: 'Command-E', sender: 'editor' },
      exec: (env, args, request) => @evaluate()
    
    @editor.commands.addCommand
      name: 'toggleMode', 
      bindKey: { win: 'Ctrl-M', mac: 'Command-M', sender: 'editor' },
      exec: (env, args, request) => @toggle()
  
    # if we line up on the first line, we need to focus up 
    @editor.commands.addCommand
      name: "golineup",
      bindKey: {win: "Up", mac: "Up|Ctrl-P", sender: 'editor'},
      exec: (ed, args) => 
        row = ed.getSession().getSelection().getCursor().row
        if row == 0
          @spawn.focus()
        else
          ed.navigateUp(args.times) 

    # if we line down on the last line, we need to focus down 
    @editor.commands.addCommand
      name: "golinedown",
      bindKey: {win: "Down", mac: "Down", sender: 'editor'},
      exec: (ed, args) => 
        row = ed.getSession().getSelection().getCursor().row
        last = @editor.getSession().getDocument().getLength() - 1

        if row == last
          @output.focus()
        else
          ed.navigateDown(args.times) 



  # intercept keypresses to enable focus model on output and spawner
  handleKeypress: (e) => 
    # 38 up 40 down
    target = e.target.className
    console.log 'kp' 
    if e.keyCode == 38
      # event up
      switch target 
        when 'cell-output' then @focusInput('bottom')
        when 'spawn-above' then @focusCellAbove()

    else if e.keyCode == 40
      # event = 'down'
      switch target 
        when 'cell-output' then @focusCellBelow()
        when 'spawn-above' then @focusInput('top')

  # TODO: method is unclear, called both when focused and to focus
  focusInput: (where) =>
    
    # focus the input from a somewhere, and recall the focus
    console.log 'focusInput', where
    if where == 'top'
      @editor.gotoLine 1
      @editor.focus()

    else if where == 'bottom'
      @editor.gotoLine @editor.getSession().getDocument().getLength()
      @editor.focus()
    
    # on focus set the highlight
    if @editor?
      @editor.setHighlightActiveLine(true)
 
  # remove editor decoration
  blurInput: =>
    if @editor? 
      @editor.setHighlightActiveLine(false)
      # TODO: hide cursor
    @evaluate()
  

  focusCellAbove: => 
    index = @model.collection.indexOf(@model)
    next = @model.collection.at(index-1)
    if next?
      next.view.output.focus()

  focusCellBelow: => 
    index = @model.collection.indexOf(@model)
    next = @model.collection.at(index+1)
    if next?
     next.view.spawn.focus()

  focus: => console.log('focus')

  setEditorHighlightMode: => 
    # TODO: text mode not found, better lookup of modes
    # TODO: ace markdown support
    if @model.get('type') == 'javascript'
      mode = require("ace/mode/javascript").Mode
    else if @model.get('type') == 'markdown'
      mode = require("ace/mode/markdown").Mode
    if mode?
      @editor.getSession().setMode(new mode())

  evaluate: =>
    console.log 'in cellview evaluate handler'
    @model.set(input: @editor.getSession().getValue()) 
    @model.evaluate()
    @switchIoViews()

  destroy: =>
    @model.destroy()

  remove: => 
    $(@el).fadeOut('fast', $(@el).remove)

  spawnAbove: =>
    @model.collection.createBefore @model
  
  toggle: =>
    @model.toggleType()
   
    # hide the view if necessary
    # TODO: move to switchIoViews
    if @model.get('type') == 'markdown'
      # tODO: check focus to see which to hide
      @inputContainer.show()
      @output.hide()
      @editor.resize()
    else
      @inputContainer.show()
      @output.show()
      @editor.resize()
      
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
  

  # manage hiding ace editor for text cells
  # TODO: logic is wrong here, when press evaluate button
  switchIoViews: => 
    return 0
    if @model.get('type') == 'markdown'
  
      if @$('.ace-container').is(":hidden")
        @inputContainer.show()
        @output.hide()
        @editor.resize()
        # TODO: guess the target of the click ?
        @editor.focus()
      else
        @output.show()
        @inputContainer.hide()


$(document).ready ->
  console.log 'creating app'
  notebooks = new Notebooks()
  notebook = notebooks.create()
  root.app = new NotebookView(model: notebook)
  MathJax.Hub.Register.StartupHook('End', root.app.mathjaxReady)

  root.n = notebook
