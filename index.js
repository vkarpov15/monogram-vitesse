'use strict';

let _ = require('lodash');
let vitesse = require('vitesse');

let ALLOWED_OPERATORS = new WeakMap();
ALLOWED_OPERATORS.set(Number, ['$gt', '$gte', '$in', '$lt', '$lte']);

module.exports = ValidatePlugin;

function ValidatePlugin(schema) {
  let rootNode = new vitesse.ObjectNode(null, null, { typeCheck: true });

  visitObject(schema._obj, rootNode);

  let validator = new vitesse.Compiler({}).compile(rootNode);

  schema.method('document', '$validate', function() {
    return validator.validate(this);
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
        let numNode = new vitesse.NumberNode(null, null, { typeCheck: true });
        numNode.addValidation(_.pick(value, ALLOWED_OPERATORS.get(Number)));
        vitesseNode.addChild(key, numNode);
        return;
      }

      let objNode = new vitesse.ObjectNode(null, null, { typeCheck: true });
      vitesseNode.addChild(key, objNode);
      visitObject(value, objNode);
    } else {
      let numNode = new vitesse.NumberNode(null, null, { typeCheck: true });
      vitesseNode.addChild(key, numNode);
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
        let numNode = new vitesse.NumberNode(null, null, { typeCheck: true });
        numNode.addValidation(_.pick(value, ALLOWED_OPERATORS.get(Number)));
        vitesseNode.addChild(key, numNode);
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
