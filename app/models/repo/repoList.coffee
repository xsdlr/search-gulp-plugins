Repo = require 'models/repo/repo'
searchView = require 'views/search/search'

class RepoList extends Backbone.Collection

  initialize: ->
    @comparator = (model) -> -(model.get 'downloads')
    @listenTo searchView, 'search', @sort

  model: Repo

module.exports = new RepoList