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
    c.get('state').should.equal('evaluating') 

    c.interrupt()
    js.interrupt.should.have.called()
    c.get('output').should.equal('<div class="error">Interrupted</div>')
    # c.get('state') TODO: assert this is null

  it 'should impement BaseHandler.print', -> 
    c.print('1') 
    c.get('output').should.equal('<div class="print">1</div>')
    
   it 'should impement BaseHandler.error', -> 
    c.error('1') 
    c.get('output').should.equal('<div class="error">1</div>')
    
   it 'should impement BaseHandler.result', -> 
    c.result('1') 
    c.get('output').should.equal('<div class="print">1</div>')

   it 'should impement BaseHandler.evalEnd', -> 
    c.set(state: 'evaluating') 
    c.evalEnd() 
    # c.get('state') TODO: assert this is null





