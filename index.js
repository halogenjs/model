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
	isHyperbone : true	
});
var makeTemplate = require('uritemplate').parse;

var HyperboneModel = function(attributes, options){

	// we override the initial function because we need to force a hypermedia parse at the
	// instantiation stage, not just the fetch/sync stage

	attributes || (attributes = {}); // this will cause a throw later on...

	this.attributes = {};
    this.cid = _.uniqueId('c');

    this.isHyperbone = true;

    if(!this._prototypes) this._prototypes = {};

	options || (options = {});

	if( attributes._prototypes ){
		_.extend( this._prototypes, attributes._prototypes );
		delete attributes._prototypes;
	}

	if( options && options.collection ){
		this.collection = options.collection;
	}

	if( options && options.parse ){
		attributes = this.parse( this.parseHypermedia( attributes ) );
	} else {
		attributes = this.parseHypermedia( attributes ) ;
	}

    attributes = _.defaults({}, attributes, _.result(this, 'defaults'));

    // need to override the set method, methinks.
    this.set(attributes, {silent: true});

    this.changed = {};
    this.initialize.apply(this, arguments);

};

_.extend(HyperboneModel.prototype, BackboneModel.prototype, {

	parseHypermedia : function( attributes ){

		// parse links
		this._links = attributes._links || {};
		delete attributes._links;

		this._curies = {};

		var curies = (  this._links ? this._links['curie'] ? [this._links['curie']] : (this._links['curies'] ? this._links['curies'] : null) : null  );

		if(curies){

			_.each(curies, function(curie){

				if(!curie.templated) throw new Error("A curie without a template? What are you thinking?");

				this._curies[curie.name] = makeTemplate(curie.href);

			}, this);

		}

		// collapse unnecessary arrays. 
		_.each(this._links, function(link, id){

			if(_.isArray(link) && link.length === 1){

				this._links[id] = link[0];

			}

			if(link.templated){

				link.template = makeTemplate( link.href );

			}

		}, this);

		if(attributes._embedded){

			_.each(attributes._embedded, function(val, attr){

				attributes[attr] = val;

			});

			delete attributes._embedded;

		}

		return attributes;

	},

	url : function(){

		if(this._links.self && this._links.self.href){

			return this._links.self.href;

		}

		throw new Error("Not a hypermedia resource");

	},

	set: function(key, val, options) {

		var self = this;

		var attr, attrs, unset, changes, silent, changing, prev, current, Proto;
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
		this._changing  = true;

		if (!changing) {
			this._previousAttributes = _.clone(this.attributes);
			this.changed = {};
		}
		current = this.attributes, prev = this._previousAttributes;

		// Check for changes of `id`.
		if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

		// For each `set` attribute, update or delete the current value

		for (attr in attrs) {

	    	val = attrs[attr];

	    	if(_.isObject(val) && !_.isArray(val)){

				if(!val.isHyperbone){

					if(this._prototypes[attr]){

						Proto = this._prototypes[attr];

					} else {

						Proto = HyperboneModel;

					}

					val = new Proto( val );

				}

				val.on("change", (function(attr){

					return function(){

						self.trigger('change:' + attr, this);
						self.trigger('change', this);

					}

				}(attr)));

			} else if(_.isArray(val)){

				var containsJustObjects = true;

				_.each(val, function( element ){

					if(!_.isObject(element)) containsJustObjects = false;

				});

				if(containsJustObjects){

					var elements = [];

					if(this._prototypes[attr]){

						Proto = this._prototypes[attr];

					} else {

						Proto = HyperboneModel;

					}

					var EmbeddedCollection = Collection.extend({

						model : Proto

					});

					var collection = new EmbeddedCollection();

					_.each(val, function( element, id ){

						elements.push( element );

					}, this);

					collection.add(elements);

					collection.on("change", function(){

						self.trigger("change:" + attr, this);

					});

					val = collection;

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

		if(!link){

			throw new Error("No such rel found");

		}

		if(link.templated){

			if(!data){

				throw new Error("No data provided to expand templated uri");

			}else{

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

		return this._curies[ parts[0] ].expand({ rel : parts[1] })

	}

});

HyperboneModel.extend = BackboneModel.extend;

module.exports.Model = HyperboneModel;
module.exports.Collection = Collection;