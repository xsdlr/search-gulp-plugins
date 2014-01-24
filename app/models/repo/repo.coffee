class Repo extends Backbone.Model

  finish: ->
    @set 'noRepo', if @get('repo') then '' else 'none'
    @set 'typeColor', if @get('type') is 'gulpplugin' then 'info' else 'success'
    @set 'info', (@get('description') + @get('name') + @get('version') + @get('type') + @get('keywords') + @get('repo')).toLowerCase()
    @set 'visible', true

  matches: (query) ->
    @get('info').indexOf(query) isnt -1

module.exports = Repo