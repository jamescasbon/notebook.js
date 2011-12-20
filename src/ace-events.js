(function() {
  var canon;

  canon = require('pilot/canon');

  canon.addCommand({
    name: 'evaluate',
    bindKey: {
      win: 'Ctrl-E',
      mac: 'Command-E',
      sender: 'editor'
    },
    exec: function(env, args, request) {
      console.log('canon eval handler');
      return $(env.editor.container).trigger('evaluate');
    }
  });

  canon.addCommand({
    name: 'toggleMode',
    bindKey: {
      win: 'Ctrl-M',
      mac: 'Command-M',
      sender: 'editor'
    },
    exec: function(env, args, request) {
      console.log('canon eval handler');
      return $(env.editor.container).trigger('toggle');
    }
  });

}).call(this);
