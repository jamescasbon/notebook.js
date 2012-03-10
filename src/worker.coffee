
self.onmessage = (ev) =>
  
  inputId = ev.data.id
  src = ev.data.src

  print = (d) => 
    self.postMessage(inputId: inputId, msg: 'print', data: d)


  self.postMessage(inputId: inputId, msg: 'evalBegin')

  try
    result = eval(src)
    if result?
      self.postMessage(inputId: inputId, msg: 'result', data: result.toString())
  catch error 
    self.postMessage(inputId: inputId, msg: 'error', data: error.toString()) 
  finally
    self.postMessage(inputId: inputId, msg: 'evalEnd')


