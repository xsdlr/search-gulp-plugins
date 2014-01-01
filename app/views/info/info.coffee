repoList = require 'models/repo/repoList'
search = require 'views/search/search'

class Info extends Backbone.View

  el: '.plugin-info .count'

  template: require 'views/info/template'

  initialize: ->
    @listenTo repoList, 'change add', @render
    @listenTo search, 'search', @searched
    @searched = false
    @term = 'plugin'
    @render()

  searched: (query) ->
    @term = "#{if query is '' then '' else 'matching ' }plugin"

  render: ->

    params = {}
    params.count = repoList.filter((x) -> x.get('visible')).length
    params.term = "#{@term}#{if params.count is 1 then '' else 's'}"

    @$el.html @template params
    @

module.exports = new Info