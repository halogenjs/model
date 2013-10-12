describe("Hyperbone model", function(){

	describe("Environment", function(){

		it("can require the hyperbone module", function(){

			var Model = require('hyperbone-model').Model;

			should.exist(Model);

		});

	});

});