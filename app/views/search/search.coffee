class SearchView extends Backbone.View

  el: '.plugin-search'

  events:
    'keyup': 'search'

  search: ->
    query = @$el.val().toLowerCase()
    @trigger 'search', query

module.exports = new SearchView