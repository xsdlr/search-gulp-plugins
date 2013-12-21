(function () {

  // models
  var Repo = Backbone.Model.extend({
    initialize: function () {
      this.set('noRepo',
        this.get('repo') === '' ? 'none' : '');
      this.set('typeColor',
        this.get('type') === 'gulpplugin' ? 'info' : 'success');
      this.set('info', this.get('description') + this.get('name') + this.get('version') + this.get('type') + this.get('repo'));
      this.set('visible', true);
      this.on('change', function () {
        store.set(this.get('name'), this);
      });
    },
    rendered: function () {
      var self = this;
      var children = $(listView.el).children();
      return children.filter(function (index) {
        return $(this).attr('data-plugin-id') == self.cid;
      }).size() != 0;
    }
  });

  var RepoList = Backbone.Collection.extend({
    initialize: function () {
      this.on('add', function (model) {
        store.set(model.get('name'), model);
      });
      this.comparator = 'name';
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
      this.collection.on('add', this.render, this);
      this.collection.on('sort', this.render, this);
    },

    render: function () {
      var $el = $(this.el);
      var self = this;

      _(this.collection.models)
        .filter(function (plugin) {
          return !plugin.rendered();
        }).each(function (plugin) {
          var item = new RepoListItemView({model: plugin});
          $el.append(item.render().el);
          self.total +=1;
        });

      return this;
    }
  });

  var listView = new RepoListView();

  var pluginTemplate = _.template(
    '<div class="col-md-1">' +
      '<span class="star-icon glyphicon glyphicon-star center-block"></span> ' +
      '<div class="text-center"><span class="label label-default">&gt; 9000</span></div>' +
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
    }
  });

  // storage
  store.forEach(function(key, val) {
    var r = new Repo(val);
    r.set('visible', true);
    repos.add(r);
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
      });
  };

  // fetch data
  var fetch = function (data) {
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
      obj.repo = '';
      obj.repoUrl = '';
    }

    obj.url = 'https://npmjs.org/package/' + obj.name;

    obj.type = data.versions[obj.version].keywords.filter(function (x) {
      return x === 'gulpplugin' || x === 'gulpfriendly';
    })[0];

    if(_(store.getAll()).keys().contains(obj.name)) {
      _.find(repos.models, function (x) {
        return x.get('name') === obj.name;
      }).set(obj);
    } else {
      var r = new Repo(obj);
      repos.add(r);
    }

  };

  var req = function () {
    console.log('refreshing plugins...');
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

  $(function () {
    setTimeout(req, 50);
  });

  // refresh every 20 seconds
  setInterval(req, 20 * 1000);

})();