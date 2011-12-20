(function() {
  var JavascriptEval, MarkdownEval, engines, root;

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  JavascriptEval = (function() {

    function JavascriptEval() {}

    JavascriptEval.prototype.evaluate = function(input, onSuccess, onErr) {
      var output;
      try {
        output = eval(input);
        console.log('eval produced', input, output);
        return onSuccess(output);
      } catch (error) {
        return onErr(error.message);
      }
    };

    return JavascriptEval;

  })();

  MarkdownEval = (function() {

    function MarkdownEval() {}

    MarkdownEval.prototype.evaluate = function(input, onSuccess, onErr) {
      var html, markdownConvertor;
      try {
        markdownConvertor = new Showdown.converter();
        html = markdownConvertor.makeHtml(input);
        return onSuccess(html);
      } catch (error) {
        return onError(error.message);
      }
    };

    return MarkdownEval;

  })();

  engines = {};

  engines.javascript = new JavascriptEval();

  engines.markdown = new MarkdownEval();

  root.engines = engines;

}).call(this);
