# Hyperbone Model

  [Backbone](http://backbonejs.org/) Models with [Hypermedia](http://stateless.co/hal_specification.html) Extensions. 

  Backbone models are [Active Record](http://en.wikipedia.org/wiki/Active_record_pattern). You have a resource and you can do GET, POST, PUT, DELETE on it.

  Awesome. 

But what if you're using a [REST level 3](http://www.crummy.com/writing/speaking/2008-QCon/act3.html) API? What if you're using a hypermedia Web API? What if your API is using JSON HAL?

  What if you want your API to be self discoverable? What if there are ways of interacting with your resource that aren't on the same uri? 

  Well, at this point, Backbone gets in your way. I know from painful experience.

  Hyperbone Model is a response to this: It takes only the relevant bits of Backbone - the Models, Collections and Event (for which we've refactored Backbone into discrete [components](http://component.io) ) and adds Hypermedia extensions to them. This means that this particular component does not require jQuery, and means you can use a custom or just different router, Ajax component and view component.

Hyperbone Model also takes care of nesting models and collections. By default Backbone models are a single object of key value pairs. In the hypermedia world where resources can be nested inside other resources, we need to ensure all the Backbone utility is available from top to bottom.

  It is part of a larger framework for building client-side apps based on HAL Web APIs. The roadmap, such as it is, involves extending Hyperbone model with _controls (JSON representation of forms) and a View component to project complex Hyperbone models onto templates. Initially there will be some basic _control -> html stuff, but this will be extendable with components that will add features like "render in bootstrap friendly way" or "just a single button" or "project form through custom template" etc.
  
## WARNING!

  Because of the need to remove the jQuery dependency (in keeping with the component philosophy of not bundling huge libraries with components) the .sync functionality of the Backbone models has been disabled. It can be readded. See [backbone-sync](http://github.com/green-mesa/backbone-sync). 
  
  In practice this will not be replaced. Hypermedia interactions are either read only (in the form of a self-discoverable API) or via controls (embedded forms). Sync is basically 'reload' and little more. It's likely that this functionality will be moved somewhere else and the Models themselves will not be responsible for loading themselves.

## Features

  - _links support, with 'self' mapped to .url()
  - Curie support with fully qualified rel uri lookup for curied rels
  - support for uri templating to RFC6570, thanks to https://github.com/ericgj/uritemplate
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

Incidentally, the nested, embedded models have their own url. (all hypermedia must have a self.href).

```javascript

    var model = new Model({
      _links : {
        self : {
          href : "/helloworld"
        }
      }

    });
    
    model.set("test", { name : "one"});

    expect( model.get("test").url() ).to.equal( "/helloworld#test" );
``` 

In practice this is just to fulfill the requirement that all Hypermedia resources must have a self.href and it is not expected that this
would be used in the real world. But it's there. For models inside collections inside models, the URI goes model.url() + "#" + attribute name + "/" + index in collection of model.


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
