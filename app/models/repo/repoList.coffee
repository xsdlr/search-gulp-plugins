Repo = require 'models/repo/repo'

class RepoList extends Backbone.Collection

  initialize: ->
    @comparator = (model) -> -(model.get 'downloads')

  model: Repo

module.exports = new RepoList