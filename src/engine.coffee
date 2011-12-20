root = exports ? this

class JavascriptEval
    evaluate: (input, onSuccess) -> 
        output = eval(input)
        console.log 'eval produced', input,  output
        onSuccess output



class MarkdownEval
    evaluate: (input, onSuccess) -> 
        console.log 'markdown eval', Showdown
        markdownConvertor = new Showdown.converter()
        console.log 'markdown cv'
        html = markdownConvertor.makeHtml(input)
        onSuccess html
    

engines = {}
engines.javascript = new JavascriptEval()
engines.markdown = new MarkdownEval()

root.engines = engines

