root = exports ? this


class JavascriptEval
    evaluate: (input, handler) => 
        try
            print = (d) -> 
                handler.handleMessage(msg: 'print', data: d.toString())
            foo = ->
                eval(input)
            
            result = setTimeout(foo, 0)
            #console.log 'eval produced', input,  output
            if result?
                console.log('result', result)
                handler.handleMessage(msg: 'result', data: result.toString())

        catch error
            console.log(error.message, error.stack)
            handler.handleMessage(msg: 'error', data: error.toString())
        finally 
            handler.handleMessage(msg: 'evalEnd') 


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
        console.log('got msg from worker', ev.msg)
        inputId = ev.data.inputId
        handler = @handlers[inputId]
        handler.handleMessage(ev.data)
        #TODO: remove handler when finished
        


engines = {}
engines.javascript = new JavascriptEval()
engines.markdown = new MarkdownEval()

root.engines = engines

