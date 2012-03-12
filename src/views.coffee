# use [[]] for underscore templates (i.e. client side templating)
_.templateSettings = {interpolate : /\[\[=(.+?)\]\]/g, evaluate: /\[\[(.+?)\]\]/g}

root = exports ? this
 
NAVBAR_HEIGHT = 30

isScrolledIntoView = (elem) -> 
  docViewTop = $(window).scrollTop() + (2 * NAVBAR_HEIGHT)
  docViewBottom = docViewTop + $(window).height() - (2 * NAVBAR_HEIGHT)

  elemTop = elem.offset().top
  elemBottom = elemTop + elem.height()

  return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop))



class ViewNotebookView extends Backbone.View
  className: "app"

  initialize: =>
    console.log 'init vnv'
    @template = _.template($('#notebook-template').html())
    @cellTemplate = _.template($('#cell-view-template').html())
    $('.container').append(@render()) 

    @cells = @$('.cells')
    console.log @cells
    @model.cells.fetch(success: @addAll)

  render: =>
    console.log 'render vnv'
    $(@el).html(@template())
    @el

  addOne: (cell) =>
    console.log 'addone'
    newEl = @renderCell(cell)
    @cells.append(newEl)
    

  addAll: (cells) =>
    cells.each @addOne

  renderCell: (cell) =>
    @cellTemplate(cell.toJSON())
   
  mathjaxReady: => 
    # perform initial typeset of output elements
    _.each(@$('.cell-output'), (el) -> MathJax.Hub.Typeset(el) )


# EditNotebookView is the main app view and manages a list of cells
class EditNotebookView extends Backbone.View
  className: "app" 

  events: => (
    # there is a lone spawner at the bottom of the page
    "dblclick #spawner": 'spawnCellAtEnd'
    "keyup #spawner": 'spawnKeypress'
  )

  # bind to dom and model events, fetch cells
  initialize: =>
    @template = _.template($('#notebook-template').html())
    $('.container').append(@render()) 

    @cells = @$('.cells')
    @model.cells.bind 'add', @addOne
    @model.cells.bind 'refresh', @addAll
    @model.cells.fetch(success: @addAll)

  # render by setting up title and meta elements
  render: =>
    $(@el).html(@template())
    @el
    
  # add a cell by finding the correct order from the collection and inserting
  addOne: (cell) =>
    root.c = cell
    view = new CellEditView(model: cell)
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
      console.log(ncells)
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
class CellEditView extends Backbone.View
  tagName: 'li'

  events: => (
    "keyup .spawn-above": 'handleKeypress',
    "dblclick .spawn-above" : "spawnAbove"

    "click .evaluate": "evaluate",
    "click .delete": "destroy",
    "click .toggle": 'toggle',
    "click .type": 'toggle',
    
    "click .fold-button":  'toggleInputFold',
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
    @template = _.template($('#cell-edit-template').html())
    @model.bind 'change:state', @changeState
    @model.bind 'change:type', @changeType
    @model.bind 'change:output', @changeOutput
    @model.bind 'change:inputFold', @changeInputFold
    @model.bind 'destroy', @remove
    @model.bind 'all', @logev
    @model.view = @
    @editor = null

  logev: (ev) =>
    console.log('in ev', ev)

  render: (ev) =>
    console.log 'model', @model.cid, @model.id, @model.toJSON()
    if not @editor? # if the editor exists we do not want to clobber it
      
      dat = @model.toJSON()

      if not @model.id? # happens when not yet saved
        dat.id = @model.cid

      $(@el).html(@template(dat))

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
    console.log 'updatting output to', @model.get('output')
    @output.html(@model.get('output'))
    MathJax.Hub.Typeset(@output[0])
    

  # handle state changes 
  changeState: => 
   
    console.log('view changing state to', @model.get('state'))
    
    switch @model.get('state')
      when 'evaluating'
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
    console.log 'binding', @model.id
    console.log(@model.id)
    if @model.id?
      ace_id = @model.id
    else
      ace_id = @model.cid
    @editor = ace.edit('input-' + ace_id)
    
    @editor.resize()
    # set the content now, not in the template because HTML is lost in the template
    @editor.getSession().setValue(@model.get('input'))
    @model.set state: null 

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
    @resizeEditor()


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

    @editor.commands.addCommand
      name: 'interrupt', 
      bindKey: { win: 'Ctrl-C', mac: 'Ctrl-C', sender: 'editor' },
      exec: (env, args, request) => @interrupt()
    
      # if we line up on the first line, we need to focus up 
    @editor.commands.addCommand
      name: "golineup",
      bindKey: {win: "Up", mac: "Up|Ctrl-P", sender: 'editor'},
      exec: (ed, args) => 
        cursor = @$('.ace_cursor')
        console.log 'lineup,inview?', isScrolledIntoView(cursor)
        if not isScrolledIntoView(cursor)
          # FIXME: make this code explici3t
          $('body').scrollTop(cursor.offset().top - 4 * NAVBAR_HEIGHT)

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
        cursor = @$('.ace_cursor')
        if not isScrolledIntoView(cursor)
          # FIXME: make this code explicit 
          $('body').scrollTop(cursor.offset().top - $(window).height() + 3 *  NAVBAR_HEIGHT)

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
    @$('.fold-button').toggleClass('input-fold')
    @$('hr').toggleClass('input-fold')
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
    @model.set(input: @editor.getSession().getValue()) 
    @model.evaluate()

  destroy: =>
    @model.destroy()

  interrupt: => 
    @model.interrupt()

  remove: => 
    $(@el).fadeOut('fast', $(@el).remove)

  spawnAbove: =>
    @model.collection.createBefore @model

  toggle: =>
    @model.toggleType()

  inputChange: =>
    @model.set(state: 'dirty')
    @resizeEditor()

  resizeEditor: => 
    # resize the editor container
    # TODO: implement real renderer for ace
    line_height = @editor.renderer.$textLayer.getLineHeight()
    lines = @editor.getSession().getDocument().getLength()
    # Add 20 here to allow scroll while wrap is broken
    @$('.ace-container').height(20 + (18 * lines))
    @editor.resize()
    # TODO get real line height


class IndexView extends Backbone.View
  className: 'app'

  events: 
    'click button': 'new'
  
  initialize: =>
    @template = _.template($('#index-template').html())
    $('.container').append(@render())
    @addNbs()

  render: =>
    $(@el).html(@template())
    @el

  addNb: (nb) =>
    $('#notebooks').append(@nbtemplate(nb.toJSON()))

  addNbs: => 
    console.log 'addNbs'
    @nbtemplate = _.template($('#notebook-index-template').html())
    root.notebooks.each(@addNb)

  new: => 
    root.router.navigate ('new/'), trigger: true


class NewView extends Backbone.View
  className: 'app'
  
  events: 
    'click button' : 'create'

  initialize: => 
    @template = _.template($('#new-notebook-form').html())
    $('.container').append(@render())

  render: =>
    $(@el).html(@template())
    @el

  create: => 
    console.log 'creating'
    nb = root.notebooks.create(title: @$('input').val())
    root.router.navigate (nb.id + '/edit/'), trigger: true


class NotebookRouter extends Backbone.Router
  routes: 
    ":nb/edit/" : "edit"
    ":nb/view/" : "view"
    ":nb/delete/" : "delete"
    "new/": "new"
    "": "index"

  getNotebook: (nb) => 
    console.log('finding notebook', nb)
    notebook = root.notebooks.get(nb)
    #if notebook? # just create one for the minute!
    #  notebook = root.notebooks.create()
    # TODO: could wait for a sync signal to have the id
    notebook.readyCells()
    root.nb = notebook
    console.log('notebook loaded; id=' +  notebook.get('id'))
    notebook.readyCells()
    notebook

  edit: (nb) => 
    if root.app
      root.app.remove()
    console.log 'activated edit route', nb
    notebook = @getNotebook(nb)
    root.app = new EditNotebookView(model: notebook)

  view: (nb) => 
    if root.app 
      root.app.remove()
    console.log 'activated view route'    
    notebook = @getNotebook(nb)
    root.app = new ViewNotebookView(model: notebook)

  delete: (nb) => 
    console.log 'deleting nb', nb
    notebook = @getNotebook(nb)
    notebook.cells.each( (x) -> x.destroy() )
    notebook.destroy()
    console.log('deleted')
    root.router.navigate('', trigger: true) 

  new: (nb) => 
    console.log 'new view'
    if root.app
      root.app.remove()
    root.app = new NewView()
  
  index: => 
    if root.app
      root.app.remove()
    console.log 'index view'
    root.app = new IndexView()


$(document).ready ->
  console.log 'creating app'
  root.notebooks = new Notebooks()
  root.notebooks.fetch()


  root.router = new NotebookRouter() 
  Backbone.history.start()
  MathJax.Hub.Register.StartupHook('End', root.app.mathjaxReady)
  

