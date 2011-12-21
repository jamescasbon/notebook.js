root = exports ? this

class JavascriptContext 
    foo: 42


class JavascriptEval
    evaluate: (input, onSuccess, onErr) => 
        try
            output = eval(input)
            #console.log 'eval produced', input,  output
            onSuccess output.toString()
        catch error
            onErr error.toString()


class MarkdownEval
    evaluate: (input, onSuccess, onErr) =>
        try
            markdownConvertor = new Showdown.converter()
            html = markdownConvertor.makeHtml(input)
            onSuccess html
        catch error
            onError error.message
        

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
        console.log('got msg from worker', ev.data)
        inputId = ev.data.inputId
        handler = @handlers[inputId]
        handler.handleMessage(ev.data)
        #TODO: remove handler when finished
        


engines = {}
engines.javascript = new WorkerEval()
engines.markdown = new MarkdownEval()

root.engines = engines

