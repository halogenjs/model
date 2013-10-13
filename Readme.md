
# Hyperbone Model

  [Backbone](http://backbonejs.org/) Models with [Hypermedia](http://stateless.co/hal_specification.html) Extensions. 

  Classic Backbone models are basically [Active Record](http://en.wikipedia.org/wiki/Active_record_pattern). It's REST level 2. You have a resource and you can do GET, POST, PUT, DELETE on it.
  Awesome. But what if you're using a [REST level 3](http://www.crummy.com/writing/speaking/2008-QCon/act3.html) API? What if you're using Hypermedia?

  What if you want your API to be self discoverable? What if the controls to interact with a resource aren't on the same uri as your resource?

  Well, at this point, Backbone sort of gets in your way a little. 

  Hyperbone Model is a response to this: It takes the useful bits of Backbone for Hypermedia - the Models, Collections and Event (helpfully extracted and made standalone [components](http://component.io) ) and adds Hypermedia extensions.

  It is part of a larger framework for building client-side apps with Hypermedia.

## Features

  - _links support, with 'self' mapped to .url()
  - Curie support with fully qualified rel uri lookup for curied rels
  - support for uri templating to RFC6570, thanks to (Franz Antesberger)[https://github.com/ericgj/uritemplate] )
  - automatic mapping of _embedded data to attributes
  - automatic conversion of objects and arrays of objects to models and collections (including from _embedded) with events cascaded to the parent
  - ability to assign specific Model prototypes for use with specific attributes with custom _prototypes attribute.


## Installation

  Install with [component(1)](http://component.io):

    $ component install green-mesa/hyperbone-model

## API

### Creating a model

Creating a hyperbone model. The minimum valid HAL document contains a _links object, which contains a link to 'self'. A Hyperbone model
cannot be initialised without this minimum data.

```javascript
  var Model = require('hyperbone-model').Model;

  var model = new Model({
    _links : {
      self : {
        href : "/helloworld"
      }
    }

  });

```

### Setting prototypes in advance

By default all objects added as attributes to a model are converted into hyperbone models. Arrays of objects are automatically converted
into Collections of Models. So..

Automatic models... 

```javascript

  var model = new Model({
    _links : {
      self : {
        href : "/helloworld"
      }
    }

  });

  model.set("test", { name : "Test", value : "Testing"});

  expect( model.get("test").get("name") ).to.equal("Test"); // TRUE

```

And automatic collections...

```javascript

  var model = new Model({
    _links : {
      self : {
        href : "/helloworld"
      }
    }

  });

  model.set("test", [{ name : "one"}, { name : "two"}, { name : "three"}]);

  expect( model.get("test").length ).to.equal( 3 ); // TRUE

  model.get("test").each(function( item ){

    console.log(item.get("name"));

  })

  > one
  > two
  > three

```


In addition, events are triggered on the parent model when nested models are manipulated

```javascript

  model.on("change:test", function(){
 
    console.log("Test has been changed!")

  })

  model.get("test").set("name", "Not Test. Something else entirely");

  > Test has been changed!
```

If you want to use a specific model, the API is as follows:

```javascript

  var ModelForThings = Model.extend({
     defaults : {
        "bar" : "ren and stimpy"
     }
  });

  var ModelForResource = Model.extend({
    _prototypes : {
      "things" : ModelForThings
    }
  });

  var model = new ModelForResource({
    _links : { self : { href : "/test"} },
    "things" : {
      "foo" : "bar"
    }
  });

  // model.things is an instance of ModelForThings rather than a default empty model...
  expect( model.get("things").get("bar") ).to.equal( "ren and stimpy" ); // TRUE
```

This applies to _embedded and generic attributes.

The main difference between an model that comes from _embedded and one that's just inside the attributes is that _embedded models have a self.href

```javascript
  
  var m = new Model({
    _links : {
      self : {
        href : "/test"
      }
    },
    _embedded : {
      "foo" : {
        _links : {
          self : {
            href : "/foo/1"
          }
        }
        "bar" : "kbo"
      }
    }

  });

  expect( m.get("foo").url() ).to.equal("/foo/1"); // TRUE

  
```

### .url()

Shortcut to .rel('self');

```javascript
  var model = new Model({
    _links : {
      self : {
        href : "/helloworld"
      }
    }
  });

  expect( model.url() ).to.equal("/helloworld"); // TRUE
```

### .rel( rel [, data])

Get a link to another rel of the resource. If a particular rel is a URI template and `templated: true` is set, then rel
can be used to expand the uri template with the data. There is no particular way of evaluating. 

```javascript
  var model = new Model({
    _links : {
      self : {
        href : "/helloworld"
      },
      test : {
        href : "/test"
      },
      clever : {
        href : "/clever/{ id }",
        templated : true
      }
    }
  });

  expect( model.rel( "self" ) ).to.equal("/helloworld"); // TRUE
  expect( model.rel( "test" ) ).to.equal("/test"); // TRUE
  expect( model.rel( "clever", { id : "lol"} ) ).to.equal("/clever/lol"); // TRUE
```

### .fullyQualifiedRel( rel )

Hyperbone supports curie (and `curies` with an array, incidentally), and offers a neato utility to recover the fully qualitied uri of a curied rel.

```javascript
  var model = new Model({
    _links : {
      self : {
        href : "/helloworld"
      },
      curie : {
        href : "http://www.helloworld.com/rels/{rel}",
        name : "rofl",
        templated : true
      },
      "rofl:test" : {
        href : "/test"
      }
    }
  });

  expect( model.rel( "rofl:test" ) ).to.equal("/test"); // TRUE
  expect( model.fullyQualitiedRel( "rofl:test" ) ).to.equal("http://www.helloworld.com/rels/test"); // TRUE
```



## Testing

Hyperbone is covered by tests. It does not test underlying Backbone Model functionality, but the Backbone-model component used as a dependency
has been evalated against the real Backbone test suite and passes all tests.

Install testing tools. You probably need PhantomJS on your path.

```back
  $ npm install
```

Run the tests:

```bash
  $ grunt test
```

## To Do

- Non-standard to the HAL spec, but there will be _controls support for dealing with forms
- Self-discovery of URI template requirements?



## License

  MIT
