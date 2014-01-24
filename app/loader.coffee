progress = require 'progress'
Repo = require 'models/repo/repo'
repoList = require 'models/repo/repoList'

###class Loader

  constructor: ->
    _.extend @, Backbone.Events
    loader = @

    # Keeping track of objects
    @objects =
      list: []

      track: (obj) ->
        @list.push obj
        loader.trigger 'append'

      finish: (obj) ->
        @list.splice @list.indexOf(name), 1
        loader.trigger "remove"

    # call 'done' if need be
    @on 'remove', =>
      if @objects.list.length is 0
        repoList.sort()
        @trigger 'done'

    @on 'done', =>
      progress.done()

module.exports = loader = new Loader###

module.exports = loader = {}
_.extend loader, Backbone.Events

# load everything
loadAll = () ->
  $.ajax
    url: 'http://npmsearch.com/query?q=keywords:gulpplugin,gulpfriendly&fields=name,description,version,repository,url,keywords&size=10000&sort=rating:desc'
    success: (data) ->
      (JSON.parse data).results.map fetch
      loader.trigger 'done'
      progress.done()

# fetch data
fetch = (data) ->
  console.log data
  repo = new Repo()
  if repoList.pluck("name").indexOf(data.name) is -1
    repo.set "name", data.name
    repo.set "description", data.description
    repo.set "version", data.version
    if data.repository
      url = data.repository
      regexp = /github\.com(.*)/
      if url.indexOf('github') isnt -1
        repo.set "repo", regexp.exec(url)[1].slice(1).replace(/\.git$/, "")
        repo.set "repoUrl", "https://github.com/" + repo.get("repo")
      else
        repo.set "repo", ""
        repo.set "repoUrl", ""
    else
      repo.set "repo", ""
      repo.set "repoUrl", ""
    repo.set "url", "https://npmjs.org/package/" + repo.get("name")
    repo.set 'keywords', data.keywords
    repo.set "type", data.keywords.filter((x) ->
      x is "gulpplugin" or x is "gulpfriendly"
    )[0]
    repo.set "downloads", 0
    repo.finish()
    repoList.add repo
    #loader.objects.finish repo.get "name"

  else
    #loader.objects.finish data.name

loader.req = ->
  progress.start()
  loadAll()
  ###$.ajax
    url: "http://registry.npmjs.org/-/_view/byKeyword?startkey=[%22gulpplugin%22]&endkey=[%22gulpplugin%22,{}]&group_level=3"
    dataType: "jsonp"
    success: plugins
  $.ajax
    url: "http://registry.npmjs.org/-/_view/byKeyword?startkey=[%22gulfriendly%22]&endkey=[%22gulpfriendly%22,{}]&group_level=3"
    dataType: "jsonp"
    success: plugins###

# DEPRECATED #
###
# add a plugin list
plugins = (data) ->
  for row in data.rows
    do (row) ->

      name = row.key.slice(1)[0]

      $.ajax
        url: "http://isaacs.iriscouch.com/registry/" + name + ""
        dataType: "jsonp"
        success: fetch

      loader.objects.track name


toISO = (date) -> date.toISOString().slice 0, 10

today = new Date
todayISO = toISO today
lastMonth = new Date today.getFullYear(), today.getMonth() - 1, today.getDate()
lastMonthISO = toISO lastMonth###
