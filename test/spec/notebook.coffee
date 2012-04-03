engines = NotebookJS.engines

Cell = NotebookJS.Cell
Notebook = NotebookJS.Notebook

describe 'NotebookJS.model', ->
  
  describe 'Cell', -> 

    c = null
    beforeEach -> 
      c = new Cell()

    it 'should call engine to evaluate and interrupt ', ->
      js = new engines.Javascript()
      sinon.stub(js, 'evaluate')
      sinon.stub(js, 'interrupt')
      md = new engines.Markdown()
      sinon.stub(md, 'evaluate')

      c.engines = 
        code: js
        markdown: md

      c.set(input: '1+1')
      c.evaluate()
      js.evaluate.should.have.called()
      js.evaluate.should.have.calledWith('1+1', c)
      c.get('state').should.equal('evaluating') 

      c.interrupt()
      js.interrupt.should.have.called()
      c.get('output').should.equal('<div class="error">Interrupted</div>')
      # c.get('state').should.not.exist

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


  describe 'Notebook', ->
    
    n = null
    beforeEach -> 
      n = new Notebook()

    it 'should be able to start and stop engines ', ->
      # n.get(state) should be null
      n.start()
      console.log 'eng', n.engines
      n.engines.should.exist
      n.get('state').should.equal('running')

      n.stop()
      #n.engines.should().should.not.exist
      #should.not.exist(n.get('state'))

   
    it 'should register engines on newly added cells', -> 
      n.start()
      # not using n.cells.create as this requires storage
      c = new Cell()
      n.cells.add(c)
      c.engines.should.exist
      
      n.get('pendingSaves').should.equal(true)

    it 'should notice cell changes', -> 
      c = new Cell()
      n.cells.add(c)
      n.set pendingSaves: false
      c.set input:'ohhai'
      n.get('pendingSaves').should.equal true

      n.set pendingSaves: false
      n.cells.remove c
      n.get('pendingSaves').should.equal true
  

