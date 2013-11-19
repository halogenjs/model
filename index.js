/*
 * Hyperbone Model
 * 
 * Author : Charlotte Gore
 * Version : 0.0.1
 * 
 * License: MIT
 */

var _ = require('underscore');
var BackboneModel = require('backbone-model').Model;
var Collection = require('backbone-collection').Collection.extend({
  isHyperbone : true,
  toJSON : function(){
    var arr = [];
    _.each(this.models, function(model, index){
      if (model.isHyperbone){
        arr.push(model.toJSON());
      } else {  
        arr.push(model);
      }

    })
    return arr;
  }
});
var makeTemplate = require('uritemplate').parse;

var Command;

var HyperboneModel = function(attributes, options){

  // we override the initial function because we need to force a hypermedia parse at the
  // instantiation stage, not just the fetch/sync stage

  attributes || (attributes = {}); // this will cause a throw later on...

  this.attributes = {};
  this.cid = _.uniqueId('c');

  this.isHyperbone = true;

  if (!this._prototypes) this._prototypes = {};

  options || (options = {});

  if ( attributes._prototypes ){
    _.extend( this._prototypes, attributes._prototypes );
    delete attributes._prototypes;
  }

  if ( options && options.collection ){
    this.collection = options.collection;
  }

  attributes = _.defaults({}, attributes, _.result(this, 'defaults'));

  if ( options && options.parse ){
    attributes = this.parse( this.parseHypermedia( attributes ) );
  } else {
    attributes = this.parseHypermedia( attributes ) ;
  }

  this.set(attributes, {silent : true});

  this.changed = {};
  this.initialize.apply(this, arguments);

};

_.extend(HyperboneModel.prototype, BackboneModel.prototype, {

  reinit : function( attributes, options ){

    attributes = _.defaults({}, attributes, _.result(this, 'defaults'));

    if ( options && options.parse ){
      attributes = this.parse( this.parseHypermedia( attributes ) );
    } else {
      attributes = this.parseHypermedia( attributes ) ;
    }

    this.set(attributes);

  },

  parseHypermedia : function( attributes ){

    var self = this;

    // parse links
    this._links = attributes._links || {};
    delete attributes._links;

    this._curies = {};

    var curies = (  this._links ? this._links['curie'] ? [this._links['curie']] : (this._links['curies'] ? this._links['curies'] : null) : null  );

    if (curies){

      _.each(curies, function(curie){

        if (!curie.templated) throw new Error("A curie without a template? What are you thinking?");

        this._curies[curie.name] = makeTemplate(curie.href);

      }, this);

    }

    // collapse unnecessary arrays. 
    _.each(this._links, function(link, id){

      if (_.isArray(link) && link.length === 1){

        this._links[id] = link[0];

      }

      if (link.templated){

        link.template = makeTemplate( link.href );

      }

    }, this);

    if (attributes._embedded){

      _.each(attributes._embedded, function(val, attr){

        attributes[attr] = val;

      });

      delete attributes._embedded;

    }

    if (attributes._commands){

      if (!this._commands){
        this._commands = new HyperboneModel()
      }

      var findCommands;

      findCommands = function( obj, parentId){

        var temp = {};

        _.each(obj, function( o, id ){

          var fullId;

          if(parentId){

            fullId = parentId + "." + id;

          } else {

            fullId = id;

          }

          if (o.properties){

            if(self.command(fullId)){

              var cmd = self.command(fullId);

              _.each(o, function(value, key){
                if (key !== 'properties'){
                  cmd.set(key, value);
                } else {
                  
                  _.each(value, function(value, key){
                    cmd.set('properties.' + key, value);
                  })
                }
              });

            }else{

              temp[id] = new Command(o);
              temp[id]._parentModel = self;
              
              _.each(temp[id].properties().attributes, function(value, key){
                temp[id].properties().on("change:" + key, function(properties, value){
                  self.trigger('change:' + key + ":" + id, temp[id], value);
                });
              });

              if (!o.href){

                temp[id].set("href", self.url(), { silent : true});

              }

            }

          } else {

            temp[id] = findCommands(o, fullId);

          }

        });

        return temp;

      }

      this._commands.set(findCommands( attributes._commands ));
      delete attributes._commands;      
    }

    return attributes;

  },

  toJSON : function(){

    var obj = {};
    _.each(this.attributes, function(attr, key){

      if (attr.isHyperbone){
        obj[key] = attr.toJSON();
      } else {
        obj[key] = attr;
      }

    }, this);

    return obj;

  },

  url : function(){

    if (this._links.self && this._links.self.href){

      return this._links.self.href;

    }

    throw new Error("Not a hypermedia resource");

  },

  get: function(attr) {

    if (this.attributes[attr] || this.attributes[attr] === 0){ 

      return this.attributes[attr];

    } else if (_.indexOf(attr, '.')!==-1 || /([a-zA-Z_]+)\[([0-9]+)\]/.test(attr) ){

      var parts = attr.split(".");

      attr = parts.shift();

      var remainder = parts.join('.')

      if (this.attributes[attr]){

        return this.attributes[attr].get( remainder );

      } else {

        parts = attr.match(/([a-zA-Z_]+)\[([0-9]+)\]/);

        if(parts){

          var index = parseInt(parts[2], 10);
          attr = parts[1]

          if (_.isNumber( index ) && this.attributes[attr]){

            if (remainder){

              return this.attributes[ attr ].at( index ).get( remainder );

            } else {

              return this.attributes[ attr ].at( index );

            }

          }

        } else {

          return null;

        }

      }


    }

    return null;

    },

  set: function(key, val, options) {

    var self = this;

    var attr, attrs, unset, changes, silent, changing, prev, current, Proto, parts;
    if (key == null) return this;

    // Handle both `"key", value` and `{key: value}` -style arguments.
    if (typeof key === 'object') {
      attrs = key;
      options = val;
    } else {
      (attrs = {})[key] = val;
    }

    options || (options = {});

    // Run validation.
    if (!this._validate(attrs, options)) return false;

    // Extract attributes and options.
    unset           = options.unset;
    silent          = options.silent;
    changes         = [];
    changing        = this._changing;

    noTraverse    = options.noTraverse || false;
    ignoreDotNotation = options.ignoreDotNotation || false;

    this._changing  = true;

    if (!changing) {
      this._previousAttributes = _.clone(this.attributes);
      this.changed = {};
    }
    current = this.attributes, prev = this._previousAttributes;

    // Check for changes of `id`.
    if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];


    // Recursively call set on nested models and collections
    _.each(attrs, function(value, key){

      if (_.isObject(value) && current[key] && current[key].isHyperbone){

        if (_.isArray(value)){

          // we're adding to a collection
          _.each(value, function( model, index){

            if (current[key].at(index)){

              current[key].at(index).set( model );

            } else {

              current[key].add( model );
              
            }

          });

          delete attrs[key];

        } else {

          current[key].set(value);
          delete attrs[key];
        }

      }
      
    });
  

    for (attr in attrs) {

      if (_.indexOf(attr, ".") !== -1 && !ignoreDotNotation){

        parts = attr.split('.');
        attr = parts.pop();
        var path = parts.join('.');

        this.get(path).set(attr, val);

      } else {

          val = attrs[attr];

          if (_.isObject(val) && !_.isArray(val)){

          if (!val.isHyperbone && !noTraverse){

            if (this._prototypes[attr]){

              Proto = this._prototypes[attr];

            } else {

              Proto = HyperboneModel;

            }

            val = new Proto( val );

            val._parent = self;

          }

          if (val.on){

            val._trigger = val.trigger;
            val.trigger = function(attr){
              return function(){
                var args = Array.prototype.slice.call(arguments, 0);
                this._trigger.apply(this, args);
                args[0] = args[0] + ":" + attr;
                self.trigger.apply(self, args);
              };
            }(attr);

          }

        } else if (_.isArray(val)){

          var containsJustObjects = true;

          _.each(val, function( element ){

            if (!_.isObject(element)) containsJustObjects = false;

          });

          if (containsJustObjects){

            var elements = [];

            if (this._prototypes[attr]){

              Proto = this._prototypes[attr];

            } else {

              Proto = HyperboneModel;

            }

            var EmbeddedCollection = Collection.extend({

              model : Proto

            });

            var collection = new EmbeddedCollection();

            collection._parent = self;

            _.each(val, function( element, id ){

              elements.push( element );

            }, this);

            collection.add(elements);
            
            collection._trigger = collection.trigger;
            collection.trigger = function(attr){
              return function(){
                var args = Array.prototype.slice.call(arguments, 0);
                this._trigger.apply(this, args);
                args[0] = args[0] + ":" + attr;
                self.trigger.apply(self, args);
              };
            }(attr);

            val = collection;
            
          }

        }

        }

      if (!_.isEqual(current[attr], val)) changes.push(attr);
      if (!_.isEqual(prev[attr], val)) {
        this.changed[attr] = val;
      } else {
        delete this.changed[attr];
      }
      unset ? delete current[attr] : current[attr] = val;
    }

  

    // Trigger all relevant attribute changes.
    if (!silent) {
      if (changes.length) this._pending = true;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

    // You might be wondering why there's a `while` loop here. Changes can
    // be recursively nested within `"change"` events.
    if (changing) return this;
    if (!silent) {
      while (this._pending) {
        this._pending = false;
        this.trigger('change', this, options);
      }
    }
    this._pending = false;
    this._changing = false;
    return this;
  },

  rel : function( rel, data ){

    var link = this._links[rel] || {};

    if (!link){

      throw new Error("No such rel found");

    }

    if (link.templated){

      if (!data){

        throw new Error("No data provided to expand templated uri");

      } else {

        return link.template.expand( data );

      }

    }


    return this._links[rel].href ? this._links[rel].href : this._links[rel];

  },

  rels : function(){

    return this._links;

  },

  fullyQualifiedRel : function( rel ){

    var parts = rel.split(":");

    return this._curies[ parts[0] ].expand({ rel : parts[1] });

  },

  command : function( key ){

    var command;

    if (this._links[key]){

      var parts = this._links[key].href.split(/\//g);

      if (parts[0] === "#_commands" || parts[0] === "#commands" || parts[0] === "#command"){

        parts = parts.slice(1);

      }

      command = this._commands.get( parts.join('.') );

    } else {

      command = this._commands.get( key );

    }

    if (command) return command;

    return null;

  }

});

HyperboneModel.extend = BackboneModel.extend;

Command = HyperboneModel.extend({

  defaults : {
    method : "",
    href : "",
    properties : {}
  },
  properties : function(){
    return this.get('properties');
  },
  pushTo : function( command ){
    var output = command.properties();
    var input = this.properties();
    _.each(output.attributes, function( value, key ){
      output.set(key, input.get(key));
    });
    return this;
  },
  pullFrom : function( command ){
    var output = this.properties();
    var input = command.properties();
    _.each(output.attributes, function( value, key ){
      output.set(key, input.get(key));
    });
    return this;
  },
  pull : function(){
    var self = this;
    var props = this.properties();
    _.each(props.attributes, function(value, key){
      props.set(key, self._parentModel.get(key));
    });
  },
  push : function(){
    var self = this;
    var props = this.properties();
    _.each(props.attributes, function(value, key){
      self._parentModel.set(key, value);
    });
  }
});

module.exports.Model = HyperboneModel;
module.exports.Collection = Collection;