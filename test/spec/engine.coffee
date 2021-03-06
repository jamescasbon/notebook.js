engines = NotebookJS.engines

handler = null

describe 'NotebookJS.engines', ->

  beforeEach -> 
    handler = new engines.BaseHandler() 
    sinon.stub(handler, 'result')
    sinon.stub(handler, 'evalBegin')
    sinon.stub(handler, 'evalEnd')
    sinon.stub(handler, 'error')
    sinon.stub(handler, 'print')

  afterEach -> 
    handler = null

  describe 'markdown', ->
    it 'should render markdown', ->
      md = new engines.Markdown()

      md.evaluate('*hi* from markdown', handler)
      
      handler.evalBegin.should.have.calledOnce()
      handler.result.should.have.calledOnce()
      handler.evalEnd.should.have.calledOnce()
     
      mdout = handler.result.getCall(0).args[0]
      handler.result.should.have.calledWith(
        '<p><em>hi</em> from markdown</p>')
    
  describe 'javascript window', ->
    it 'should be able to print', ->
      js = new engines.JavascriptWindow()
      js.evaluate('print(1)', handler)
      
      handler.evalBegin.should.have.calledOnce()
      handler.print.should.have.calledOnce()
      handler.print.should.have.calledWith('1')
      handler.evalEnd.should.have.calledOnce()

    it 'should be able to evaluate', ->
      js = new engines.JavascriptWindow()
      js.evaluate('1+1', handler)
      
      handler.evalBegin.should.have.calledOnce()
      handler.result.should.have.calledOnce()
      handler.result.should.have.calledWith('2')
      handler.evalEnd.should.have.calledOnce()

  describe 'worker javascript', -> 
    it 'should be able to print', (done) ->
      js = new engines.Javascript()

      handler.evalEnd = -> 
        handler.evalBegin.should.have.calledOnce()
        handler.print.should.have.calledOnce()
        handler.print.should.have.calledWith("999")
        done()
      
      js.evaluate('print(999)', handler)

    it 'should be able to evaluate', (done) ->
      js = new engines.Javascript()

      handler.evalEnd = -> 
        handler.evalBegin.should.have.calledOnce()
        handler.print.should.have.calledOnce()
        handler.print.should.have.calledWith("4")
        done()
      
      js.evaluate('print(2+2)', handler)
  
    it 'should be able to halt', ->
      js = new engines.Javascript()
      js.halt()

