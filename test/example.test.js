'use strict';

let assert = require('assert');
let co = require('co');
let monogram = require('monogram');
let validate = require('../');
let vitesse = require('vitesse');

describe('validation', function() {
  it('works', function(done) {
    co(function*() {
      let db = yield monogram('mongodb://localhost:27017');
      let schema = new monogram.Schema({
        nonNegative: { $type: Number, $gte: 0 }
      });

      validate(schema);

      let Test = db.model({ schema: schema, collection: 'test' });

      let doc = new Test({ nonNegative: -1 });
      let errors = doc.$validate();
      assert.equal(errors.length, 1);
      assert.deepEqual(errors[0].path, ['object', 'nonNegative']);

      doc = new Test({ nonNegative: 1 });
      errors = doc.$validate();
      assert.equal(errors.length, 0);

      done();
    }).catch(function(error) {
      done(error);
    });
  });

  it('$required', function(done) {
    co(function*() {
      let db = yield monogram('mongodb://localhost:27017');
      let schema = new monogram.Schema({
        name: { $type: String, $required: true }
      });

      validate(schema);

      let Test = db.model({ schema: schema, collection: 'test' });

      let doc = new Test({});
      let errors = doc.$validate();
      assert.equal(errors.length, 1);
      assert.deepEqual(errors[0].path, ['object']);
      assert.deepEqual(errors[0].rule.required, ['name']);

      doc.name = 'Axl Rose';
      errors = doc.$validate();
      assert.equal(errors.length, 0);

      done();
    }).catch(function(error) {
      done(error);
    });
  });
});
