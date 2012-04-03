importScripts('/lib/underscore/underscore-min.js')

self.onmessage = (ev) =>

  inputId = ev.data.id
  src = ev.data.src
  #self.postMessage(inputId: inputId, msg: 'log', data: 'worker called')


  # TODO: factor out API?  Interface?
  print = (d) =>
    self.postMessage(inputId: inputId, msg: 'print', data: d.toString())

  try
    self.postMessage(inputId: inputId, msg: 'evalBegin')

    result = eval(src)

    if not result?
      result = '-'

    # we do not generally want to print the result of a
    if _.isFunction(result)
      result = '-'

    self.postMessage(inputId: inputId, msg: 'result', data: result.toString())

  catch error
    self.postMessage(inputId: inputId, msg: 'error', data: error.toString())

  finally
    self.postMessage(inputId: inputId, msg: 'evalEnd')



