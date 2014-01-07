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

var HyperboneModel = function HyperboneModel (attributes, options){

  // we override the initial function because we need to force a hypermedia parse at the
  // instantiation stage, not just the fetch/sync stage

  attributes || (attributes = {}); // this will cause a throw later on...

  this._links = {};
  this.attributes = {};
  this.cid = _.uniqueId('c');

  this.isHyperbone = true;

  if (!this._prototypes) this._prototypes = {};
  if (!this.syncCommands) this.syncCommands = false;

  options || (options = {});

  if ( attributes._prototypes ){
    _.extend( this._prototypes, attributes._prototypes );
    delete attributes._prototypes;
  }

  if( attributes.syncCommands){ 
    this.syncCommands = true;
    this.syncEvents = []; // we keep a reference to any handlers we make so we can delete the old
                          // ones if the model get reinitialised
    delete attributes.syncCommands;
  }

  if ( options && options.collection ){
    this.collection = options.collection;
  }

  // this parser is for turning the source input into compatible hypermedia.
  if( this.parser ){
    attributes = this.parser( attributes );
  }

  attributes = _.defaults({}, attributes, _.result(this, 'defaults'));

  this.set(attributes, {silent : true});

  if(this.syncCommands){
    this.reinitCommandSync();
  }

  this.changed = {};
  this.initialize.apply(this, arguments);

};

_.extend(HyperboneModel.prototype, BackboneModel.prototype, {

  reinit : function reinitialiseModel ( attributes, options ){

    attributes = _.defaults({}, attributes, _.result(this, 'defaults'));

    if(this.parser) attributes = this.parser(attributes);

    this.set(attributes);

    if(this.syncCommands){
      this.reinitCommandSync();
    }

  },

  reinitCommandSync : function reinitCommands (){

    var self = this;
    // unsubscribe any existing sync handlers...
    _.each(self.syncEvents, function(obj){
      self.off(obj.event, obj.handler);
    });

    self.syncEvents = [];

    _.each(self.attributes, function(val, attr){
      // only interested in backbone style top level key values.
      if (self._commands && !_.isObject(val)){
        _.each(self._commands.attributes, function( cmd ){
          var props = cmd.properties();
          if (props.get(attr) === val){
            // we have a pair!!!
            var ev = {
              event : 'change:' + attr,
              handler : function(model, newVal){
                var curVal = props.get(attr);
                if (curVal !== newVal){
                  props.set(attr, newVal);
                }
              }
            };
            props.on(ev.event, function(model, newVal){
              var curVal = self.get(attr);
              if(curVal !== newVal){
                self.set(attr, newVal);
              }
            });
            self.on(ev.event, ev.handler);
            self.syncEvents.push(ev);
          }
        });
      }
    });

  },

  parseHypermedia : function parseHypermedia( attributes ){

    var self = this, signals = [];

    // update existing links for existing models
    if(attributes._links && this._links){

      _.each(attributes._links, function(val, id){
        if(!this._links[id]){
          signals.push(function(){
              self.trigger('add-rel:' + id);
          });
        } else {
          if(val.href !== this._links[id].href){
            signals.push(function(){
              self.trigger('change-rel:' + id);
            });
          }
        }
        this._links[id] = val;
      }, this);
      _.each(this._links, function(val, id){
        if(!attributes._links[id]){
          signals.push(function(){
            delete self._links[id];
            self.trigger('remove-rel:' + id);
          });
        }
      }, this);
    } else {
      this._links = attributes._links || {};
    }
    delete attributes._links;

    this._curies = {};

    var curies = this._links['curie'] ? [this._links['curie']] : (this._links['curies'] ? this._links['curies'] : null);

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

      } else if(_.isArray(link)){

        _.each(link, function(link, id){

          if (link.templated){
            link.template = makeTemplate( link.href );
          }

        });

      } else if (link.templated){
          link.template = makeTemplate( link.href );
      }

    }, this);

    // make templates
    _.each(this._links, function(link, id){

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
        this._commands = new HyperboneModel();
      } else {
        // find any deleted commands and delete them...
        _.each(this._commands.attributes, function(cmd, id){
          if(!attributes._commands[id]){
            signals.push(function(){
              self.command(id).reset();
              delete self._commands.attributes[id];
              self.trigger('remove-command:' + id);
            });
          }
        })
      }

      _.each(attributes._commands, function(cmd, id){

        // is it an existing command?
        var currentCmd;
        if(currentCmd = this.command(id)){ // assignment on purpose. DO NOT FIX.
          _.each(cmd, function(value, key){
            if (key !== 'properties'){
              currentCmd.set(key, value);
            } else {
              _.each(currentCmd.properties().toJSON(), function (currentValue, key){
                if(!value[key]){
                  currentCmd.properties().unset(key, null);
                }                
              });
              _.each(value, function(value, key){
                currentCmd.properties().set(key, value);
              });
            }
          });
          if(!cmd.href){
            currentCmd.set('href', self.url(), { silent : true });
          }
          currentCmd._isClean = true;
          currentCmd._clean = currentCmd.properties().toJSON();
          signals.push(function(){
            self.trigger('clean:' + id);
          });
        } else {
        // a new command?
          this._commands.set(id, new Command(cmd));
          var newCmd = this.command(id);
          newCmd._parentModel = self;
          newCmd._hbId = id;
          _.each(newCmd.properties().attributes, function(value, key){
            newCmd.properties().on("change:" + key, function(properties, value){
              self.trigger('change:' + key + ":" + id, newCmd, value);
              newCmd._isClean = false;
              self.trigger('dirty:' + id);
            });
          });
          if (!cmd.href){
            newCmd.set("href", self.url(), { silent : true});
          }
          newCmd._isClean = true;
          newCmd._clean = newCmd.properties().toJSON();
          signals.push(function(){
            self.trigger('add-command:' + id);
            // it's brand new so it's always clean.
            self.trigger('clean:' + id);
          });

        }

      }, this);

      delete attributes._commands;
    }

     _.each(signals, function( fn ){
      fn();
    });

    return attributes;

  },

  toJSON : function toJSON (){

    var obj = {};
    _.each(this.attributes, function(attr, key){

      if (attr && attr.isHyperbone){
        obj[key] = attr.toJSON();
      } else if(attr || attr === 0 || attr === "") {
        obj[key] = attr;
      } else {
        obj[key] = "";
      }

    }, this);

    if(!_.isEmpty(this._links)){
      obj._links = this.rels();
    }
    
    if(this._commands){
      obj._commands = this._commands.toJSON();
    }

    return obj;

  },

  url : function getUrl ( uri ){

    if ( uri ){

      _.extend(this._links, {
        self : { href : uri }
      });

      return this;

    } else {

      if (this._links.self && this._links.self.href){

        return this._links.self.href;

      }

      throw new Error("Not a hypermedia resource");

    }

  },

  get: function hyperboneGet (attr) {

    if (this.attributes[attr] || this.attributes[attr] === 0 || this.attributes[attr] === ""){ 

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

  set: function hyperboneSet (key, val, options) {

    var self = this;

    if(key && (key._links || key._commands || key._embedded)){
      key = this.parseHypermedia(key);
    }

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

    // Recursively call set on nested models and collections, if we're not
    // a brand new model
    if(!_.isEmpty(this.attributes)){
      _.each(attrs, function(value, key){
        // is it an object that currently exists in this model?
        if (_.isObject(value) && current[key] && current[key].isHyperbone){
          // is it an array, and we have a matching collection?
          if (_.isArray(value) || current[key].models){

              var Proto;
              // if we have a collection but it's not an array, make it an array
              value = (_.isArray(value) ? value : [value]);

              var nonObjects = _.reduce(value, function(memo, val){ 
                if(!_.isObject(val)){ 
                  return memo + 1;
                } else {
                  return memo; 
                }
              }, 0);
              
              if(nonObjects === 0){

                // if we have an array but current[key]is a model, make it a collection
                if(current[key].attributes){
                  if (this._prototypes[key]){
                    Proto = this._prototypes[key];
                  } else {
                    Proto = HyperboneModel;
                  }
                  // we want the default model to be a hyperbone model
                  // or whatever the user has selected as a prototype
                  var EmbeddedCollection = Collection.extend({
                    model : Proto
                  });
                  // create an embedded collection..
                  var collection = new EmbeddedCollection();
                  collection.add(current[key]);
                  current[key] = collection;
                }

                // if the existing collection or the array has no members...
                if (value.length === 0 || current[key].length === 0){
                  // call reset to minimise the number of events fired
                  current[key].reset(value);
                // or if they have the same number of members we want 'change' events for 
                // every model in the collection.
                } else if (current[key].length === value.length){
                  // we do a straight change operation on each
                  current[key].each(function(model, index){
                    model.set(value[index]);
                  });
                // or if there's more in our collection than the array..
                } else if (current[key].length > value.length){
                  // we need to remove some models
                  var destroyers = [];
                   current[key].each(function(model, index){
                    if(value[index]){
                      model.set(value[index]);
                    } else {
                      destroyers.push(function(){current[key].remove(model);});
                    }
                  });
                  _.each(destroyers, function(fn){fn();});
                // or if there's less in our collection than the array...
                } else {
                  // we need to add some models
                  _.each(value, function(value, index){
                    if (current[key].at(index)){
                      current[key].at(index).set(value);
                    } else {
                      current[key].add(value);
                    }
                  });
                }

                delete attrs[key];

              }
            // clean up attributes
            
          } else {
            // it exists in the current model, but it's not an array 
            // so this is quite straightforward : recurse into set
            current[key].set(value);
            delete attrs[key];
          }
        }
        
      }, this);
    }
    // having dealt with updating any nested models/collections, we 
    // now do set for attributes for this particular model
    _.each(attrs, function(val, attr){
      // is the request a dot notation request?
      if (attr.indexOf('.') !== -1 && !ignoreDotNotation){
        // break it up, recusively call set..
        parts = attr.split('.');
        attr = parts.pop();
        var path = parts.join('.');
        this.get(path).set(attr, val);
        
      } else {
        // is val an object?
        if (_.isObject(val) && !_.isArray(val)){
          // is it a plain old javascript object?
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
            if(!val._trigger){
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
          }
        } else if (_.isArray(val)){
          // we only want to convert a an array of objects
          // into a nested collection. Anything else is just added
          // as a javascript array.
          var containsJustObjects = true;

          _.each(val, function( element ){
            // deliberately making a function within a loop here
            if (!_.isObject(element)) containsJustObjects = false;
          });
          if (containsJustObjects){
            var elements = [];
            // sort out our prototype
            if (this._prototypes[attr]){
              Proto = this._prototypes[attr];
            } else {
              Proto = HyperboneModel;
            }
            // we want the default model to be a hyperbone model
            // or whatever the user has selected as a prototype
            var EmbeddedCollection = Collection.extend({
              model : Proto
            });
            // create an embedded collection..
            var collection = new EmbeddedCollection();
            // add the array. Call reset so that we only get one event.
            collection.reset(val);
            // override the trigger method so we can efficently
            // cascade events to the parent model
            collection._trigger = collection.trigger;
            collection.trigger = function(attr){
              return function(){
                var args = Array.prototype.slice.call(arguments, 0);
                this._trigger.apply(this, args);
                args[0] = args[0] + ":" + attr;
                self.trigger.apply(self, args);
              };
            }(attr);
            // update the reference to val
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
    }, this);
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

  rel : function getRel ( rel, data ){

    var link = this._links[rel] || {};
    if (!link) throw new Error("No such rel found");
    if (link.templated){
      if (!data) throw new Error("No data provided to expand templated uri");
      return link.template.expand( data );
    }
    if(this._links && this._links[rel]) return this._links[rel].href ? this._links[rel].href : this._links[rel];
    return "";
  },

  rels : function listRels (){
    return this._links;
  },

  fullyQualifiedRel : function getFullyQualifiedRel ( rel ){
    var parts = rel.split(":");
    return this._curies[ parts[0] ].expand({ rel : parts[1] });
  },

  command : function getCommand ( key ){
    var command;
    if (this._links[key] && this._commands){
      var parts = this._links[key].href.split(/\//g);
      if (parts[0] === "#_commands" || parts[0] === "#commands" || parts[0] === "#command") parts = parts.slice(1);
      command = this._commands.get( parts.join('.') );
    } else if(this._commands){
      command = this._commands.get( key );
    }
    if (command) return command;
    return null;
  },

  getCommandProperty : function getCommandProperty ( key ){

    var bits = key.split('.');
    return this.command(bits[0]).get('properties').get(bits[1]);

  },

  setCommandProperty : function setCommandProperty ( key, value ){

    var bits = key.split('.');
    this.command(bits[0]).get('properties').set(bits[1], value);
    return this;

  }

});

HyperboneModel.extend = BackboneModel.extend;

Command = HyperboneModel.extend({

  defaults : {
    method : "",
    href : "",
    properties : {}
  },
  initialize : function(){
    var self = this;
    this.on('clean', function(){
      if(!self._isClean){
        self.properties().set(self._clean);
        self._isClean = true;
        self._parentModel.trigger('clean:' + self._hbId);
      }
    });
  },
  reset : function(){
    // completely remove all bound events before destroying.
    this.off();
    this.properties().off();
  },
  clean : function(){
    this.trigger('clean');
    return this;
  },
  properties : function(){
    return this.get('properties');
  },
  property : function(prop){
    return this.get('properties').get(prop);
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
      if(input.get(key)){
        output.set(key, input.get(key));
      }
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