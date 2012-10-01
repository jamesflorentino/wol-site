Notes:

- `tile` or `tiles` usually refer to the data for the grid element.
- `hexTile` or `hexTiles` refers to the graphical representation of the `tile` element.

Notes about this game

This is an experimental, work-in-progress game framework built on top of the createJS suite.  This is not yet a stable release, and is primarily meant for personal use.

The game uses AMD style JavaScript development to easily maintain and modularize JavaScript files in the project. It is baked and minified on compile for CDN purposes.

It also uses spriting/atlassing for elements inside the game to reduce HTTP requests fo site performance.

One of the important thing to remember is the `wol` object. It is the global namespace which holds the renderer's and other utilities' functionality and configuration. For example,
`wol.pause()` will pause animations currently happening in the Stage. `wol.create` is an object which facilitates and shims the createjs classes to the main game interface.

Sockets are layered into the app.js file. The game is agnostic to networking and can be run without the use of a backend server. 


Some things left todo:

### Server
- connecting to a game is very buggy. This can probably resolve by setting a flag to a Game object and setting that to true whenever a user leaves or when the room is full.
- whenever a user disconnects without firing an event in the socket manager, This can be resolved by pushing a `ping` event that tries to see if the user is still connected to the browser.

### Client
- The touch interaction is annoying. Mobile devices should be able to touch the unit's tile themselves. Issue a `.mouseEnabled = false;` statement to all sprite sheets since they do not really want to receive events from the user.
- There should be login screen where the user can set their username and authKey.
- Setup a home page where it explains these basic facts:
    - What the game is about
    - How it works
    - Some basic future plans of it
    - Introduction of units/teams and their specialties.

### Creative
- Compose a battle theme for the game.
- Compose a login theme for the game.
- There's no spoon.

* * *

This readme file was typed through SSH so most of the shit I've written here has a great chance to not make sense to the person reading it.
