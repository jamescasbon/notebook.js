(function() {
  var JavascriptEval, MarkdownEval, engines, root;

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  JavascriptEval = (function() {

    function JavascriptEval() {}

    JavascriptEval.prototype.evaluate = function(input, onSuccess) {
      var output;
      output = eval(input);
      console.log('eval produced', input, output);
      return onSuccess(output);
    };

    return JavascriptEval;

  })();

  MarkdownEval = (function() {

    function MarkdownEval() {}

    MarkdownEval.prototype.evalaute = function(input, onSuccess) {
      var html, markdownConvertor;
      markdownConvertor = new Showdown.convertor();
      html = markdownConvertor.convert(input);
      return onSuccess(html);
    };

    return MarkdownEval;

  })();

  engines = {};

  engines.javascript = new JavascriptEval();

  engines.markdown = new MarkdownEval();

  root.engines = engines;

}).call(this);
