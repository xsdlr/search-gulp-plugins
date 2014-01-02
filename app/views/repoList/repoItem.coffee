repoListView = require 'views/repoList/repoList'
searchView = require 'views/search/search'

class RepoItem extends Backbone.View

  tagName: 'div'
  className: 'row plugin'

  template: require 'views/repoList/item'

  initialize: ->
    @listenTo @model, 'change', @render
    @listenTo searchView, 'search', @visible

  render:  ->
    @$el.html @template @model.toJSON()

    if @model.get('visible')
      @$el.show()
    else
      @$el.hide()

    @

  visible: (query) ->
    @model.set('visible', @model.matches query)

module.exports = RepoItem