root = exports ? this

class JavascriptEval
    evaluate: (input, onSuccess) -> 
        output = eval(input)
        console.log 'eval produced', input,  output
        onSuccess output



class MarkdownEval
    evalaute: (input, onSuccess) -> 
        markdownConvertor = new Showdown.convertor()

        html = markdownConvertor.convert(input)
        onSuccess html
    

engines = {}
engines.javascript = new JavascriptEval()
engines.markdown = new MarkdownEval()

root.engines = engines

