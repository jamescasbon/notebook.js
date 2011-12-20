root = exports ? this

class JavascriptEval
    evaluate: (input, onSuccess, onErr) -> 
        try
            output = eval(input)
            console.log 'eval produced', input,  output
            onSuccess output
        catch error
            onErr error.message


class MarkdownEval
    evaluate: (input, onSuccess, onErr) ->
        try
            markdownConvertor = new Showdown.converter()
            html = markdownConvertor.makeHtml(input)
            onSuccess html
        catch error
            onError error.message
        

engines = {}
engines.javascript = new JavascriptEval()
engines.markdown = new MarkdownEval()

root.engines = engines

