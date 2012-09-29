server:
	node app

production:
	NODE_ENV=production node app.js

compile:
	node tools/build.js -o name=app out=stub.js baseUrl=public/javascripts/wolgame/
	cat public/javascripts/wolgame/require.js stub.js > public/javascripts/app.js
	rm stub.js
