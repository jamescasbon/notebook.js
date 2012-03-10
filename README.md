Running
=======

You can serve the notebook with 'python -m SimpleHTTPServer', then visit http://localhost:8000


Developing
==========

Requirements
------------

npm packages: coffeecup, stylus and coffee-script

you need to fetch ace with git submodule init && git submodule update

Compilation
-----------

Use the watch flag and background the process to build automatically...

Compile template: 
  
  coffeecup -w index.coffee &

Compile model: 

  coffeescript -c -w ./src &

Compile css
  
  stylus -w css/ &
  

TODO: 
=====

Frontend
--------

Now:

* cant go back to top line on overflow
* Errors not persistent
* Move buttons
* html stripped from javascript input 
* keyup in ace out of screen detection
* detect whether content changed when evaluating (short circuit)
* Overflows on output
* Detect when to show last line
* Enable new line on new cell
* Skip null output
* Dirty cell status
* Null output indicator?
* CSS fold indicator 
* Set inital focus

Someday: 
* Document name
* Insert cell scroll
* Focus ace line where clicked
* Drag cell to reorder
* ace/virtual_renderer.js without scrollbar layers

CSS stuff http://css-tricks.com/different-transitions-for-hover-on-hover-off/

