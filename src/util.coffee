root = exports ? this
NotebookJS = root.NotebookJS = root.NotebookJS ? {}
NotebookJS.util = NotebookJS.util ? {}

$ = jQuery

B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="

base64Decode = (data) ->
  if atob?
    # Gecko and Webkit provide native code for this
    atob(data)
  else
    # Adapted from MIT/BSD licensed code at http://phpjs.org/functions/base64_decode
    # version 1109.2015
    i = 0
    ac = 0
    dec = ""
    tmp_arr = []

    if not data
      return data

    data += ''

    while i < data.length
      # unpack four hexets into three octets using index points in b64
      h1 = B64.indexOf(data.charAt(i++))
      h2 = B64.indexOf(data.charAt(i++))
      h3 = B64.indexOf(data.charAt(i++))
      h4 = B64.indexOf(data.charAt(i++))

      bits = h1 << 18 | h2 << 12 | h3 << 6 | h4

      o1 = bits >> 16 & 0xff
      o2 = bits >> 8 & 0xff
      o3 = bits & 0xff

      if h3 == 64
        tmp_arr[ac++] = String.fromCharCode(o1)
      else if h4 == 64
        tmp_arr[ac++] = String.fromCharCode(o1, o2)
      else
        tmp_arr[ac++] = String.fromCharCode(o1, o2, o3)

    tmp_arr.join('')

base64Encode = (data) ->
  if btoa?
    # Gecko and Webkit provide native code for this
    btoa(data)
  else
    # Adapted from MIT/BSD licensed code at http://phpjs.org/functions/base64_encode
    # version 1109.2015
    i = 0
    ac = 0
    enc = ""
    tmp_arr = []

    if not data
      return data

    data += ''

    while i < data.length
      # pack three octets into four hexets
      o1 = data.charCodeAt(i++)
      o2 = data.charCodeAt(i++)
      o3 = data.charCodeAt(i++)

      bits = o1 << 16 | o2 << 8 | o3

      h1 = bits >> 18 & 0x3f
      h2 = bits >> 12 & 0x3f
      h3 = bits >> 6 & 0x3f
      h4 = bits & 0x3f

      # use hexets to index into b64, and append result to encoded string
      tmp_arr[ac++] = B64.charAt(h1) + B64.charAt(h2) + B64.charAt(h3) + B64.charAt(h4)

    enc = tmp_arr.join('')

    r = data.length % 3
    return (if r then enc.slice(0, r - 3) else enc) + '==='.slice(r or 3)

base64UrlDecode = (data) ->
  m = data.length % 4
  if m != 0
    for i in [0...4 - m]
      data += '='
  data = data.replace(/-/g, '+')
  data = data.replace(/_/g, '/')
  base64Decode(data)

base64UrlEncode = (data) ->
  data = base64Encode(data)
  while data[-1...] is '='
    data = data[...-1]
  data = data.replace(/\+/g, '-')
  data = data.replace(/\//g, '_')
  data

class ModalDialog
  constructor: (content) ->
    @element = $("""<div class="modal">
                      <div class="modal-inner">
                        <a class="close">&times;</a>
                        <div class="modal-content"></div>
                      </div>
                    </div>""")

    @element.appendTo(document.body)
    @element.on 'click', '.close', =>
      this.close()

    this.setContent(content) if content

  setContent: (content) ->
    @element.find('.modal-content').html(content)

  close: ->
    @element.remove()


NotebookJS.util.base64Encode = base64Encode
NotebookJS.util.base64Decode = base64Decode
NotebookJS.util.base64UrlEncode = base64UrlEncode
NotebookJS.util.base64UrlDecode = base64UrlDecode
NotebookJS.util.ModalDialog = ModalDialog
