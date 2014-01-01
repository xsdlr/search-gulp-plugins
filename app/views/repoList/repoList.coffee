repoList = require 'models/repo/repoList'
RepoItem = require 'views/repoList/repoItem'
loader = require 'loader'

class RepoList extends Backbone.View

  el: '.plugin-list'

  collection: repoList

  initialize: ->
    @listenTo loader, 'done', @render

  render: ->

    for plugin in @collection.models
      item = new RepoItem model: plugin
      @$el.append item.render().el

    @

module.exports = new RepoList