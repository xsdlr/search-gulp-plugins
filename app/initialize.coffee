loader = require 'loader'

infoView = require 'views/info/info'
repoListView = require 'views/repoList/repoList'
searchView = require 'views/search/search'

$ ->

  loader.req()

  $('.plugin-search').focus()