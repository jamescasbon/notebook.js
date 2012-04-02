Running
=======

You can serve the notebook with 'python -m SimpleHTTPServer', then visit http://localhost:8000


Developing
==========

Requirements
------------

npm packages: coffeecup, stylus and coffee-script

You can install these with `npm install .`

You need to fetch ace with git submodule init && git submodule update

Compilation
-----------

Use the watch flag and background the process to build automatically...

Compile template: 
  
  coffeecup -w index.coffee &

Compile model: 

  coffee -c -w ./src &

Compile css
  
  stylus -w css/ &
  

You can also make life much easier for yourself if you `pip install honcho && honcho -f Procfile.dev start`


TODO: 
=====

Frontend
--------

Now:

* new notebook hint on where to type
* play button position next to input 
* hint user playing non first cell on new notebook load
* play all button
* delete cell button
* Table of contens udpate
* show play/delete when active


* play all
* better dev mode 
* ensure all urls are relative
* detect whether content changed when evaluating (short circuit) - could do on isDirty except when
new loaded notebook 
* Skip null output/ show null output placeholder
* Set inital focus
* Defocus ajax should empty selection
* disable box on matched character in ace onblur
* url methods on notebook?
* engine lifecycle with notebook


Someday: 

* Table of contents filter  http://www.jankoatwarpspeed.com/examples/table-of-contents/demo2.html
* Same shortcuts on output as input (ctrl-c ctrl-fold ctrl-m)
* Page Down
* Document name
* Insert cell scroll
* Focus ace line where clicked
* Drag cell to reorder
* ace/virtual_renderer.js without scrollbar layers
* Holding keydown focus properly 
* CTRL-fold
* toolbar jump to running indicator
* toolbar rerun all cells
* Startup indicator
* Tooltip styling
* Base class for notebook views
* Do not destroy notebook views on toggle


CSS stuff http://css-tricks.com/different-transitions-for-hover-on-hover-off/

