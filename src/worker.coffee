
evals = {}

self.onmessage = (ev) =>

  inputId = ev.data.id
  src = ev.data.src
  self.postMessage(inputId: inputId, msg: 'worker msg handler start')


  # TODO: factor out API?  Interface?
  print = (d) => 
    self.postMessage(inputId: inputId, msg: 'print', data: d)

  try
    self.postMessage(inputId: inputId, msg: 'evalBegin')
    
    result = eval(src)

    if result?
      self.postMessage(inputId: inputId, msg: 'result', data: result.toString())
  
  catch error 
    self.postMessage(inputId: inputId, msg: 'error', data: error.toString()) 
  
  finally
    self.postMessage(inputId: inputId, msg: 'evalEnd')



