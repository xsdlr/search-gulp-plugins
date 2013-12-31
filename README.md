# search-gulp-plugins
This is a server-side app with a rich client to search gulp plugins.

__THIS__ is the repository where it is all hosted. Sorry for any confusion.

## Plan
This repository will be kept for now, while the backend will be constructed at [gratimax/gulp-plugins-api](https://github.com/gratimax/gulp-plugins-api). This backend will most likely be run at a DigitalOcean 'droplet' which Contra has provided.

The backend will periodically take all the data from all plugins, compile it to one JSON file, and serve it from a public URL. The front end will stay hosted on github pages(I'm not sure if it will stay on this repo) and will get the JSON from the backend instead of querying about 80 times, making it much faster. This will also allow the addition of github star count as well as download count to plugin sort.

Other than that and a few style changes, the client will stay the same.
