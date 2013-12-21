(function () {

  // initialization
  var app = window.app = {
    load: {}
  };

  // models
  var Repo = Backbone.Model.extend({
    fetchGH: function () {

    }
  });

  var RepoList = Backbone.Collection.extend({
    model: Repo
  });

  var repos = new RepoList();

  // views
  var RepoView = Backbone.View.extend({
    el: '.list-view',
    template: _.template
  });

  // data fetching
  var repoEvents = {};
  _.extend(repoEvents, Backbone.Events);

  var couchMap = function (data) {
    return data.rows.map(function (x) {
      return x.key.slice(1)[0];
    });
  };

  // add a plugin
  window.app.load.plugins = function (data) {
    repoEvents.trigger('got', couchMap(data));
  };

  // fetch most of data
  window.app.load.fetch = function (data) {
    var obj = {};

    obj.name = data.name;

    obj.description = data.description;

    obj.version = data['dist-tags'].latest;

    if(data.repository) {
      var url = data.repository.url;
      var regexp = /github\.com(.*)/;
      obj.repo = regexp.exec(url)[1].slice(1).replace(/\.git$/, '');
      obj.repoUrl = 'https://github.com/' + obj.repo;
    } else {
      obj.repo = false;
    }

    obj.url = 'https://npmjs.org/package/' + obj.name;

    obj.type = data.versions[obj.version].keywords.filter(function (x) {
      return x === 'gulpplugin' || x === 'gulpfriendly';
    })[0];

    obj.author = data.author.name;
    var r = new Repo(obj);
    repos.add(r);
  };

  repoEvents.on('got', function (data) {
    data.forEach(function (name) {
      $.ajax({
        url: 'http://isaacs.iriscouch.org/registry/' + name + '/?callback=app.load.fetch',
        dataType: 'jsonp'
      });
    });
  });

  var pluginList = $('.plugin-list');

  var pluginTemplate = _.template(
    '<div id="plugin-${name}" class="row plugin panel panel-default">' +
      '<div class="col-md-1">' +
        '<span class="star-icon glyphicon glyphicon-star center-block"></span> ' +
        '<p class="text-center"><span class="label label-info">&gt; 9000</span></p>' +
      '</div>' +
      '<div class="col-md-11">' +
        '<h3>' +
          '<a href="${url}">${name}</a>' +
          '<small class="pull-right">' +
            ' repo <a href="${repoUrl}">${repo}</a>' +
          '</small>' +
        '</h3>' +
        '<p class="description">${description}</p>' +
      '</div>' +
    '</div>'
  );

  repos.on('add', function (obj) {
    pluginList.append(pluginTemplate({
      name: obj.get('name'),
      description: obj.get('description'),
      author: obj.get('author'),
      url: obj.get('url'),
      repo: obj.get('repo'),
      repoUrl: obj.get('repoUrl')
    }));
  });

})();