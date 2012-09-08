fs = require 'fs'

SCRIPTS_SOURCE = 'src/game/textures/json'
SCRIPTS_DEST = 'src/game/textures'

task "minify", "minify texture data", ->
    console.log "------------------------------------------------"
    console.log "reading directory....          #{SCRIPTS_SOURCE}"
    list = fs.readdirSync SCRIPTS_SOURCE
    console.log "listing files..."
    list.forEach (fileName) ->
        source = "#{SCRIPTS_SOURCE}/#{fileName}"
        dest = "#{SCRIPTS_DEST}/#{fileName}"
        contents = fs.readFileSync source, 'utf-8'
        contents = contents.replace /\n|\s/g, ''
        contents = contents.replace /\w+.png/, (a) -> "media/#{a}"
        contents = "define(function(){return #{contents};});"
        fs.writeFileSync dest, contents
        console.log  "minified          #{dest}"
