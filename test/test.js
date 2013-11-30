describe("Hyperbone model", function(){

	describe("Initialisation", function(){

		it("can require the hyperbone module", function(){

			var Model = require('hyperbone-model').Model;

			expect( Model ).to.be.ok;
			expect( new Model({ _links: { self : { href : "/test"}}}) ).to.be.ok;
			expect( new Model({}) ).to.be.ok;

		});

	});

	describe("Attribute setting and getting", function(){
		// built into hyperbone is the automatic nesting of objects and arrays of objects

		var Model = require('hyperbone-model').Model;

		it("does the usual backbone shit with bog standard attributes", function(){

			var m = new Model({ _links : { self : { href : "/test"}}, name : "lol", description : "test"});

			expect( m.get("name") ).to.equal("lol");
			expect( m.get("description") ).to.equal("test");

		});

		it("turns objects into models", function(){

			var m = new Model( useFixture('/attribute-test') );

			expect( m.get("anObject").get("name") ).to.equal("name inside an object");
			expect( m.get("anObject").get("description") ).to.equal("description inside an object");
			expect( function(){m.get("anObject").url();} ).to.throw("Not a hypermedia resource");

		});

		it("triggers correct change events when child model changed", function( done ){

			var m = new Model( useFixture('/attribute-test') );

			m.on("change:anObject", function(){

				expect( m.get("anObject").get("name") ).to.equal("lol I changed the name");

				done();

			});

			m.get("anObject").set("name", "lol I changed the name");

		});

		it("turns objects into specific models", function(){

			var Test = Model.extend({ defaults : { lol : "rofl"} });

			var EmbedTest = Model.extend({ _prototypes : { "test" : Test }});

			var m = new EmbedTest({ "test" : { rofl : "lol"}, _links : { self : { href : "/test"}}});

			expect( m.get("test").get("lol") ).to.equal("rofl");

		});


		it("turns arrays of objects into collections", function(){

			var m = new Model( useFixture('/attribute-test') );

			expect( m.get("anArrayofObjects").length ).to.equal(3);
			expect( m.get("anArrayofObjects").at(0).get("name") ).to.equal("obj 1");
			expect( function(){ m.get("anArrayofObjects").at(0).url();} ).to.throw("Not a hypermedia resource");

		});

		it("triggers the correct change events when a model in a collection is changed", function( done ){

			var m = new Model( useFixture('/attribute-test') );

			var o = m.get("anArrayofObjects");

			m.on("change:anArrayofObjects", function(){

				expect( m.get("anArrayofObjects").at(0).get("name") ).to.equal("lol I changed the name");
				done();

			});

			o.at(0).set("name", "lol I changed the name");

		});

		it("can return a nested attribute through dot notation", function(){

			var m = new Model( useFixture('/attribute-test') );

			expect( m.get("anObject.name") ).to.equal("name inside an object");

		});

		it("can return a model at an index in a collection through [0] notation", function(){

			var m = new Model( useFixture('/attribute-test') );

			expect( m.get("anArrayofObjects[0]").get("name") ).to.equal("obj 1");

			expect( m.get("anArrayofObjects[0].name") ).to.equal("obj 1");

		});

		it("can deal with dot notation to access deeply nested models attributes", function(){

			var m = new Model({
				foo : {
					bar : {
						kbo : {
							lol : "rofl!"
						}
					}
				}
			});

			expect( m.get("foo.bar.kbo.lol") ).to.equal("rofl!");

		});

		it("can deal with dot notation to set deeply nested models attributes", function(){

			var m = new Model({
				foo : {
					bar : {
						kbo : {
							lol : "rofl!"
						}
					}
				}
			});

			m.set("foo.bar.kbo.lol", "hello");

			// by default this creates a new attribute called 'foo.bar.kbo.lol' 
			// so to test this we need to access it via chaining to make sure
			// the correct object has been set
			expect( m.get("foo.bar.kbo").get("lol") ).to.equal("hello");

		});


		it("can deal with dot and [n] notation to access deeply nested models attributes", function(){

			var m = new Model({
				foo : {
					bar : [
						{
							kbo : {
								lol : "rofl!"
							}
						},
						{
							kbo : {
								lol : "haha!"
							},
						},
						{
							kbo : {
								lol : "chuckles"
							}
						}
					]
				}
			});

			expect( m.get("foo.bar[1].kbo.lol") ).to.equal("haha!");
			expect( m.get("foo.bar[2].kbo").get('lol') ).to.equal("chuckles");

		});

		it("It updates nested models, not overwriting, allowing events to be triggered", function(done){

			var m = new Model({
				foo : {
					bar : {
						kbo : "lol"
					}
				}
			});

			m.get("foo.bar").on("change:kbo", function(){

				expect( m.get("foo.bar.kbo") ).to.equal("rofl");

				done();

			});

			m.set({ foo : { bar : { kbo : "rofl"}}});

		});

		it("It updates models inside nested collections, not overwriting, allowing events to be triggered", function(done){

			var m = new Model({
				foo : [
					{
						bar : {
							kbo : "lol"
						}
					},
					{
						bar : {
							kbo : "haha"
						}
					}
				]
			});

			m.get("foo[0].bar").on('change:hbo', function(){

				expect(this.get('hbo')).to.equal('chuckles');
				done();

			});


			m.get("foo[0].bar").set('hbo', 'chuckles');

		});

		it("Doesn't traverse into models, just copies a reference", function(){

			var m = new Model({
				foo : {
					bar : {
						kbo : "lol"
					}
				}
			});

			var b = new Model({
				cake : {
					lie : "true"
				}
			});

			expect( m.set("sub", { el : "hello",  }) ).to.be.ok;

		});

		it("allows traversing into objects to be disabled with options.", function(){

			var m = new Model({});

			var body = document.getElementsByTagName('body')[0];

			m.set("body", body, { noTraverse : true});

			expect( m.get("body") ).to.equal(body);

		});

	});

	describe("To JSON", function(){

		var Model = require('hyperbone-model').Model;

		it("Successfully serialises itself back to JSON", function(){

			var m = new Model({
				_links : {
					self : {
						href : '/tojson.test'
					}
				},
				_embedded : {
					"thing" : {
						name : "A thing",
						description: "Hello"
					}
				},
				stuff : [
					{
						name : "hi",
						value : 1234
					},
					{
						name : "howdy",
						value : 4352
					}
				],
				test : "Hello",
				lol : {
					brand : "google",
					app : "mail"
				}
			});

			var json = m.toJSON();

			expect(m.toJSON()).to.deep.equal({
				thing : {
					name : "A thing",
					description : "Hello"
				},
				stuff : [
					{
						name : "hi",
						value : 1234
					},
					{
						name : "howdy",
						value : 4352
					}
				],
				test : "Hello",
				lol : {
					brand : "google",
					app : "mail"
				}
			});

		});


	});

	describe("Embedding", function(){

		var Model = require('hyperbone-model').Model;

		it("turns a single embedded object into an attribute", function(){

			var m = new Model( useFixture('/embed-test') );

			expect( m.get("single-item").url() ).to.equal("/single-item");
			expect( m.get("single-item").get("name") ).to.equal("single item");

		});

		it("turns an array of embedded objects into a collection of models", function(){

			var m = new Model( useFixture('/embed-test') );

			expect( m.get("multiple-items").length ).to.equal(3);

		});

		it("Allows use of non-default model for embedded models", function(){

			var Test = Model.extend({ defaults : { lol : "rofl"} });

			var EmbedTest = Model.extend({ _prototypes : { "test" : Test }});

			var m = new EmbedTest({
				_links : {
					self : {
						href : "/test"
					}
				},
				_embedded : {
					"test" : {
						rofl : "lol"
					}
				}
			});

			expect( m.get("test").get("lol") ).to.equal("rofl");
			expect( m.get("test").get("rofl") ).to.equal("lol");

		});

		it("can dynamically create a collection with a pre-defined model from embeddeds", function(){

			var Test = Model.extend({ defaults : { lol : "rofl"} });

			var EmbedTest = Model.extend({ _prototypes : { "tests" : Test }});

			var m = new EmbedTest({
				_links : {
					self : {
						href : "/tests"
					}
				},
				_embedded : {
					"tests" : [
						{
							rofl : "lmao"
						},
						{
							rofl : "lulz"
						},
						{
							rofl : "hehe"
						}
					]
				}
			});

			expect( m.get("tests").at(0).get("lol") ).to.equal("rofl");
			expect( m.get("tests").at(1).get("lol") ).to.equal("rofl");
			expect( m.get("tests").at(2).get("lol") ).to.equal("rofl");

			expect( m.get("tests").at(0).get("rofl") ).to.equal("lmao");
			expect( m.get("tests").at(1).get("rofl") ).to.equal("lulz");
			expect( m.get("tests").at(2).get("rofl") ).to.equal("hehe");


		});

	});

	describe("Link handling", function(){

		var Model = require('hyperbone-model').Model;

		it("can set and get the correct self href", function(){

			var m = new Model({ _links : { self : { href : "/test" }} });

			expect( m.url() ).to.equal("/test");
			expect( m.rel("self") ).to.equal("/test");

		});

		it("can get a self.href from url()", function(){

			var m = new Model({ _links : { self : { href : "/test" }} });

			m.url('/not-test');

			expect( m.url() ).to.equal("/not-test");
			expect( m.rel("self") ).to.equal("/not-test");

		});

		it("can get a self.href from url()", function(){

			var m = new Model({});

			m.url('/not-test');

			expect( m.url() ).to.equal("/not-test");
			expect( m.rel("self") ).to.equal("/not-test");

		});

		it("can set and get other rels", function(){

			var m = new Model( useFixture('/services_curie') );

			expect( m.rel("app:test") ).to.equal("/services/test");

		});

		it("returns all rels for self discovery purposes", function(){

			var m = new Model( useFixture('/services_curie') );

			var rels = m.rels();

			expect( rels.self.href ).to.equal("/services");
			expect( rels.curie.href ).to.equal("/services/rels/{rel}");

		});

		it("can deal with uri templates", function(){

			var m = new Model( useFixture('/services_curie') );

			expect( function(){ m.rel("app:thing" ); } ).to.throw("No data provided to expand templated uri");
			expect( m.rel("app:thing", { id: "lol" }) ).to.equal("/services/thing/lol");

		});

		it("can handle arrays of links", function(){

			var m = new Model({ _links : {
					self : {
						href : "/test"
					},
					others : [
						{
							href : "/one"
						},
						{
							href : "/two"
						},
						{
							href : "/three"
						}
					]
				}
			});

			expect( m.rel('others').length ).to.equal(3);
			expect( m.rel('others')[1].href ).to.equal('/two');

		});

		it("automatically collapses arrays of one", function(){

			var m = new Model({ _links : {
					self : {
						href : "/test"
					},
					others : [
						{
							href : "/one"
						}
					]
				}
			});

			expect( m.rel('others') ).to.equal('/one');

		});

		it("can understand curie", function(){

			var m = new Model( useFixture('/services_curie') );

			m.rel("app:test").should.equal("/services/test");
			m.rel("app:helloworld").should.equal("/services/helloworld");

			m.fullyQualifiedRel("app:test").should.equal("/services/rels/test");
			m.fullyQualifiedRel("app:helloworld").should.equal("/services/rels/helloworld");

		});

		it("can understand curies", function(){

			var m = new Model( useFixture('/services_curies') );

			m.rel("app:test").should.equal("/services/test");
			m.rel("app:helloworld").should.equal("/services/helloworld");

			m.fullyQualifiedRel("app:test").should.equal("/services/rels/test");
			m.fullyQualifiedRel("app:helloworld").should.equal("/services/rels/helloworld");

		});


	});

	describe("Commands", function(){

		var Model = require('hyperbone-model').Model;

		it("does not add _commands as attributes - reserved property", function(){

			var m = new Model( useFixture('/tasklist') );

			expect( m.get("_commands") ).to.not.be.ok;

		});

		it("returns a command via a rel", function(){

			var m = new Model( useFixture('/tasklist') );

			expect( m.command("cmds:create-new") ).to.be.ok;
			expect( m.get("task[0]").command("cmds:complete") ).to.be.ok;

		});

		it("supports commands nested at the root of _commands", function(){

			var m = new Model({
				_links : {
					"cmds:test" : {
						href : "#_commands/edit"
					}
				},
				_commands: {
					edit : {
							href: "/create",
							method : "POST",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								name : "Default",
								description : "Default"
							}
					}
				}

			});

			expect( m.command("cmds:test").get("href") ).to.equal("/create");

		});

		it("supports deeply nested commands", function(){

			var m = new Model({
				_links : {
					"cmds:test" : {
						href : "#_commands/edit/test/indirection"
					}
				},
				_commands : {
					edit : {
						test : {
							indirection : {
								href: "/create",
								method : "POST",
								encoding : "application/x-www-form-urlencoded",
								properties : {
									name : "Default",
									description : "Default"

								}
							}
						}
					}
				}

			});

			expect( m.command("cmds:test").get("href") ).to.equal("/create");

		});

		it("returns supports multiple rel conventions", function(){

			// not entirely sure what the spec is here. Personally believe that 
			// internal rels should use a hash symbol, as it's a fragment.

			var m = new Model({
				_links : {
					"cmds:one" : {
						href : "#_commands/edit/create"
					},
					"cmds:two" : {
						href : "#commands/edit/create"
					},
					"cmds:three" : {
						href : "#command/edit/create"
					}
				},
				_commands : {
					edit : {
						create : {
							href: "/create",
							method : "POST",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								name : "Default",
								description : "Default"

							}
						}

					}
				}

			});

			expect( m.command("cmds:one").get("href") ).to.equal("/create");

			expect( m.command("cmds:two").get("href") ).to.equal("/create");

			expect( m.command("cmds:two").get("href") ).to.equal("/create");

		});

		it("returns a command via a direct reference", function(){

			var m = new Model( useFixture('/tasklist') );

			expect( m.command("edit.create-task") ).to.be.ok;
			expect( m.get("task[0]").command("edit.edit-task") ).to.be.ok;

		});

		it("Exposes a properties method for acessing the properties directly", function(){

			var m = new Model({
				_links : {
					"cmds:two" : {
						href : "#_commands/edit/create"
					}
				},
				_commands : {
					edit : {
						create : {
							href: "/create",
							method : "POST",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								name : "Default",
								description : "Default description"
							}
						}

					}
				}

			});

			var properties = m.command('cmds:two').properties();

			expect(properties.get('name')).to.equal('Default');

		});

		it("can pull data from the parent model", function(){

			var m = new Model({
				_links : {
					"cmds:two" : {
						href : "#_commands/edit/create"
					}
				},
				name : "Not default",
				description : "Not default description",
				bugger : 'this',
				_commands : {
					edit : {
						create : {
							href: "/create",
							method : "POST",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								name : "Default",
								description : "Default description"
							}
						}

					}
				}

			});

			var cmd = m.command('cmds:two');
			var properties = cmd.properties();

			cmd.pull();

			expect(properties.get('name')).to.equal('Not default');
			expect(properties.get('description')).to.equal('Not default description');
			expect(properties.get('bugger')).to.equal(null);

		});

		it("can push data to the parent model", function(){

				var m = new Model({
				_links : {
					"cmds:two" : {
						href : "#_commands/edit/create"
					}
				},
				name : "Not default",
				description : "Not default description",
				bugger : 'this',
				_commands : {
					edit : {
						create : {
							href: "/create",
							method : "POST",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								name : "Default",
								description : "Default description"
							}
						}

					}
				}

			});

			var cmd = m.command('cmds:two');
			var properties = cmd.properties();

			cmd.push();

			expect(m.get('name')).to.equal('Default');
			expect(m.get('description')).to.equal('Default description');
			expect(m.get('bugger')).to.equal('this');

		});

		it('can push data to another command', function(){

			var m = new Model({
				_links : {
					"cmds:two" : {
						href : "#_commands/edit/create"
					},
					"cmds:one" : {
						href : "#_commands/edit/other-create"
					}
				},
				name : "Not default",
				description : "Not default description",
				bugger : 'this',
				_commands : {
					edit : {
						create : {
							href: "/create",
							method : "POST",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								name : "Default",
								description : "Default description"
							}
						},
						"other-create" : {
							href : "/other-create",
							method : "PUT",
							properties : {
								name : "Something else",
								description : "Flip and blast!",
								randomness : "Hello!"
							}
						}

					}
				}

			});

			m.command('cmds:one').pushTo( m.command('cmds:two') );

			var props = m.command('cmds:two').properties();

			expect( props.get('name') ).to.equal('Something else');
			expect( props.get('description') ).to.equal('Flip and blast!');
			expect( props.get('randomness') ).to.equal(null);

		});

		it("can pull data from another command", function(){

			var m = new Model({
				_links : {
					"cmds:two" : {
						href : "#_commands/edit/create"
					},
					"cmds:one" : {
						href : "#_commands/edit/other-create"
					}
				},
				name : "Not default",
				description : "Not default description",
				bugger : 'this',
				_commands : {
					edit : {
						create : {
							href: "/create",
							method : "POST",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								name : "Default",
								description : "Default description"
							}
						},
						"other-create" : {
							href : "/other-create",
							method : "PUT",
							properties : {
								name : "Something else",
								description : "Flip and blast!",
								randomness : "Hello!"
							}
						}

					}
				}

			});

			m.command('cmds:two').pullFrom( m.command('cmds:one') );

			var props = m.command('cmds:two').properties();

			expect( props.get('name') ).to.equal('Something else');
			expect( props.get('description') ).to.equal('Flip and blast!');
			expect( props.get('randomness') ).to.equal(null);

		});

	});

	describe("Reloading hypermedia", function(){

		var Model = require('hyperbone-model').Model;

		it("Has a reset method", function(){

			var m = new Model({});

			expect( m.reinit ).to.be.a('function');

		});

		it("Returns properties to their defaults", function(){

			var Proto = Model.extend({
				defaults : {
					"test" : "From Model",
					"collection" : []
				}
			});

			var m = new Proto({
				otherThing : 'From Data'
			});

			expect(m.get('test')).to.equal('From Model');
			expect(m.get('otherThing')).to.equal('From Data');
			expect(m.get('collection').length).to.equal(0);

			m.set('test', 'From Code');
			expect(m.get('test')).to.equal('From Code');

			m.set('collection', [{ test : 'From Code'}]);

			expect(m.get('collection').length).to.equal(1);

			m.reinit({
				otherThing : 'From New Data'
			});

			expect(m.get('test')).to.equal('From Model');
			expect(m.get('collection').length).to.equal(0);

		});

		it("It triggers change events for properties", function( done ){

			var Proto = Model.extend({
				defaults : {
					"test" : "From Model"
				}
			});

			var m = new Proto({
				otherThing : 'From Data'
			});

			m.set('test', 'From Code');

			var count = 0;

			m.on({
				'change:otherThing change:test' : function(val){
					count++;

					if(count === 2){
						
						expect(m.get('test')).to.equal('From Model');
						expect(m.get('otherThing')).to.equal('From New Data');

						done();

					}

				}

			});

			m.reinit({
				otherThing : "From New Data"
			});

		});

		it("Also triggers change events for non-default command properties", function(done){

			var Proto = Model.extend({
				defaults : {
					"test" : "From Model"
				}
			});

			var m = new Proto({
				"otherThing" : 'From Data',
				_commands : {
					flip : {
						test : {
							method : 'PUT',
							href : "/test",
							properties : {
								"test" : "From Model"
							}
						}
					}
				}
			});

			var cmd = m.command('flip.test');

			expect( cmd.properties().get('test') ).to.equal('From Model');

			cmd.get('properties').on('change:test', function(){

				// reference to cmd should still be valid if the event has fired.
				expect(cmd.properties().get('test') ).to.equal('From New Data');
				done();

			});

			m.reinit({
				"otherThing" : 'From New Data',
				_commands : {
					flip : {
						test : {
							method : 'PUT',
							href : '/test',
							properties : {
								'test' : 'From New Data'
							}
						}
					}
				}
			});

		});

	});

	describe("Pre-parsing", function(){

		var Model = require('hyperbone-model').Model;

		it("allows a preParser to be defined", function(){

			var ParsedModel = Model.extend({
				parser : function( source ){
					return { _links : {self : {href : source.url }}};
				}
			});

			var m = new ParsedModel({ url : '/hello-world' });

			expect(m.url()).to.equal('/hello-world');
		});

	});

	describe("Reinitialising embedded commands", function(){

		var Model = require('hyperbone-model').Model;
		it('correctly updates the properties of a command loaded from _embedded', function(){

			var m = new Model({
				_embedded : {
					thing : [{
						_commands : {
							test : {
								href : '/test',
								properties : {
									one : 'original',
									two : 'original'
								}
							}
						}
					}]
				}
			});

			m.reinit({
				_embedded : {
					thing : [{
						_commands : {
							test : {
								href : '/test',
								properties : {
									one : 'transformed',
									two : 'transformed'
								}
							}
						}
					}]
				}
			});

			expect( m.get('thing').at(0).command('test').properties().get('one') ).to.equal('transformed');
			expect( m.get('thing').at(0).command('test').properties().get('two') ).to.equal('transformed');

		});

	});

	describe("Nested collections", function(){

		var Model = require('hyperbone-model').Model;

		it('issues reset event when the collection is emptied', function( done ){

			var m = new Model({
				collection : [
					{
						value : 'test'
					}
				]
			});

			m.on('reset:collection', function(){

				expect(m.get('collection').length).to.equal(0);
				done();

			});

			m.set('collection', []);

		});


		it('issues change events when a model in a collection is updated (when passed array)', function( done ){

			var m = new Model({
				collection : [
					{
						value : 'test'
					}
				]
			});

			m.get('collection').at(0).on('change', function(){

				expect(this.get('value')).to.equal('transformed');
				done();

			});

			m.set('collection', [{ value : 'transformed'}]);		

		});


		it('issues change events when a model in a collection is updated (when passed single object)', function( done ){

			var m = new Model({
				collection : [
					{
						value : 'test'
					}
				]
			});

			m.get('collection').at(0).on('change', function(){

				expect(this.get('value')).to.equal('transformed');
				done();

			});

			m.set('collection', { value : 'transformed'});		

		});

		it('issues add event when a model is added', function( done ){

			var m = new Model({
				collection : [
					{
						value : 'test'
					}
				]
			});

			m.get('collection').on('add', function(){

				expect(this.at(0).get('value')).to.equal('transformed');
				expect(this.at(1).get('value')).to.equal('brand new');
				done();

			});

			m.set('collection', [{ value : 'transformed'}, { value : 'brand new'}]);			

		});

		it('issues a remove event when a model is removed', function(){

			var m = new Model({
				collection : [
					{
						value : 'test'
					}
				]
			});

			m.get('collection').on('remove', function(){

				expect(this.length).to.equal(0);
				done();

			});

			m.set('collection', []);	

		});

	});

});