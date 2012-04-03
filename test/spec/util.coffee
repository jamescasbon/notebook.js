util = NotebookJS.util

describe 'NotebookJS.util', ->
  describe '#base64Encode()', ->
    it 'should base64 encode its input', ->
      util.base64Encode("a test string").should.equal("YSB0ZXN0IHN0cmluZw==")

  describe '#base64Decode()', ->
    it 'should base64 decode its input', ->
      util.base64Decode("YSB0ZXN0IHN0cmluZw==").should.equal("a test string")

  describe '#base64UrlEncode()', ->
    it 'should base64url encode its input', ->
      util.base64UrlEncode("a test string").should.equal("YSB0ZXN0IHN0cmluZw")

  describe '#base64UrlDecode()', ->
    it 'should base64url decode its input', ->
      util.base64UrlDecode("YSB0ZXN0IHN0cmluZw").should.equal("a test string")

  describe 'ModalDialog', ->
    md = null

    afterEach ->
      md.close()

    it 'should add a modal dialog to the document body', ->
      md = new util.ModalDialog()
      md.element.parent()[0].should.equal(document.body)

    it 'should set its content to the constructor argument', ->
      md = new util.ModalDialog("Hello world")
      md.element.find('.modal-content').text().should.equal("Hello world")

    it '#setContent() should set the dialog content', ->
      md = new util.ModalDialog("Hello world")
      md.setContent("No, it's my turn!")
      md.element.find('.modal-content').text().should.equal("No, it's my turn!")

    it '#close() should close the dialog', ->
      md = new util.ModalDialog("Hello world")
      md.close()
      md.element.parent().length.should.equal(0)
