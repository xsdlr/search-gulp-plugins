(function () {

  // models
  var Repo = Backbone.Model.extend({
    finish: function () {
      this.set('noRepo',
        this.get('repo') === '' ? 'none' : '');
      this.set('typeColor',
        this.get('type') === 'gulpplugin' ? 'info' : 'success');
      this.set('info', this.get('description') + this.get('name') + this.get('version') + this.get('type') + this.get('repo'));
      this.set('visible', true);
    }
  });

  var RepoList = Backbone.Collection.extend({
    initialize: function () {
      this.comparator = function (model) {
        return -model.get('downloads');
      };
    },
    model: Repo
  });

  var repos = new RepoList();

  // views

  // search
  var SearchView = Backbone.View.extend({
    el: '.plugin-search',

    events: {
      'keyup': 'search'
    },

    search: function () {
      var $el = $(this.el);
      var query = $el.val();
      if(query == '') {
        infoView.searched = false;
        _(repos.models).forEach(function (plugin) {
          plugin.set('visible',true);
        });
      } else {
        infoView.searched = true;
        _(repos.models).filter(function (plugin) {
          return plugin.get('info').indexOf(query) != -1;
        }).forEach(function (plugin) {
            plugin.set('visible', true);
          });
        _(repos.models).filter(function (plugin) {
          return plugin.get('info').indexOf(query) == -1;
        }).forEach(function (plugin) {
            plugin.set('visible', false);
          });
      }
    }

  });

  var searchView = new SearchView();

  // info
  var InfoView = Backbone.View.extend({
    el: '.plugin-info .count',

    template: _.template('${count} ${term}'),

    initialize: function () {
      repos.on('change add', this.render, this);
      this.searched = false;
      this.render();
    },

    render: function () {
      var $el = $(this.el);
      var params = {};
      params.count = repos.filter(function (x) {
        return x.get('visible');
      }).length;
      if(this.searched) {
        params.term = 'matching plugin';
      } else {
        params.term = 'plugin';
      }
      if(params.count != 1) {
        params.term += 's';
      }
      $el.html(this.template(params));
      return this;
    }
  });

  var infoView = new InfoView();

  var RepoListView = Backbone.View.extend({
    el: '.plugin-list',
    tagName: 'div',
    className: 'container',
    total: 0,

    collection: repos,

    initialize: function () {
      this.views = [];
      this.collection.on('sort', this.render, this);
    },

    render: function () {
      var $el = $(this.el);
      var self = this;

      this.views.forEach(function (view) {
        view.remove();
      });
      this.views = [];

      this.collection.each(function (plugin) {

        var item = new RepoListItemView({model: plugin});
        self.views.push(item);
        $el.append(item.render().el);
      });

      return this;
    }
  });

  var listView;

  var pluginTemplate = _.template(
    '<div class="col-md-1">' +
      '<span class="star-icon glyphicon glyphicon-download center-block"></span> ' +
      '<div class="text-center"><span class="label label-default">${downloads}</span></div>' +
    '</div>' +
    '<div class="col-md-11">' +
      '<h3>' +
      '<a href="${url}">${name}</a> ' +
      '<small>version ${version}</small>' +
      '<small class="pull-right">' +
      ' repo <em>${noRepo}</em> <a href="${repoUrl}">${repo}</a>' +
      '</small>' +
      '</h3>' +
      '<p class="description">' +
      '${description}' +
      '<span class="pull-right label label-${typeColor}">${type}</span>' +
      '</p>' +
    '</div>'
  );

  var RepoListItemView = Backbone.View.extend({
    tagName: 'div',
    className: 'row plugin panel panel-default',
    template: pluginTemplate,

    events: {
      'mouseover .npm-input': 'sel',
      'click .npm-input': 'sel',
      'mouseout .npm-input': 'blur'
    },

    initialize: function () {
      this.model.on('change', this.render, this);
      this.model.on('add', this.render, this);
    },

    render: function () {
      var $el = $(this.el);
      $el.attr('data-plugin-id', this.model.cid);
      $el.html(this.template(this.model.toJSON()));
      if(this.model.get('visible')) {
        $el.show();
      } else {
        $el.hide();
      }
      return this;
    },

    sel: function () {
      var $el = $(this.el);
      var $sel = $el.find('.npm-input');
      $sel.select();
      $sel.click(function (e) {
        e.preventDefault();
      });
    },

    blur: function () {
      var $el = $(this.el);
      var $sel = $el.find('.npm-input');
      $sel.blur();
    }
  });

  repos.sort();

  // all for the progress, baby
  NProgress.configure({ trickleRate: 0.17, trickleSpeed: 400 });
  var completed = [];
  completed.events = {};
  _.extend(completed.events, Backbone.Events);

  completed.append = function (obj) {
    completed.push(obj);
    completed.events.trigger('append');
  };

  completed.remove = function (name) {
    completed.splice(completed.indexOf(name), 1);
    completed.events.trigger('remove');
  };

  completed.events.on('remove', function () {
    if(completed.length == 0) {
      completed.events.trigger('done');
    }
  });

  completed.events.on('done', function () {
    NProgress.done();
    repos.sort();
    listView = new RepoListView();
    listView.render();
  });

  // add a plugin list
  var plugins = function (data) {
    _(data.rows)
      .map(function (x) {
        return x.key.slice(1)[0];
      }).each(function (name) {
        $.ajax({
          url: 'http://isaacs.iriscouch.org/registry/' + name + '',
          dataType: 'jsonp',
          success: fetch
        });
        completed.append(name);
      });
  };

  var today = new Date;
  var todayISO = today.toISOString().slice(0, 10);

  var startMonth = new Date(today.getFullYear(), today.getMonth());
  var startMonthISO = startMonth.toISOString().slice(0, 10);

  // fetch data
  var fetch = function (data) {
    var repo = new Repo();
    repos.add(repo);

    repo.set('name', data.name);

    repo.set('description', data.description);

    repo.set('version', data['dist-tags'].latest);

    if(data.repository) {
      var url = data.repository.url;
      var regexp = /github\.com(.*)/;
      repo.set('repo', regexp.exec(url)[1].slice(1).replace(/\.git$/, ''));
      repo.set('repoUrl', 'https://github.com/' + repo.get('repo'));
    } else {
      var url = data.versions[repo.get('version')].homepage;
      if(url && url.indexOf('github') != -1) {
        var regexp = /github\.com(.*)/;
        repo.set('repo', regexp.exec(url)[1].slice(1).replace(/\.git$/, ''));
        repo.set('repoUrl', 'https://github.com/' + repo.get('repo'));
      } else {
        repo.set('repo', '');
        repo.set('repoUrl', '');
      }
    }

    repo.set('url' , 'https://npmjs.org/package/' + repo.get('name'));

    repo.set('type', data.versions[repo.get('version')].keywords.filter(function (x) {
      return x === 'gulpplugin' || x === 'gulpfriendly';
    })[0]);

    repo.finish();

    $.ajax({
      url: 'http://isaacs.iriscouch.com/downloads/_design/app/_view/pkg?startkey=[%22' +
        repo.get('name') +
        '%22,%20%22' + startMonthISO + '%22]&endkey=[%22' +
        repo.get('name') +
        '%22,%20%22' + todayISO + '%22]&group_level=1',
      dataType: 'jsonp',
      success: function (data) {
        if(data.rows[0]) {
          repo.set('downloads', data.rows[0].value);
        }
        else {
          repo.set('downloads', 0);
        }
        completed.remove(repo.get('name'));
      }
    });


  };

  var req = function () {
    NProgress.start();
    $.ajax({
      url: 'http://registry.npmjs.org/-/_view/byKeyword?startkey=[%22gulpplugin%22]&endkey=[%22gulpplugin%22,{}]&group_level=3',
      dataType: 'jsonp',
      success: plugins
    });
    $.ajax({
      url: 'http://registry.npmjs.org/-/_view/byKeyword?startkey=[%22gulpfriendly%22]&endkey=[%22gulpfriendly%22,{}]&group_level=3',
      dataType: 'jsonp',
      success: plugins
    });
  };

  // http://isaacs.iriscouch.com/downloads/_design/app/_view/pkg?startkey=[%22gulp-grunt%22,%20%222013-12-01%22]&endkey=[%22gulp-grunt%22,%20%222013-12-23%22]&group_level=1

  req();

})();