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
			expect( function(){m.get("anObject").url()} ).to.throw("Not a hypermedia resource");

		});		

		it("triggers correct change events when child model changed", function( done ){

			var m = new Model( useFixture('/attribute-test') );

			m.on("change", function(){

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
			expect( function(){ m.get("anArrayofObjects").at(0).url()} ).to.throw("Not a hypermedia resource");

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

			expect( m.get("multiple-items").length ).to.equal(3)

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


		})

	});

	describe("Link handling", function(){

		var Model = require('hyperbone-model').Model;

		it("can set and get the correct self href", function(){

			var m = new Model({ _links : { self : { href : "/test" }} });

			expect( m.url() ).to.equal("/test");
			expect( m.rel("self") ).to.equal("/test");

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

			expect( function(){ m.rel("app:thing" ) } ).to.throw("No data provided to expand templated uri");
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

		})

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

	describe

});