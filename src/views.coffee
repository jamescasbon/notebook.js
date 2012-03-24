# use [[]] for underscore templates (i.e. client side templating)
_.templateSettings = {interpolate : /\[\[=(.+?)\]\]/g, evaluate: /\[\[(.+?)\]\]/g}


root = exports ? this
 

# scrolling functions to check el in view and scroll to it
NAVBAR_HEIGHT = 30

isScrolledIntoView = (elem) -> 
  docViewTop = $(window).scrollTop() + (2 * NAVBAR_HEIGHT)
  docViewBottom = $(window).scrollTop() + $(window).height() - (NAVBAR_HEIGHT)

  elemTop = elem.offset().top
  elemBottom = elemTop + elem.height()

  return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop))

scrollToAtTop = (elem) ->
  target = elem.offset().top - 3 * NAVBAR_HEIGHT
  console.log 'stat', target
  $(window).scrollTop(target)

scrollToAtBottom = (elem) -> 
  bottom = elem.offset().top + elem.height()
  scrollbottom = bottom + (2 * NAVBAR_HEIGHT)
  scrolltop = scrollbottom -  $(window).height()
  console.log 'stab', scrolltop
  $('body').scrollTop scrolltop



class BaseNotebookView extends Backbone.View
  className: "app"

  # events: TODO: base set of events 

  handleTocJump: (e) => 
    window.e = e
    target = $(e.target).attr('href')
    if target
      target = $('#' + target)
      scrollToAtTop(target)

  mathjaxReady: => 
    # perform initial typeset of output elements
    # need to check if still not initialized
    @typeset()

  saveToFile: => 
    saveFile(@model.serialize())

  share: => 
    enc = btoa(@model.serialize())
    url = escape('http://notebookjs.me/#import/' + enc + '/')
    tmpl = _.template($('#share-notebook').html())
    console.log 'template'
    console.log(url)
    window.open( "data:text/html;charset=utf-8," + tmpl(url: url))
   
  typeset: => 
    prettyPrint()
    for el in @$('#notebook')
      console.log 'tp', el
      MathJax.Hub.Typeset(el) 
    @$('#toc').html @generateToc()

  generateToc: => 
    # TODO: create template and view for this
    toc = $( document.createElement('div') )

    @$('.cell').each (i, cell) => 
      
      celldiv = $( document.createElement('div') ).appendTo(toc)
      celldiv.addClass('toc-cell')
      celldiv.attr('href', $(cell).attr('id'))
      
      $(cell).find('h1, h2, h3').each (j, heading) -> 
        linkid = "title" + i + '_' + j

        # set the target id
        $(heading).attr('id', linkid)
      
        # create element in TOC
        el = $( document.createElement('div') )
        el.addClass(heading.tagName)
        el.addClass('toc-entry')
        el.attr('href', linkid)
        el.html($(heading).html())
        toc.append(el)

    toc


class ViewNotebookView extends BaseNotebookView

  events: 
    'click #toc': 'handleTocJump'
    "click #toggle-edit" : "toggleEdit"
    "click #save-to-file": "saveToFile"
    "click #share-url": "share"

  toggleEdit: => 
    root.router.navigate(@model.get('id') + '/edit/', trigger: true)

  initialize: =>
    @template = _.template($('#notebook-template').html())
    @cellTemplate = _.template($('#cell-view-template').html())
    $('.container').append(@render()) 

    @cells = @$('.cells')
    console.log @cells
    @model.cells.fetch(success: @addAll)
    if root.mathjaxReady
      @typeset()

  render: =>
    $(@el).html(@template())
    @el

  addOne: (cell) =>
    newEl = @renderCell(cell)
    @cells.append(newEl)

  addAll: (cells) =>
    cells.each @addOne


  renderCell: (cell) =>
    data = cell.toJSON() 
    # we need to escape the input in view mode
    data.input = data.input.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    @cellTemplate(data)


# EditNotebookView is the main app view and manages a list of cells
class EditNotebookView extends BaseNotebookView

  events: => (
    # there is a lone spawner at the bottom of the page
    'click #toc': 'handleTocJump'
    "dblclick #spawner": 'spawnCellAtEnd'
    "keyup #spawner": 'spawnKeypress'
    "click #toggle-edit" : "toggleEdit" 
    "click #save-to-file": "saveToFile"
    "click #share-url": "share"
  )

  # bind to dom and model events, fetch cells
  initialize: =>
    @template = _.template($('#notebook-template').html())
    $('.container').append(@render()) 

    @cells = @$('.cells')
    @model.cells.bind 'add', @addOne
    @model.cells.bind 'refresh', @addAll
    @model.cells.fetch(success: @addAll)
    if root.mathjaxReady
      console.log 'calling typeset at init'
      @typeset()

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
      @model.cells.at(ncells - 1).view.output.focus()

  toggleEdit: => 
    root.router.navigate(@model.get('id') + '/view/', trigger: true)

  saveToFile: => 
    saveFile(@model.serialize())


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
class CellEditView extends Backbone.View
  tagName: 'li'

  events: => (
    "keyup .spawn-above": 'handleKeypress',
    "dblclick .spawn-above" : "spawnAbove",

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
    @model.view = @
    @editor = null

  logev: (ev) =>
    console.log('in ev', ev)

  render: (ev) =>
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
    #console.log 'updatting output to', @model.get('output')
    @output.html(@model.get('output'))
    if root.mathjaxReady
      MathJax.Hub.Typeset(@output[0])
    

  # handle state changes 
  changeState: => 
    #console.log('view changing state to', @model.get('state'))
    switch @model.get('state')
      when 'evaluating'
        @output.html('...')
        @intButton.addClass('active')
        @evalButton.removeClass('active')

      when 'dirty'
        @evalButton.addClass('active')

      when null
        @intButton.removeClass('active')

  # Ace initialization and configuration happens after DOM insertion
  afterDomInsert: =>
    # create the editor 
    if @model.id?
      ace_id = @model.id
    else
      ace_id = @model.cid
    @editor = ace.edit('input-' + ace_id)
    

    # set the content now, not in the template because HTML is lost in the template

    @model.set state: null 

    @editor.getSession().setUseWrapMode true
    @editor.renderer.setShowGutter false
    @editor.renderer.setHScrollBarAlwaysVisible false
    @editor.renderer.setShowPrintMargin false
    @editor.setHighlightActiveLine false
    
    # TODO: size of line highlight not correct
    @$('.ace_sb').css({display: 'none'})

    @resizeEditor()
 

    
    @editor.getSession().on('change', @inputChange)
    @setEditorHighlightMode()
    
    # chrome screws up on input sizes < 3
    input = @model.get('input') 
    crs_to_add = Math.max( 3 - _.string.count(input, '\n') , 0)
    console.log 'crs'
    for i in _.range(crs_to_add)
      input = input + '\n'
    
    @editor.getSession().setValue(input)

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
        if not isScrolledIntoView(cursor)
          #console.log('scrollup')
          scrollToAtTop(cursor) 

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
          scrollToAtBottom(cursor)

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
    #console.log 'kp', e.keyCode, target

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
      #console.log('focus nb spawn')
      $('#spawner').focus()

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
    lines = @editor.getSession().getScreenLength()
    
    # we can get called before the renderer has layed out, in which case 
    # recall later
    if line_height == 1
      setTimeout(@resizeEditor, 200)
      #console.log 'defer resize'
      return 

    # Add 20 here to allow scroll while wrap is broken
    #console.log 'height of editor is', line_height, lines
    @$('.ace-container').height(20 + (line_height * lines))
    @editor.resize()
    # TODO get real line height


class IndexView extends Backbone.View
  className: 'app'

  events: 
    'click #new-notebook-button': 'new'
    'change #load-file' : 'loadFile'

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
    @nbtemplate = _.template($('#notebook-index-template').html())
    root.notebooks.each(@addNb)

  new: => 
    console.log 'new'
    root.router.navigate ('new/'), trigger: true

  loadFile: (ev) => 
    file = ev.target.files[0]
    #console.log 'loading notebook', file.name
    reader = new FileReader()
    reader.onload = (e) => 
      nbdata = JSON.parse(e.target.result)
      notebook = loadNotebook(nbdata)
      root.router.navigate(notebook.get('id') + '/view/', trigger: true)
      
    reader.readAsText(file) 
    # TODO: set loading status

  mathjaxReady: => 
    return


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
    #console.log 'creating'
    nb = root.notebooks.create((title: @$('input').val()), (wait: true))
    nb.readyCells()
    nb.cells.create(position: nb.cells.posJump)
    root.router.navigate (nb.id + '/edit/'), trigger: true

  mathjaxReady: => 
    return



class NotebookRouter extends Backbone.Router
  routes: 
    ":nb/edit/" : "edit"
    ":nb/view/" : "view"
    ":nb/delete/" : "delete"
    'load/*url': 'loadUrl'
    "new/": "new"
    "import/*data/": 'import'
    "": "index"


  unmatched: (p) => console.log p

  getNotebook: (nb) => 
    notebook = root.notebooks.get(nb)
    #if notebook? # just create one for the minute!
    #  notebook = root.notebooks.create()
    # TODO: could wait for a sync signal to have the id
    notebook.readyCells()
    root.nb = notebook
    console.log('notebook loaded; id=' +  notebook.get('id'))
    notebook

  edit: (nb) => 
    if root.app
      root.app.remove()
    console.log 'activated edit route', nb
    notebook = @getNotebook(nb)
    root.app = new EditNotebookView(model: notebook)
    setTitle(notebook.get('title') + ' (Editing)')

  view: (nb) => 
    if root.app 
      root.app.remove()
    console.log 'activated view route'    
    notebook = @getNotebook(nb)
    setTitle(notebook.get('title') + ' (Viewing)')

    root.app = new ViewNotebookView(model: notebook)


  delete: (nb) => 
    console.log 'deleting nb', nb
    confirmed = confirm('You really want to delete that?')
    if confirmed
      notebook = @getNotebook(nb)
      
      notebook.cells.fetch success: (cells) -> 
        cells.each (cell) -> 
          console.log 'destroy', cell
          cell.destroy()

      console.log 'cells', notebook.cells.length
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
      root.nb = null
    console.log 'index view'
    setTitle('')
    root.app = new IndexView()

  loadUrl: (url) => 
    console.log 'loading url'
    $.getJSON url, (data) => 
      notebook = loadNotebook(data)
      root.router.navigate(notebook.get('id') + '/view/', trigger: true)

  import: (data) => 
    data = JSON.parse(atob(data))
    notebook = loadNotebook(data)
    root.router.navigate(notebook.get('id') + '/view/', trigger: true)


  

# crazy global methods? Go in the router?
setTitle = (title) =>
  $('#title').html(title)


saveFile = (data) => 
  window.open( "data:text/json;filename=data.json;charset=utf-8," + escape(data))


loadNotebook = (nbdata) => 
  celldata = nbdata.cells
  delete nbdata.cells

  nbdata.title = nbdata.title 
  try

    if root.notebooks.get(nbdata.id)
      raise 'duplicate'
    console.log 'no such nb', nbdata.id

    console.log 'import notebook' 
    notebook = root.notebooks.create(nbdata) 
    notebook.readyCells()
    for c in celldata
      do (c) -> notebook.cells.create(c)

    return notebook
  catch error
    alert 'Could not import notebook probably because it already exists.  try deleting'
    console.log error


mathjaxReady = () ->
  root.mathjaxReady = true
  root.app.mathjaxReady()


$(document).ready ->
  console.log 'creating app'
  root.notebooks = new Notebooks()
  root.notebooks.fetch()
  root.mathjaxReady = false

  root.router = new NotebookRouter() 
  Backbone.history.start()
  MathJax.Hub.Register.StartupHook('End', mathjaxReady)
  

