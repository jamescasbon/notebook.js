
Developing
==========

Compile template: 
  
  coffeecup index.coffee

Compile model: 

  coffeescript -c -w ./src

Compile css
  
  stylus -w css/
  

TODO: 
=====

Frontend
--------

Now:

* expand Ace when overflow
* Ace markdown mode 
* cant go back to top line on overflow
* CTRL+enter
* Errors not persistent
* Move buttons
* backspace supress
* evaluate focus element
* html stripped from javascript input 
* monkeypatch ace renderer to override scroll?

Someday: 
* latex mode
* Hide input for markdown
* Document name
* Hide insert cell
* Mouse scroll in ace 
* Insert cell scroll
* Focus ace line where clicked

ace/virtual_renderer.js without scrollbar layers

CSS stuff http://css-tricks.com/different-transitions-for-hover-on-hover-off/

