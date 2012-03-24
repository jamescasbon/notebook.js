
all: 
	coffee -c src

	@NJSMODE=dev coffeecup -c -f index.coffee
	mv index.html dev.html

	@NJSMODE=production coffeecup -c index.coffee

	java -jar compiler.jar --js_output_file lib/notebook.js --js \
		src/notebook.js src/engine.js src/views.js
		
