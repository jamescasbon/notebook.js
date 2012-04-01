root = exports ? this
NotebookJS = root.NotebookJS = root.NotebookJS ? {}

# Abstract handler interface, engine callers must implement
class BaseHandler

  evalBegin: => 
    return 

  evalEnd: => 
    return 

  result: (data) => 
    return 

  print: (data) => 
    return 

  error: (data) => 
    return 

  handleMessage: => 
    return 

# Javascript engine, runs in main thread and therefore 
# has access to DOM and can block the UI
# not currently used
class Javascript
  evaluate: (input, handler) =>
    try
      handler.evalBegin()
      print = (d) ->
        handler.print(d.toString())
      result = eval(input)

      #console.log 'eval produced', input, output
      if result?
        handler.result(result.toString())

    catch error
      console.log(error.message, error.stack)
      handler.error(error.toString())
    finally
      handler.evalEnd()


# markdown evaluation using showdown
class Markdown
  evaluate: (input, handler) =>
    try
      handler.evalBegin()
      markdownConvertor = new Showdown.converter()
      html = markdownConvertor.makeHtml(input)
      handler.result(html)

    catch error
      console.log error.message
      handler.error(error.toString())
    finally
      handler.evalEnd()


# web worker evaluation
class JavascriptWorker
  constructor: ->
    @worker = new Worker('/src/worker.js')
    @worker.onmessage = @handleMessage
    @inputId = 0
    @handlers = {}

  evaluate: (input, handler) =>
    @inputId += 1
    @handlers[@inputId] = handler
    @worker.postMessage(src: input, id: @inputId)

  handleMessage: (ev) =>
    #console.log 'received worker data', ev.data, ev.data.msg
    inputId = ev.data.inputId
    handler = @handlers[inputId]
    switch ev.data.msg
      when 'log' then console.log ev.data.data
      when 'evalBegin' then handler.evalBegin()
      when 'evalEnd' then handler.evalEnd()
      when 'print' then handler.print(ev.data.data)
      when 'result' then handler.result(ev.data.data)
      when 'error' then handler.error(ev.data.data)
    #TODO: remove handler when finished

  interrupt: =>
    # TODO: cannot currently interrupt the worker, so we restart
    @worker.terminate()
    @worker = new Worker('/src/worker.js')
    @worker.onmessage = @handleMessage

engines = {}
engines.BaseHandler = BaseHandler
engines.Javascript = Javascript
engines.Markdown = Markdown
engines.JavascriptWorker = JavascriptWorker

NotebookJS.engines = engines

