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

    MarkdownEval.prototype.evaluate = function(input, onSuccess) {
      var html, markdownConvertor;
      console.log('markdown eval', Showdown);
      markdownConvertor = new Showdown.converter();
      console.log('markdown cv');
      html = markdownConvertor.makeHtml(input);
      return onSuccess(html);
    };

    return MarkdownEval;

  })();

  engines = {};

  engines.javascript = new JavascriptEval();

  engines.markdown = new MarkdownEval();

  root.engines = engines;

}).call(this);
