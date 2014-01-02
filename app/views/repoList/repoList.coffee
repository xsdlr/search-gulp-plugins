repoList = require 'models/repo/repoList'
searchView = require 'views/search/search'
RepoItem = null
loader = require 'loader'

class RepoListView extends Backbone.View

  el: '.plugin-list'

  collection: repoList

  initialize: ->
    @listenTo loader, 'done', @render

  render: ->
    # circular dependency workaround
    unless RepoItem?
      RepoItem = require 'views/repoList/repoItem'

    for plugin in @collection.models
      item = new RepoItem model: plugin
      @$el.append item.render().el

    @

module.exports = new RepoListView