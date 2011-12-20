canon = require 'pilot/canon'

canon.addCommand
    name: 'evaluate', 
    bindKey: { win: 'Ctrl-E', mac: 'Command-E', sender: 'editor' },
    exec: (env, args, request) ->
        console.log 'canon eval handler'
        $(env.editor.container).trigger('evaluate')


