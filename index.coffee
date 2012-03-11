doctype 5
html ->
  head ->
    title 'notebook.js demo'
    script src: "/lib/jquery-1.7.1.js" 
    script src: "/lib/underscore.js" 
    script src: "/lib/backbone.js" 
    script src: "/lib/backbone.localStorage.js"
    script src: "/lib/showdown.js"
    script src: "/ace/build/src/ace.js"
    script src: "/ace/build/src/mode-javascript.js"
    script src: "/ace/build/src/mode-markdown.js"
    script src: "/src/engine.js" 
    script src: "/src/notebook.js" 
    script src: "/src/views.js" 
    
    if true
      script type: 'text/x-mathjax-config'
        "MathJax.Hub.Config({messageStyle: 'none', skipStartupTypeset: true, tex2jax: {inlineMath: [['$','$'], ['\\(','\\)']]}});"
      script src: "http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"

    link rel: 'stylesheet', href: '/css/base.css'
    link rel: 'stylesheet', href: '/css/skeleton.css'
    link rel: 'stylesheet', href: '/css/layout.css'
    link rel: 'stylesheet', href: '/css/notebook.css'

  body ->
    
    div '.container', ->
      div '#notebook', ->
        div '#navbar', ->
          div '#logo', -> 'notebook.js'
          div '#title', -> ''
        ul id: "cells"
        div id: 'spawner', tabindex: "1000000000"
        
          

    script type: "text/template", id: "cell-template", ->
      div '.cell', id: "[[= id ]]", ->
        a 'type', -> '[[= type ]]'
        div 'spawn-above', tabindex: '[[= position ]]a'
        div 'controls', ->
          button 'full-width delete', -> 'delete'
        # we can control the container size, but not the editor
        div 'marker-input', -> '>'

        div 'ace-container', ->
          div class: "cell-input", style: "top:0;bottom:0;left:0;right:0;", id: "input-[[= id ]]", ->
      
        hr -> ''

        div 'cell-output', tabindex: "[[= position ]]c", ->
          '[[= output ]]'

        div 'status-bar', -> 
          img 'evaluate', src: '/img/play.png'
          img 'interrupt', src: '/img/ajax-loader.gif'



