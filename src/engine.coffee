root = exports ? this


class JavascriptEval
  evaluate: (input, handler) => 
    try
      print = (d) -> 
        handler.handleMessage(msg: 'print', data: d.toString())
      result = eval(input)
      
      #console.log 'eval produced', input, output
      if result?
        console.log('result', result)
        handler.handleMessage(msg: 'result', data: result.toString())

    catch error
      console.log(error.message, error.stack)
      handler.handleMessage(msg: 'error', data: error.toString())
    finally 
      handler.handleMessage(msg: 'evalEnd')


class MarkdownEval
  evaluate: (input, handler) =>
    try
      markdownConvertor = new Showdown.converter()
      html = markdownConvertor.makeHtml(input)
      handler.handleMessage(msg: 'raw', data: html)

    catch error
      console.log error.message
      onErr error.message
    finally 
      handler.handleMessage(msg: 'evalEnd')
    

class WorkerEval
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
    console.log('got msg from worker', ev.msg)
    inputId = ev.data.inputId
    handler = @handlers[inputId]
    handler.handleMessage(ev.data)
    #TODO: remove handler when finished
    


engines = {}
engines.javascript = new WorkerEval()
engines.markdown = new MarkdownEval()

root.engines = engines

