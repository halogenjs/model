# Hyperbone Model

[![Build Status](https://travis-ci.org/green-mesa/hyperbone-model.png?branch=master)](https://travis-ci.org/green-mesa/hyperbone-model)

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

Creating a hyperbone model. The minimum valid HAL document contains a _links object, but according to the spec is this optional, so you can invoke a 
hyperbone model with an empty object.

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

### .set( attr, data )

Usual Backbone .set(), but all objects added as attributes to a model are converted into hyperbone models. Arrays of objects are automatically converted
into a backbone Collection of models, too.

Setting can be done via chaining of these models 

```javascript
// nested models means no more breaking out of Backbone
m.get('thing').get('nestedthing').set("property", "hello")
```

or through dot notation

```javascript
m.set("thing.nestedthing.property", "hello");

//  internally this does... 
//  {
//    thing : {
//      nestedthing : { 
//        property : "hello"
//      }
//    }  
//  }
```

This has obvious implications - you can't, by default, use attribute names with periods in. You can, however, disabled this functionality

```javascript
m.set("foo.bar.lol", "hello", { ignoreDotNotation: true });
// creates an attribute called "foo.bar.lol" in model m.

```

### .get( attr )

Hyperbone extends the .get() method to allow dot notation and indexed access notation to access these nested properties. The attribute names can be just about anything.

The dot notation feature is just basic string manipulation and recursive calls to .get(), and obviously you can always fall back to basic chaining if there's an issue - although reports of issues are welcome.

### More about using get and set...

The philosophy behind Hyperbone means resources are embeddable within resources which means it's models and collections all the way down. 

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

  // chaining...
  expect( model.get("test").get("name") ).to.equal("Test"); // TRUE

  // or use the handy dot notation. This works for deeply nested models, too.
  expect( model.get("test.name").to.equal("Test") ); // TRUE!

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

  // using chaining...
  expect( model.get("test").at(0).get("name") ).to.equal("one"); // TRUE

  // or using dot notation and indexed access notiation...
  expect( model.get("test[0].name") ).to.equal("one"); // TRUE

  // arrays of objects automatically get all the power of Backbone collections... 
  model.get("test").each(function( item ){

    console.log(item.get("name"));

  });

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
can be used to expand the uri template with the data. There is currently no way of discovering the requirements for a URI template - it's on the to-do list.

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
### .rels()

Returns all the links. Hypermedia is about self discovery, after all. 

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

## Controls

A foreword about controls. Hyperbone model adds another reserved property, `_controls` and offers some lightweight additional utility for those
that care to use it. However, `_controls` is not part of the HAL Spec. Mike Kelly has said that dealing with forms will be part of a separate 
spec, however as we are in need of this functionality now, therefore it has been included in this.

In effect controls are just JSON versions of forms, from which HTML forms can be generated (functionality NOT included in Hyperbone Model). Minimum 
requirements to be seen as a control by Hyperbone are a "method" property and a "properties" property. If there is no "action" property it will automatically
be assigned the self.href of the parent resource.

In the trivial example below it is hard to get a sense of the use of this. However, imagine if every possible interaction with your resource has one of these 
controls. It would then be feasible to generate a fully functioning client-side application (albeit hideously ugly) from the JSON HAL alone. 

That's the goal. 

Adding a control:

```javascript
  new Model({
    _links : {
      self : {
        href : "/thing"
      },
      "controls:sample" : {
        href : "#controls/edit/sample"
      }
    },
    _controls : {
      edit : {
        sample : {
          method : "PUT",
          action : "/thing/sample",
          properties : [
            {
              type : "text",
              name : "description",
              value : "the current description"
            },
            {
              type : "submit",
              name : ""
            }
          ]
        }
      }
    }

  })

```

### .control( [rel / id] )

If, as in the above example, you're using an internal rel for your controls, you can access the control with:

```javascript
  model.control("controls:sample");
```

The convention is that an internal rel to a control begins `#controls` or `#_controls` or `#control` and the path to the specific
control is separated by a slash. 


Or you can access using .get() style dot notation, but this is not recommended - better to have a consistent interface for a particular 
type of resource as depending on your server side implementation, control names may not be predictable in advance.

```javascript
  model.control("edit.sample");
```

This returns the control as a Hyperbone Model, so all the usual stuff applies - the array of properties becomes a collection, etc.

```javascript
  model.control("controls:sample").get("properties").each(function(field){

    // do something with each property in the control.

  })
```

### .field( fieldName )

A utility function allowing you to access a specific field directly. NOTE this does not give you access to any generated HTML form field
as this is not part of this module, but when you change any value an event is issued as normal and anything subscribing to this can react
accordingly.

```javascript
  model.control("controls:sample").field("description").get("value") === "the current description"; // true
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


## License

  MIT
