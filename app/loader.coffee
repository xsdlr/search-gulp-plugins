progress = require 'progress'
Repo = require 'models/repo/repo'
repoList = require 'models/repo/repoList'

class Loader

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

module.exports = appLoader = new Loader

# add a plugin list
plugins = (data) ->
  for row in data.rows
    do (row) ->

      name = row.key.slice(1)[0]

      $.ajax
        url: "http://isaacs.iriscouch.org/registry/" + name + ""
        dataType: "jsonp"
        success: fetch

      appLoader.objects.track name


today = new Date
todayISO = today.toISOString().slice(0, 10)
startMonth = new Date(today.getFullYear(), today.getMonth())
startMonthISO = startMonth.toISOString().slice(0, 10)

# fetch data
fetch = (data) ->
  repo = new Repo()
  if repoList.pluck("name").indexOf(data.name) is -1
    repo.set "name", data.name
    repo.set "description", data.description
    repo.set "version", data["dist-tags"].latest
    if data.repository
      url = data.repository.url
      regexp = /github\.com(.*)/
      repo.set "repo", regexp.exec(url)[1].slice(1).replace(/\.git$/, "")
      repo.set "repoUrl", "https://github.com/" + repo.get("repo")
    else
      url = data.versions[repo.get("version")].homepage
      if url and url.indexOf("github") isnt -1
        regexp = /github\.com(.*)/
        repo.set "repo", regexp.exec(url)[1].slice(1).replace(/\.git$/, "")
        repo.set "repoUrl", "https://github.com/" + repo.get("repo")
      else
        repo.set "repo", ""
        repo.set "repoUrl", ""
    repo.set "url", "https://npmjs.org/package/" + repo.get("name")
    repo.set "type", data.versions[repo.get("version")].keywords.filter((x) ->
      x is "gulpplugin" or x is "gulpfriendly"
    )[0]
    repo.set "downloads", 0
    repo.finish()
    repoList.add repo
    $.ajax
      url: "http://isaacs.iriscouch.com/downloads/_design/app/_view/pkg?startkey=[%22" + repo.get("name") + "%22,%20%22" + startMonthISO + "%22]&endkey=[%22" + repo.get("name") + "%22,%20%22" + todayISO + "%22]&group_level=1"
      dataType: "jsonp"
      success: (data) ->
        repo.set "downloads", data.rows[0].value  if data.rows[0]
        appLoader.objects.finish repo.get "name"

  else
    appLoader.objects.finish data.name

appLoader.req = ->
  progress.start()
  $.ajax
    url: "http://registry.npmjs.org/-/_view/byKeyword?startkey=[%22gulpplugin%22]&endkey=[%22gulpplugin%22,{}]&group_level=3"
    dataType: "jsonp"
    success: plugins

  $.ajax
    url: "http://registry.npmjs.org/-/_view/byKeyword?startkey=[%22gulpfriendly%22]&endkey=[%22gulpfriendly%22,{}]&group_level=3"
    dataType: "jsonp"
    success: plugins