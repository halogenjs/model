var useFixture = require('./fixtures.js');
var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var halogenModel = require('../index.js');

describe("Halogen model", function(){

	describe("Initialisation", function(){

		it("can require the halogen module", function(){

			var Model = halogenModel.Model;

			expect( Model ).to.be.ok;
			expect( new Model({ _links: { self : { href : "/test"}}}) ).to.be.ok;
			expect( new Model({}) ).to.be.ok;

		});

	});

	describe("Attribute setting and getting", function(){
		// built into halogen is the automatic nesting of objects and arrays of objects

		var Model = halogenModel.Model;

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

		var Model = halogenModel.Model;

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
				},
				_commands : {
					'test' : {
						href : '/things',
						method : "POST",
						properties : {
							'hello' : 'world'
						}
					}
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
				},
				_links : {
					self : {
						href : '/tojson.test'
					}
				},
				_commands : {
					test : {
						href : '/things',
						method : "POST",
						properties : {
							'hello' : 'world'
						}
					}
				}

			});

		});


	});

	describe("Embedding", function(){

		var Model = halogenModel.Model;

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

		var Model = halogenModel.Model;

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

		var Model = halogenModel.Model;

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
			expect( m.command('edit').get('href') ).to.equal('/create');

		});

		it("returns supports multiple rel conventions", function(){

			// not entirely sure what the spec is here. Personally believe that 
			// internal rels should use a hash symbol, as it's a fragment.

			var m = new Model({
				_links : {
					"cmds:one" : {
						href : "#_commands/create"
					},
					"cmds:two" : {
						href : "#commands/create"
					},
					"cmds:three" : {
						href : "#command/create"
					}
				},
				_commands : {
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

			});

			expect( m.command("cmds:one").get("href") ).to.equal("/create");

			expect( m.command("cmds:two").get("href") ).to.equal("/create");

			expect( m.command("cmds:two").get("href") ).to.equal("/create");

		});

		it("Exposes a properties method for acessing the properties directly", function(){

			var m = new Model({
				_commands : {
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

			});

			var properties = m.command('create').properties();

			expect(properties.get('name')).to.equal('Default');

		});

		it("can pull data from the parent model", function(){

			var m = new Model({
				name : "Not default",
				description : "Not default description",
				bugger : 'this',
				_commands : {
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

			});

			var cmd = m.command('create');
			var properties = cmd.properties();

			cmd.pull();

			expect(properties.get('name')).to.equal('Not default');
			expect(properties.get('description')).to.equal('Not default description');
			expect(properties.get('bugger')).to.equal(null);

		});

		it("can push data to the parent model", function(){

			var m = new Model({
				name : "Not default",
				description : "Not default description",
				bugger : 'this',
				_commands : {
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

			});

			var cmd = m.command('create');
			var properties = cmd.properties();

			cmd.push();

			expect(m.get('name')).to.equal('Default');
			expect(m.get('description')).to.equal('Default description');
			expect(m.get('bugger')).to.equal('this');

		});

		it('can push data to another command', function(){

			var m = new Model({
				name : "Not default",
				description : "Not default description",
				bugger : 'this',
				_commands : {
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

			});

			m.command('other-create').pushTo( m.command('create') );

			var props = m.command('create').properties();

			expect( props.get('name') ).to.equal('Something else');
			expect( props.get('description') ).to.equal('Flip and blast!');
			expect( props.get('randomness') ).to.equal(null);

		});

		it("can pull data from another command", function(){

			var m = new Model({
				name : "Not default",
				description : "Not default description",
				bugger : 'this',
				_commands : {
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

			});

			m.command('other-create').pullFrom( m.command('create') );

			var props = m.command('other-create').properties();

			expect( props.get('name') ).to.equal('Default');
			expect( props.get('description') ).to.equal('Default description');
			expect( props.get('randomness') ).to.equal( 'Hello!' );

		});

		it("can access a property with .property()", function(){

			var m = new Model({
				_commands : {
					test : {
						href : "/whatever",
						method : "POST",
						properties : {
							staticproperty : "hello",
							dynamicproperty : ""
						}
					}
				}

			});

			expect( m.command('test').property('staticproperty') ).to.equal('hello');

		});

		it("can remove properties from commands if the comand changes", function(){

			var m = new Model({
				_commands : {
					test : {
						href : "/whatever",
						method : "POST",
						properties : {
							staticproperty : "",
							dynamicproperty : ""
						}
					}
				}

			});

			expect( m.command('test').property('dynamicproperty') ).to.equal("");

			m.reinit({
				_commands : {
					test : {
						href : "/whatever",
						method : "POST",
						properties : {
							staticproperty : ""
						}
					}
				}				
			});

			expect( m.command('test').property('dynamicproperty') ).to.equal(null);

		});

		it("publishes an event when the structure of a command changes", function (done){

			var m = new Model({
				_commands : {
					test : {
						href : "/whatever",
						method : "POST",
						properties : {
							staticproperty : "",
							dynamicproperty : ""
						}
					}
				}

			});

			m.on('change-command-structure:test', function (){

				done();

			});

			m.reinit({
				_commands : {
					test : {
						href : "/whatever",
						method : "POST",
						properties : {
							staticproperty : ""
						}
					}
				}				
			});

		});

		it('has a special getter for command properties', function (){

			var m = new Model({
				_commands : {
					test : {
						href : "/whatever",
						method : "POST",
						properties : {
							staticproperty : "hello",
							dynamicproperty : ""
						}
					}
				}

			});

			expect( m.getCommandProperty('test.staticproperty') ).to.equal('hello');

		});

		it('has a special setter for command properties', function (){

			var m = new Model({
				_commands : {
					test : {
						href : "/whatever",
						method : "POST",
						properties : {
							staticproperty : "hello",
							dynamicproperty : ""
						}
					}
				}

			});

			m.setCommandProperty('test.staticproperty', 'goodbye'); 

			expect( m.getCommandProperty('test.staticproperty') ).to.equal('goodbye');

		});

		describe("Dirty/clean command extensions", function(){

			it("Model publishes a clean event when a command is clean", function (done){

				var m = new Model();

				m.on('clean:test', function(){

					expect(m.getCommandProperty('test.staticproperty')).to.equal('Hello');

					done();

				});

				m.reinit({
					_commands : {
						test : {
							href : "/whatever",
							method : "POST",
							properties : {
								staticproperty : "Hello",
								dynamicproperty : "World"
							}
						}

					}
				});

			});

			it("Model publishes a dirty event when a command is changed", function (done){

				var m = new Model({
					_commands : {
						test : {
							href : "/whatever",
							method : "POST",
							properties : {
								staticproperty : "Hello",
								dynamicproperty : "World"
							}
						}

					}
				});

				m.on('dirty:test', function(){

					expect(m.getCommandProperty('test.dynamicproperty')).to.equal('Wotcha wabbit!');

					done();

				});

				m.setCommandProperty('test.dynamicproperty', 'Wotcha wabbit!');

			});

			it("has a clean method which restores them to initial state", function (){

				var m = new Model({
					_commands : {
						test : {
							href : "/whatever",
							method : "POST",
							properties : {
								staticproperty : "Hello",
								dynamicproperty : "World"
							}
						}

					}
				});

				m.setCommandProperty('test.dynamicproperty', 'Wotcha wabbit!');

				m.command('test').clean();

				expect( m.getCommandProperty('test.dynamicproperty') ).to.equal('World');

			});

			it("fires a clean event after cleaning when using clean()", function(done){

				var m = new Model({
					_commands : {
						test : {
							href : "/whatever",
							method : "POST",
							properties : {
								staticproperty : "Hello",
								dynamicproperty : "World"
							}
						}

					}
				});

				m.on('clean:test', function(){

					expect(m.getCommandProperty('test.dynamicproperty')).to.equal('World');

					done();

				})

				m.setCommandProperty('test.dynamicproperty', 'Wotcha wabbit!');

				m.command('test').clean();

			})

			it("uses the clean state from the last reinit() rather than initial state", function (){

				var m = new Model({
					_commands : {
						test : {
							href : "/whatever",
							method : "POST",
							properties : {
								staticproperty : "Hello",
								dynamicproperty : "World"
							}
						}

					}
				});

				m.reinit({
					_commands : {
						test : {
							href : "/whatever",
							method : "POST",
							properties : {
								staticproperty : "Hello",
								dynamicproperty : "Wotcha wabbit!"
							}
						}
					}
				});

				expect( m.getCommandProperty('test.dynamicproperty') ).to.equal('Wotcha wabbit!');

				m.setCommandProperty('test.dynamicproperty', 'Something else');

				m.command('test').clean();

				expect( m.getCommandProperty('test.dynamicproperty') ).to.equal('Wotcha wabbit!');

			});

			it("can be cleaned by triggering a clean event", function (){

				var m = new Model({
					_commands : {
						test : {
							href : "/whatever",
							method : "POST",
							properties : {
								staticproperty : "Hello",
								dynamicproperty : "World"
							}
						}

					}
				});

				m.setCommandProperty('test.dynamicproperty', 'Something else');

				m.command('test').trigger('clean');

				expect( m.getCommandProperty('test.dynamicproperty') ).to.equal('World');

			});

		});

	});

	describe("Reloading hypermedia", function(){

		var Model = halogenModel.Model;

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
					test : {
						method : 'PUT',
						href : "/test",
						properties : {
							"test" : "From Model"
						}
					}
				}
			});

			var cmd = m.command('test');

			expect( cmd.properties().get('test') ).to.equal('From Model');

			cmd.get('properties').on('change:test', function(){

				// reference to cmd should still be valid if the event has fired.
				expect(cmd.properties().get('test') ).to.equal('From New Data');
				done();

			});

			m.reinit({
				"otherThing" : 'From New Data',
				_commands : {
					test : {
						method : 'PUT',
						href : '/test',
						properties : {
							'test' : 'From New Data'
						}
					}
				}
			});

		});

	});

	describe("Pre-parsing", function(){

		var Model = halogenModel.Model;

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

	describe("Nested collections", function(){

		var Model = halogenModel.Model;

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

	describe("Evented links (Issue #2)", function(){

		var Model = halogenModel.Model;

		it('should issue a add-rel event when a new rel is found', function( done ){

			var m = new Model();

			m.on('add-rel:self', function(){

				expect( m.rel('self') ).to.equal('/test');
				done();

			});

			m.set({
				_links : {
					self : {
						href : "/test"
					}
				}
			});

		});

		it('should issue a remove-rel event when a new rel is found', function( done ){

			var m = new Model({
				_links : {
					self : {
						href : "/self"
					},
					extra : {
						href : "/extra"
					}
				}
			});

			m.on('remove-rel:extra', function(){

				expect( m.rel('extra') ).to.equal( '' );
				done();

			});

			m.set({
				_links : {
					self : {
						href : "/self"
					}
				}
			});

		});


		it('should issue a change-rel event when a rel is changed', function( done ){

			var m = new Model({
				_links : {
					self : {
						href : "/self"
					}
				}
			});

			m.on('change-rel:self', function(){

				expect( m.rel('self') ).to.equal( '/transformed' );
				done();

			});

			m.set({
				_links : {
					self : {
						href : "/transformed"
					}
				}
			});

		});

	});

	describe("Evented commands (issue #6)", function(){

		var Model = halogenModel.Model;

		it('should issue a add-command event when a command is found', function( done ){

			var m = new Model();

			m.on('add-command:some-command', function(){

				expect( m.command('some-command') ).to.be.ok;
				done();

			});

			m.set({
				_commands : {
					'some-command' : {
						href : '/test', 
						properties : {}
					}
				}
			});

		});

		it('should issue a remove-command event when a command is removed', function( done ){

			var m = new Model({
				_commands : {
					'some-command' : {
						href: '/test',
						properties : {}
					}
				}
			});

			m.on('remove-command:some-command', function(){

				expect( m.command('some-command') ).to.not.be.ok;
				done();

			});

			m.set({
				_commands : {
				}
			});

		});

	});

	describe("syncCommands flag: Keeping commands in sync with the parent model automatically", function(){

		var Model = halogenModel.Model;

		it('automatically updates all identically named command properties that have the same value as the parent model on initialisation', function(){

			var m = new Model({
				syncCommands : true,
				_commands : {
					'test1' : {
						method : 'socket',
						href : '/execute-test',
						properties : {
							'Foo' : 'Hello',
							_method : "PUT"
						}

					},
					'test2' : {
						method : 'PUT',
						href : '/execute-test-2',
						properties : {
							'Foo' : 'Hello',
							'Bar' : 'World'
						}
					},
					'test3' : {
						method : 'POST',
						href : '/execute-test-3',
						properties : {
							'Foo' : '',
							'Bar' : ''
						}
					}
				},
				'Foo' : 'Hello',
				'Bar' : 'World'
			});

			m.set('Foo', 'Push this to the commands');
			m.set('Bar', 'Also this')

			// pushes to test1 and test2 because they had the same value, 'Hello', when the model was
			// initialised
			expect( m.command('test1').properties().get('Foo') ).to.equal('Push this to the commands');
			expect( m.command('test2').properties().get('Foo') ).to.equal('Push this to the commands');
			expect( m.command('test2').properties().get('Bar') ).to.equal('Also this');

			// Does not push to test3.properties.Foo because that had a different value. They cannot and
			// should not be automatically paired.
			expect( m.command('test3').properties().get('Foo') ).to.equal('');
			expect( m.command('test3').properties().get('Bar') ).to.equal('');

		});

		it('automatically propagates changes to the parent model and to other commands when ', function(){

		
			var m = new Model({
				syncCommands : true,
				_commands : {
					'test1' : {
						method : 'socket',
						href : '/execute-test',
						properties : {
							'Foo' : 'Hello',
							_method : "PUT"
						}

					},
					'test2' : {
						method : 'PUT',
						href : '/execute-test-2',
						properties : {
							'Foo' : 'Hello',
							'Bar' : 'World'
						}
					},
					'test3' : {
						method : 'POST',
						href : '/execute-test-3',
						properties : {
							'Foo' : '',
							'Bar' : ''
						}
					}
				},
				'Foo' : 'Hello',
				'Bar' : 'World'
			});

			m.command('test1').properties().set('Foo', 'Push this to the parent and other commands');
			m.command('test2').properties().set('Bar', 'Also this')

			// pushes to parent.Foo and test2.properties.Foo because they all had the same value for Foo, 'Hello', when the model was
			// initialised
			expect( m.get('Foo') ).to.equal('Push this to the parent and other commands');
			expect( m.command('test2').properties().get('Foo') ).to.equal('Push this to the parent and other commands');


			expect( m.get('Bar') ).to.equal('Also this');

			// Does not push to test3.properties.Foo because that had a different value. They cannot and
			// should not be automatically paired.
			expect( m.command('test3').properties().get('Foo') ).to.equal('');
			expect( m.command('test3').properties().get('Bar') ).to.equal('');

		});

		it("isn't sick on itself if a command gets removed later on", function(){

			var m = new Model({
				syncCommands : true,
				_commands : {
					'test1' : {
						method : 'socket',
						href : '/execute-test',
						properties : {
							'Foo' : 'Hello',
							_method : "PUT"
						}

					},
					'test2' : {
						method : 'PUT',
						href : '/execute-test-2',
						properties : {
							'Foo' : 'Hello',
							'Bar' : 'World'
						}
					},
					'test3' : {
						method : 'POST',
						href : '/execute-test-3',
						properties : {
							'Foo' : '',
							'Bar' : ''
						}
					}
				},
				'Foo' : 'Hello',
				'Bar' : 'World'
			});

			m.reinit({
				'Foo' : 'Hello',
				'Bar' : 'World',
				_commands : {

				}
			});

			m.set('Foo', 'This should not throw an error');

		});

		it("can sync with commands that appear later on.. ", function(){

			// initial state, no commands...
			var m = new Model({
				'Foo' : '',
				'Bar' : '',
				_commands : {
					
				},
				syncCommands : true
			});

			// new initial state, lots of commands
			m.reinit({
				_commands : {
					'test1' : {
						method : 'socket',
						href : '/execute-test',
						properties : {
							'Foo' : 'Hello',
							_method : "PUT"
						}

					},
					'test2' : {
						method : 'PUT',
						href : '/execute-test-2',
						properties : {
							'Foo' : 'Hello',
							'Bar' : 'World'
						}
					},
					'test3' : {
						method : 'POST',
						href : '/execute-test-3',
						properties : {
							'Foo' : '',
							'Bar' : ''
						}
					}
				},
				'Foo' : 'Hello',
				'Bar' : 'World'
			});

			m.set('Foo', 'Push this to the commands');
			m.set('Bar', 'Also this');

						// pushes to test1 and test2 because they had the same value, 'Hello', when the model was
			// initialised
			expect( m.command('test1').properties().get('Foo') ).to.equal('Push this to the commands');
			expect( m.command('test2').properties().get('Foo') ).to.equal('Push this to the commands');
			expect( m.command('test2').properties().get('Bar') ).to.equal('Also this');


			m.command('test1').properties().set('Foo', 'Push this to the parent and other commands');
			m.command('test2').properties().set('Bar', 'Also this')

			// pushes to parent.Foo and test2.properties.Foo because they all had the same value for Foo, 'Hello', when the model was
			// initialised
			expect( m.get('Foo') ).to.equal('Push this to the parent and other commands');
			expect( m.command('test2').properties().get('Foo') ).to.equal('Push this to the parent and other commands');


			expect( m.get('Bar') ).to.equal('Also this');
		});


	});

	describe("Issues", function(){

		var Model = halogenModel.Model;

		it('should not throw an error when an unknown rel is requested (issue #4)', function(){

			var m = new Model();

			expect( m.rel('something') ).to.equal( "" );

		});

		it('correctly updates the properties of a command loaded from _embedded (issue #5)', function(){

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

		it('converts collections into array literals when reinited with an array literal', function(){

			var m = new Model({
				test : []
			});

			m.set('test', ['array literal please']);

			expect(m.get('test')).to.deep.equal(['array literal please']);

		});

		it('it can convert an array literal into a collection', function(){

			var m = new Model({
				test : []
			});

			m.set('test', ['array literal please']);

			expect(m.get('test')).to.deep.equal(['array literal please']);

			m.set('test', [{ name : 'array literal please'}]);

			expect(m.get('test[0].name')).to.equal('array literal please');

		});


	})

});