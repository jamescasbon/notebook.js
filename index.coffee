doctype 5
html ->
  head ->
    title 'notebook.js demo'
    if process.env.NJSMODE == 'dev'
      script src: "/lib/jquery-1.7.2.js"
      script src: "/lib/underscore/underscore.js"
      script src: "/lib/underscore.string/lib/underscore.string.js"
      script src: "/lib/backbone/backbone.js"
      script src: "/lib/backbone.localstorage/backbone.localStorage.js"
      script src: "/lib/showdown/src/showdown.js",
      script src: "/src/util.js?" + (new Date).getTime()
      script src: "/src/engine.js?" + (new Date).getTime()
      script src: "/src/notebook.js?" + (new Date).getTime()
      script src: "/src/views.js?" + (new Date).getTime()
    else
      script src: "/lib/jquery-1.7.2.min.js"
      script src: "/lib/underscore/underscore-min.js"
      script src: "/lib/underscore.string/dist/underscore.string.min.js"
      script src: "/lib/backbone/backbone-min.js"
      script src: "/lib/backbone.localstorage/backbone.localStorage-min.js"
      script src: "/lib/showdown/compressed/showdown.js",
      script src: '/lib/notebook.js'

    script src: "/lib/ace/build/src/ace.js"
    script src: "/lib/ace/build/src/mode-javascript.js"
    script src: "/lib/ace/build/src/mode-markdown.js"
    script src: "/lib/google-code-prettify/prettify.js",
    link href: 'http://fonts.googleapis.com/css?family=Anonymous+Pro:400,700', rel: 'stylesheet', type: 'text/css'
    script type: 'text/x-mathjax-config'
      "MathJax.Hub.Config({messageStyle: 'none', skipStartupTypeset: true, tex2jax: {inlineMath: [['$','$']]}});"
    script src: "http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"

    link rel: 'stylesheet', href: '/css/base.css'
    link rel: 'stylesheet', href: '/css/skeleton.css'
    link rel: 'stylesheet', href: '/css/layout.css'
    link rel: 'stylesheet', href: '/css/notebook.css'
    link rel: 'stylesheet', href: '/lib/google-code-prettify/prettify.css'

    if process.env.NJSMODE == 'production'

      text '''<script type="text/javascript">
        var _gaq = _gaq || [];
        _gaq.push(['_setAccount', 'UA-30300426-1']);
        _gaq.push(['_trackPageview']);

        (function() {
          var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
          ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
          var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
        })();
        </script>
        '''
  body ->

    div '.container', ->
      div '#navbar', ->

        a '#logo', href: "#", -> 'notebook.js'
        div '#title', -> ''


    script type: "text/template", id: "cell-edit-template", ->
      div '.cell', id: "[[= id ]]", ->

        # the cell type indicator
        # we enclose in a tooltip div to avoid rotating the tooltip
        div 'tooltip', tooltip: 'Click to change cell type', ->
          a 'type', -> '[[= type ]]'

        # the cell spawner
        div 'tooltip', tooltip: 'Double click to create cell', ->
          div 'spawn-above', tabindex: '[[= position ]]a'

        # the fold button, tooltip outside to avoid rotating tooltip
        div 'fold-control tooltip', tooltip: 'Click to fold input', ->
          div 'fold-button', -> '>'

        # the input in a container we use to control sizing
        div 'ace-container', ->
          div class: "cell-input", style: "top:0;bottom:0;left:0;right:0;", id: "input-[[= id ]]", ->

        div 'status-bar', ->
          div 'tooltip', tooltip: 'Evaluate', ->
            img 'evaluate', src: '/img/play.png'

        hr -> ''

        div 'cell-output', tabindex: "[[= position ]]c", ->
          '[[= output ]]'

        # status controls in right margin
        div 'status-bar', ->
          div 'tooltip', tooltip: 'Interrupt', ->
            img 'interrupt tooltip', src: '/img/ajax-loader.gif', tooltip: 'Interrupt'


    script type: "text/template", id: 'cell-view-template', ->
      div '.cell', id: "[[= id ]]", ->
        div class: 'spawn-above'
        # FIXME: mixing of underscore logic in this coffeekup template is not pretty
        # we need two fake divs here to get the text output
        # must be better way
        div "[[ if (type == 'javascript' & inputFold == false) { ]]"
        pre class: "cell-input prettyprint", -> "[[= input ]]"
        hr -> ''
        div "[[ } ]]"

        div class: "cell-output", -> "[[= output ]]"


    script type: "text/template", id: "index-template", ->
      div id: "notebook", class: "sixteen columns", ->
        div class: "twelve columns offset-by-two", ->
          h1 -> "Welcome to notebook.js"
          p -> """ Notebook.js is a literate online code notebook.
            You can use it to run code inside your browser
            and store the results locally.  Try the tutorials to learn more.
            """
          p ->
            a href: 'https://github.com/jamescasbon/notebook.js', -> 'Development and bug reports.'
        hr -> ''
        div class: "eight columns offset-by-one", ->
          button '#new-notebook-button', style: 'float: right;', ->  'New notebook'
          h3 'My notebooks'
          p ->
            ul id: 'notebooks'
          p ->
            label for: "files", -> 'Load notebook from file'
            input type:"file", id: "load-file", name:"file", -> 'hi'

        div '#right-index', class: "four columns offset-by-one", ->
          h3 'Tutorials'
          p ->
            ul ->
              li -> a href: '/#load/examples/tut_first.notebook', -> 'First steps'
              li -> a href: '/#load/examples/tut_engine.notebook', -> 'Using the engine'
              li -> a href: '/#load/examples/tut_web.notebook', -> 'Be a web citizen'
              li -> a href: '/#load/examples/tut_eqn.notebook', -> 'Using equations'
              li -> a href: '/#load/examples/tut_sharing.notebook', -> 'Sharing notebooks'


    script type: "text/template", id: "notebook-index-template", ->
      li class: "list-notebook", ->
        a href: "#[[= id ]]/view/", ->
          "[[= title ]]"

        div '.right', ->
          a class: 'right', href: "#[[= id ]]/edit/", -> "Edit"
          a class: 'right', href: "#[[= id ]]/delete/", -> "Delete"


    script type: "text/template", id: "notebook-template", ->
      div id: 'notebook', class: "fourteen columns", ->
        div id: 'toc'
        ul class: "cells"

        div 'tooltip', tooltip: 'Double click to create cell', ->
          div id: 'spawner', tabindex: "1000000000"
        div '#menu', ->
          button '#toggle-edit', -> 'toggle edit/view'
          a id: 'save-to-file', class: 'button', download: 'notebook.json', -> 'save to file'
          button '#share-url', -> 'share'


    script type: "text/template", id: "new-notebook-form", ->
      div id: "notebook", class: "sixteen columns", ->
        div 'cell', ->
          h1 -> "Create new notebook"
          form ->
            label for: 'name', -> 'Name'
            input type: 'text', id: 'name'
            button type: 'submit', 'Create'

    script type: "text/template", id: "share-notebook", ->
      h4 -> "Share this link to share the notebook"
      input id: 'share-url', type: 'text', value: '[[= url ]]'
