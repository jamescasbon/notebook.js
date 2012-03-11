# use [[]] for underscore templates (i.e. client side templating)
_.templateSettings = {interpolate : /\[\[=(.+?)\]\]/g, evaluate: /\[\[(.+?)\]\]/g}

root = exports ? this
  

# NotebookView is the main app view and manages a list of cells
class NotebookView extends Backbone.View
  el: "#notebook"
 
  events: => (
    # there is a lone spawner at the bottom of the page
    "dblclick #spawner": 'spawnCellAtEnd'
    "keyup #spawner": 'spawnKeypress'
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
    view.focusInput()

  addAll: (cells) =>
    cells.each @addOne
   
  spawnCellAtEnd: => 
    @model.cells.createAtEnd()

  spawnKeypress: (e) => 
    if e.keyCode == 13
      @model.cells.createAtEnd()
    else if e.keyCode == 38
      ncells = @model.cells.length
      @model.cells.at(ncells - 1).view.output.focus()

  mathjaxReady: => 
    # perform initial typeset of output elements
    _.each(@$('.cell-output'), (el) -> MathJax.Hub.Typeset(el) )

# CellView manages the Dom elements associated with a cell 
#
# A cell view has several dom elements (see the template in index.coffee): 
#  * the cell spawner (allows a cell to be inserted)
#  * the cell input (is replaced by ace ajax input 
#  * the cell output 
#
# There are currently three phases to the rendering: 
# * render: called by containing view 
# * afterDomInsert: called after containing view has placed the element 
# * MathJax: called when it is ready
#
# The Ace editor needs at least some configuration after placement.  It certainly 
# needs a resize call to make it respect the container size.  We manually update 
# the ace-container element's size to prevent scrolling in Ace.  This could all 
# go away if the virtual renderer was replaced.
#
# The output needs post processing by MathJax, which can only happen once it is ready.
# Therefore we hook into the ready call and update all the elements then.  
# When a cell's output changes it needs to be called again.
#
# We take some effort to respond to specific changes in model state rather than 
# repainting the entire view.
# 
# Effects should happen by assigning classes and using CSS3 transitions
#
# TODO: escape text for Ace
# TODO: how to respond to print statements 
#
class CellView extends Backbone.View
  tagName: 'li'

  events: => (
    "keyup .spawn-above": 'handleKeypress',
    "dblclick .spawn-above" : "spawnAbove"

    "click .evaluate": "evaluate",
    "click .delete": "destroy",
    "click .toggle": 'toggle',
    "click .type": 'toggle',
    
    "click .cell-output":  'switchIoViews',
    "click .marker-input":  'toggleInputFold',
    "dblclick .cell-output":  'toggleInputFold',

    "evaluate": "evaluate",
    "toggle": "toggle",
    "click .interrupt": "interrupt",
    "keyup .cell-output": 'handleKeypress',
    "focus .cell-input" : "focusInput",
    "blur .cell-input" : "blurInput"
  )
 
  # get template and bind to events
  initialize: => 
    @template = _.template($('#cell-template').html())
    @model.bind 'change:state', @changeState
    @model.bind 'change:type', @changeType
    @model.bind 'change:output', @changeOutput
    @model.bind 'change:inputFold', @changeInputFold
    @model.bind 'destroy', @remove
    @model.view = @
    @editor = null
    @model.bind 'all', @logev

  logev: (ev) =>
    console.log('in ev', ev)

  render: (ev) =>
    if not @editor? # if the editor exists we do not want to clobber it
      $(@el).html(@template(@model.toJSON()))
      @spawn = @$('.spawn-above')
      @input = @$('.cell-input')
      @output = @$('.cell-output')
      @inputContainer = @$('.ace-container')
      @type = @$('.type')
      @intButton = @$('.interrupt')
      @evalButton = @$('.evaluate')
    @el
  
  # update the view based on a cell type change
  changeType: => 
    @setEditorHighlightMode()
    @type.html @model.get('type')

  changeOutput: => 
    console.log 'changeOputput'
    @output.html(@model.get('output'))
    MathJax.Hub.Typeset(@output[0])

  # handle state changes 
  changeState: => 
   
    console.log('view changing state to', @model.get('state'))
    
    switch @model.get('state')
      when 'evaluating'
        console.log('add active to', @intButton)
        @output.html('...')
        @intButton.addClass('active')
        @evalButton.removeClass('active')

      when 'dirty'
        console.log 'vd'
        @evalButton.addClass('active')

      when null
        @intButton.removeClass('active')

  # Ace initialization and configuration happens after DOM insertion
  afterDomInsert: =>
    # create the editor 
    @editor = ace.edit('input-' + @model.id)
    
    @editor.resize()
    # set the content now, not in the template because HTML is lost in the template
    @editor.getSession().setValue(@model.get('input'))
    @model.set state: null 
    @editor.getSession().on('change', @editorChange)

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

    if @model.get('inputFold') 
      @changeInputFold()
    
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
          @rogueKeyup = true
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
          @rogueKeyup = true
        else
          ed.navigateDown(args.times) 

    # backspace on empty cell deletes cell
    @editor.commands.addCommand
      name: "backspace",
      bindKey: {win: "Backspace", mac: "Backspace", sender: 'editor'},
      exec: (ed, args) => 
        session = ed.getSession()
        if session.getLength() == 1 and session.getValue() == ""
          # TODO: just spaces as well??
          # TODO: focus 
          @destroy()
        else
          @editor.remove("left")

  editorChange: => 
    @model.set( state: 'dirty' )

  # intercept keypresses to enable focus model on output and spawner
  handleKeypress: (e) => 
    # if we move out of ace with a line up/line down, the keyup event is 
    # given to the newly focused object, so we ignore the first keyup event
    if @rogueKeyup == true
      @rogueKeyup = false
      return 

    inFold = @model.get('inputFold')

    # 38 up 40 down
    target = e.target.className
    console.log 'kp', e.keyCode, target
    if e.keyCode == 38            # UP ARROW
      switch target 
        when 'cell-output'
          if inFold
            @spawn.focus()
          else
            @focusInput('bottom')
        when 'spawn-above' then @focusCellAbove()

    else if e.keyCode == 40       # DOWN ARROW
      switch target 
        when 'cell-output' then @focusCellBelow()
        when 'spawn-above'
          if inFold
            @output.focus()
          else
            @focusInput('top')

    else if e.keyCode == 13       # ENTER
      switch target
        when 'spawn-above' then @spawnAbove()
        when 'cell-output' then @toggleInputFold()


  toggleInputFold: => 
    console.log 'tif'
    @model.toggleInputFold()

  changeInputFold: =>
    @inputContainer.toggleClass('input-fold')
    @$('.marker-input').toggleClass('input-fold')
    # TODO: need to check if input focus and then refocus

  # TODO: method is unclear, called both when focused and to focus
  focusInput: (where) =>
    
    # focus the input from a somewhere, and recall the focus
    if where == 'top'
      @editor.gotoLine 1
      @editor.focus()

    else if where == 'bottom'
      @editor.gotoLine @editor.getSession().getDocument().getLength()
      @editor.focus()
    
    # on focus set the highlight
    if @editor?
      @editor.setHighlightActiveLine(true)
      @$('.ace_cursor-layer').show()

 
  # remove editor decoration
  blurInput: =>
    if @editor? 
      @editor.setHighlightActiveLine(false)
      @$('.ace_cursor-layer').hide() # cannot use renderer.hideCursor as it leaves a mark
    
    # TODO: only revaluate if not pressing eval button
    #@evaluate()
  

  focusCellAbove: => 
    index = @model.collection.indexOf(@model)
    next = @model.collection.at(index-1)
    if next?
      next.view.output.focus()

  focusCellBelow: => 
    index = @model.collection.indexOf(@model)
    next = @model.collection.at(index+1)
    console.log 'fcb', next
    if next?
     next.view.spawn.focus()
    else
      console.log('focus nb spawn')
      $('#spawner').focus()
  focus: => console.log('focus')

  setEditorHighlightMode: => 
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

  interrupt: => 
    console.log 'int'
    @model.interrupt()

  remove: => 
    $(@el).fadeOut('fast', $(@el).remove)

  spawnAbove: =>
    console.log 'sa'
    @model.collection.createBefore @model
  
  toggle: =>
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
