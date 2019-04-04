---
layout: post
title:  "Reading through a project: Formy"
date:   2019-3-30 11:00:00
categories: programming javascript
---

Sometimes it helps to take a software project and just read through the source code. If the documentation is good enough or the interface is simple enough you can probably getting away with not knowing how most of the project works, but sometimes it’s kind of nice to look a little deeper.
I’ve used a React form library called Formy for a few projects at iFixit. Formy lets you configure a form using JavaScript objects and apply that configuration to a view using React components. The documentation has a lot of [examples](https://github.com/iFixit/formy/tree/master/src/example), which makes it really easy to get up and running with it, but to be honest I don’t really understand how most of it works. Here’s my attempt at learning a little bit more about it.

## Where to start
It’s probably not a bad idea to start looking in the entrypoint of the module. In the package.json file that’s specified by the _main_ field of the JSON document. For Formy, it’s _dist/Formy/Form.js_, but that file doesn’t show up in GitHub. The dist directory is the result of a build step which converts each file in the src directory to an ES5 target, so it’s safe to say that we can treat _src/Formy/Form.js_ as the entrypoint. The _src/example_ and _src/index.js_ directories and files are only used for documentation and development, so those can be ignored.

## Exports
_Form.js_ is responsible for exporting functions and data that users of the library can access. The file specifies a default export named _Form_, which is an object which contains named functions. It doesn’t look like _Form_ has any state or prototype (apart from the Object prototype), so the functions it holds can be viewed as static functions and can be looked at individually.

### Form.Component
`gist:copperwall/6a605253d3dde9e3850316132b38ad50#Form.Component.js`

Component is a functional React component that takes _id_, _name_, _onSubmit_, and _children_ as props. The return value of that functional component is a form with those props applied to it. Any child components that are included within _Form.Component_ are passed through to the form component. That’s probably used for including form inputs or submit buttons as children to a form.

_Component seems like a kind of general name for a React component. Maybe it would be better to name it Form, because it wraps an actual form JSX tag._

### Form.Field

Form.Field is defined in a separate file, so I’m not totally sure what that means yet. Why is FormField in a different file, but not Form.Component? That might make things seems a little more consistent. We can revisit this later after going through _Form.js_.

### Form.customValidityFactory
`gist:copperwall/49dd945a94a4403c12e0f646af743589#custom_validity.js`
A function that takes a constraint and validation message and returns a function that takes a variadic number of arguments and applies its arguments to the constraint function provided in the first function and returns either empty string if truthy or validationMessage if not. _Maybe it’d be cool if the custom validity factory let the validity constraint function return its own error message, and not just empty string vs validationMessage. Would that allow multiple validation messages?_

The end result of the customValidityFactory is to call _setCustomValidity_ on the form input with the string result from calling the constraint function on the arguments passed to the resulting function. However, this happens in the component library and not in Formy itself. Formy assumes that passing a _customValidity_ property to an input component will handle that properly, so that’s important to know if you want to include your own component library to use with Formy.

### Form.fields
`gist:copperwall/50e01784dc622e0bc861427e9ae0d5be#form_fields.js`
Function that takes globalProps and an object of field definitions. Global props are useful for when you want to use the same onChange handler. The global field props will be applied to any field component, unless overridden by the individual field itself. Setting a global _onChange_ prop to update state whenever any form field is changed is a good example of a global prop. The return value of this function is an object with form input name keys that map to an object with properties for that form input.

### Form.getData
`gist:copperwall/7eec29a0185b3b51bc8b398d6f87c2e2#form_data.js`
Wow, this function is kind of dense. The gist looks like it returns an object with data from the value of each form field, but does not include unchecked radio or checkbox fields or disabled fields. The shape of the returned object is field name keys that map to the value of that field. This is particularly helpful if you want to get input data out of the form for submitting.

### Form.getProps
`gist:copperwall/8a6d95d5cece72a57c42d68b09aaaa3c#form_props.js`
form.getProps goes over all non “fields” fields and if the value is a function, calls it with the form. An example of a prop like this is the return value from Form.onSubmitFactory, which expects a form and returns an event handler that goes on the actual form. The “fields” field maps each form field name, and for each form field prop, if it’s a function it passes the form and the fieldName to the function value. A good example of this is Form.customValidityFactory, which takes a constraint function and returns a function that takes a form and fieldKey, which is called by Form.getProps.

For all the ES6+ magic going on here, we’re basically mapping an object full of form level props and transforming properties that are functions by applying them with the form object and a fieldKey (if it’s a form field property).

Wow there’s a lot going on here. From examples it looks like this returns a list of props that can be passed to Form.Component and Form.Field in user component’s render method.

This function (and Form.getData) makes pretty heavy use of _Object.assign_. What does _Object.assign_ actually do?

_Object.assign_ is like an object spread operator. The first argument is the target object and all other arguments are sources to copy fields from into the target object. Later source properties override earlier ones. It looks like most of its uses use an empty target object and a list of sources from global to more specific properties. _Object.assign_ can also take a source that is an array of objects and it will merge those together and then copy those into the target object.

The project’s babelrc specifies using the _transform-object-rest-spread_ plugin, so maybe those *Object.assign*s can be converted to use the object spread operator.

### Form.onChangeFactory
`gist:copperwall/39f0041f9e9f5c32af482b8acd7c768e#form_onchange.js`
A function that takes a handler function _fn_, which returns a function that takes a _form_ and _fieldKey_, which returns a function that takes an updatedProps object, which applies the handler function to a merged object with _form_ as a base, an overridden _fields_ key with the keys from _form.fields_ with the _fieldKey_ key overridden by the updatedProps object.

The example handler function receives a new form object with the updated fields and calls setState with that new form state. _Kind of interesting that you have to specify that in order for the form to work. Maybe it could be a nice default._

### Form.onSubmitFactory
`gist:copperwall/b468205938b5a3390a8a4be2fd5f01ed#form_submit.js`
A function that takes a handler function _fn_, which returns a function that takes the form object, which returns a function that takes an event, which I would assume is the submit event. That function prevents the default behavior of the submit event, calls the handler function of the result of calling _getData_ on the form object. This is useful for specifying what to do when the form is submitted, such as sending off an AJAX request or creating some action with the form data.

The resulting function from calling Form.onSubmitFactory is used as the value for the onSubmit key in the form state. The Form.Component component needs a onSubmit function that takes an event. In order to convert the onSubmit function in the form state into the onSubmit function prop, call From.getProps on the form state. This will supply the form state to the onSubmit function in the state, which takes a form and returns a function that takes an event. The result from calling that function will.

### FormField.js
`gist:copperwall/e29c956dff1c0a61100610f5d6d7f879#FormField.js`
So FormField isn’t actually that complicated. FormField is functional React component that accepts componentLibrary and type props along with additional props. The type prop given is used as the key in the componentLibrary object to grab the component from, the return value is the JSX of that component with the props given to FormField.

FormField specifies some defaultProps such as _checked_, _componentLibrary_, _type_, and _value_. _Checked_ is false by default, _componentLibrary_ is [Toolbox](https://github.com/ifixit/toolbox) by default, _type_ is text by default, and _value_ is empty string by default. Not too weird for defaults.

FormField’s propTypes are imported from the FormFieldPropTypes.js file. _Maybe that’s something that would be better specified by the component library? I’m not sure._
