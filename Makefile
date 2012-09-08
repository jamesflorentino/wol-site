minify:
	cake minify

compile:
	node tools/build.js -o name=app out=stub.js baseUrl=src/
	cat src/require.js stub.js > bin/app.js
	rm stub.js
