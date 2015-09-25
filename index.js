'use strict';

let _ = require('lodash');
let vitesse = require('vitesse');

let VITESSE_TYPES = new WeakMap();

VITESSE_TYPES.set(Array, {
  nodeType: vitesse.ArrayNode,
  allowedOperators: ['$gt', '$gte', '$lt', '$lte']
});
VITESSE_TYPES.set(Boolean, {
  nodeType: vitesse.BooleanNode,
  allowedOperators: []
});
VITESSE_TYPES.set(Number, {
  nodeType: vitesse.NumberNode,
  allowedOperators: ['$gt', '$gte', '$in', '$lt', '$lte', '$multipleOf']
});
VITESSE_TYPES.set(String, {
  nodeType: vitesse.StringNode,
  allowedOperators: ['$gt', '$gte', '$in', '$lt', '$lte', '$regexp']
});

module.exports = ValidatePlugin;

function ValidatePlugin(schema) {
  let rootNode = new vitesse.ObjectNode(null, null, { typeCheck: true });

  visitObject(schema._obj, rootNode);

  let validator = new vitesse.Compiler({}).compile(rootNode);

  schema.method('document', '$validate', function() {
    return validator.validate(this);
  });

  schema.middleware('$save', function*(next) {
    let errors = this.$validate();
    if (errors.length > 0) {
      let error = new Error(_.pluck(errors, 'message').join(', '));
      error.errors = errors;
      throw error;
    }
    yield next;
  });
}

function visitArray(arr, vitesseNode) {
  if (arr.length > 0) {
    if (Array.isArray(arr[0])) {
      let arrNode = new vitesse.ArrayNode(null, null, { typeCheck: true });
      vitesseNode.addChild(key, arrNode);
      visitArray(arr, arrNode);
    } else if (typeof arr[0] === 'object') {
      let keys = Object.keys(value);
      if (keys.length > 0 && keys[0].charAt(0) === '$') {
        if (value.$type && VITESSE_TYPES.has(value.$type)) {
          let type = VITESSE_TYPES.get(value.$type);
          let Node = type.nodeType;
          let node = new Node(null, null, { typeCheck: true });
          let validators = _.pick(value, type.allowedOperators);
          if (value.$required) {
            vitesseNode.requiredFields([key]);
          }
          if (Object.keys(validators).length > 0) {
            node.addValidation(validators);
          }
          vitesseNode.addChild(key, node);
        }
        return;
      }

      let objNode = new vitesse.ObjectNode(null, null, { typeCheck: true });
      vitesseNode.addChild(key, objNode);
      visitObject(value, objNode);
    } else {
      if (VITESSE_TYPES.has(arr[0])) {
        let Node = VITESSE_TYPES.get(arr[0]).nodeType;
        let node = new Node(null, null, { typeCheck: true });
        vitesseNode.addChild(key, node);
      }

    }
  }
}

function visitObject(obj, vitesseNode) {
  _.each(obj, function(value, key) {
    if (Array.isArray(value)) {
      let arrNode = new vitesse.ArrayNode(null, null, { typeCheck: true });
      vitesseNode.addChild(key, arrNode);
      visitArray(arr, arrNode);
    } else if (typeof value === 'object') {
      let keys = Object.keys(value);
      if (keys.length > 0 && keys[0].charAt(0) === '$') {
        if (value.$type && VITESSE_TYPES.has(value.$type)) {
          let type = VITESSE_TYPES.get(value.$type);
          let Node = type.nodeType;
          let node = new Node(null, null, { typeCheck: true });
          let validators = _.pick(value, type.allowedOperators);
          if (value.$required) {
            vitesseNode.requiredFields([key]);
          }
          if (Object.keys(validators).length > 0) {
            node.addValidation(validators);
          }
          vitesseNode.addChild(key, node);
        }
        return;
      }

      let objNode = new vitesse.ObjectNode(null, null, { typeCheck: true });
      vitesseNode.addChild(key, objNode);
      visitObject(value, objNode);
    } else {
      let numNode = new vitesse.NumberNode(null, null, { typeCheck: true });
      vitesseNode.addChild(key, numNode);
    }
  });
}
