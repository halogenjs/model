describe("Hyperbone model", function(){

	describe("Environment", function(){

		it("can require the hyperbone module", function(){

			var Model = require('hyperbone-model').Model;

			expect(Model).to.exist;

			var m = new Model({ _link: { self : { href : "/test"}}});

			expect(m).to.be.okay;

			expect( function(){ return new Model({}) } ).to.throw(new Error("Invalid hypermedia: No self href"));

		});

	});

	describe("Embedding", function(){



	});

	describe("Link handling", function(){

		var Model = require('hyperbone-model').Model;

		it("can set and get the correct self href", function(){

			var m = new Model({ _links : { self : { href : "/test" }} });

			m.url().should.equal("/test");
			m.rel("self").should.equal("/test");

		});

		it("can understand curie", function(){

			var m = new Model(fixtures['/services_curie']);

			m.rel("app:test").should.equal("/services/test");
			m.rel("app:helloworld").should.equal("/services/helloworld");

			m.fullRel("app:test").should.equal("/services/rels/test");
			m.fullRel("app:helloworld").should.equal("/services/rels/helloworld");

		});

		it("can understand curies", function(){

			var m = new Model(fixtures['/services_curies']);

			m.rel("app:test").should.equal("/services/test");
			m.rel("app:helloworld").should.equal("/services/helloworld");

			m.fullRel("app:test").should.equal("/services/rels/test");
			m.fullRel("app:helloworld").should.equal("/services/rels/helloworld");

		});

		it("can deal with uri templates", function(){

			var m = new Model(fixtures['/services_curie']);

			m.rel("app:thing", { id : "lol"}).should.equal("/services/thing/lol");
			m.rel("app:thing", { id : "rofl"}).should.equal("/services/thing/rolf");

			expect(m.rel("app:thing")).to.Throw();

		});


	});

});