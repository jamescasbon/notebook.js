engines = NotebookJS.engines

Cell = NotebookJS.Cell

describe 'NotebookJS.Cell', ->
  
  c = null
  beforeEach -> 
    c = new Cell()

  it 'should call engine to evaluate and interrupt ', -> 
    js = new engines.JavascriptWorker()
    evaluate = sinon.stub(js, 'evaluate')
    evaluate = sinon.stub(js, 'interrupt')

    c.engine = js

    c.set(input: '1+1')
    c.evaluate()
    js.evaluate.should.have.called()
    js.evaluate.should.have.calledWith('1+1', c)

    c.interrupt()
    js.interrupt.should.have.called()
    c.get('output').should.equal('<div class="error">Interrupted</div>')


  it 'should impement engine handler', -> 
    return 
