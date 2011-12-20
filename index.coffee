doctype 5
html ->
  head ->
    title 'notebook.js demo'
    script src: "http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js" 
    script src: "/lib/underscore.js" 
    script src: "/lib/backbone.js" 
    script src: "/lib/backbone.localStorage.js"
    script src: "/lib/showdown.js"
    script src: "/src/engine.js" 
    script src: "/src/notebook.js" 
    script src: "/src/views.js" 

  body ->
    h1 'notebook.js demo'

    div '#notebook', ->
      div '#title', -> ''
      ul id: "cells" 
      div '#spawner', ->
          'Spawn a new cell'


    script type: "text/template", id: "cell-template", ->
      div '.cell', id: "[[= id ]]", ->
        div '.spawn-above', -> 'Spawn cell above'
        div '.controls', ->
          div '.evaluate', -> 'evaluate'
          div '.delete', -> 'delete'
          div '.toggle', -> 'toggle'
        textarea class: "cell-input", rows: 5, cols: 80, ->
          '[[= input ]]'
        div '.cell-output', ->
          '[[= output ]]'


