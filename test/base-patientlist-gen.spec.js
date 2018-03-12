import chai from 'chai';
import mlog from 'mocha-logger';
import * as Squel from 'squel';
chai.use(require('chai-string'));
chai.expect();
import {
  BasePatientListGen
}
  from '../src';

const expect = chai.expect;
const should = chai.should;
let gen;

describe('BasePatientListGen:', () => {
  beforeEach(() => {
    gen = new BasePatientListGen(null, null, null);
  });
  it('should be defined', () => {
    expect(gen).to.exist;
    expect(gen.generatePatientListSchema()).not.be.null;
  });

  it('should add columns missing in the base report but exists' +
    ' in the template report', () => {

      let baseReport = {
        "columns": [
          {
            "type": "column",
            "alias": "gender",
            "column": "hmrd.gender"
          },
          {
            "type": "column",
            "column": "hmrd.person_id"
          },
          {
            "type": "column",
            "alias": "person_id",
            "column": "hmrd.person_id"
          }
        ]
      };

      let templateReport = {
        "columns": [
          {
            "type": "simple_column",
            "alias": "person_id",
            "column": "t1.person_id"
          },
          {
            "type": "simple_column",
            "alias": "person_id_2",
            "column": "t1.person_id"
          },
          {
            "type": "derived_column",
            "alias": "person_name",
            "expression_type": "simple_expression",
            "expression_options": {
              "expression": " CONCAT(COALESCE(person_name.given_name, ''), ' ', COALESCE(person_name.middle_name, ''), ' ', COALESCE(person_name.family_name, ''))"
            }
          }
        ]
      };

      let expectedBaseReport = {
        "columns": [
          {
            "type": "column",
            "alias": "gender",
            "column": "hmrd.gender"
          },
          {
            "type": "column",
            "column": "hmrd.person_id"
          },
          {
            "type": "column",
            "alias": "person_id",
            "column": "hmrd.person_id"
          },
          {
            "type": "simple_column",
            "alias": "person_id_2",
            "column": "t1.person_id"
          },
          {
            "type": "derived_column",
            "alias": "person_name",
            "expression_type": "simple_expression",
            "expression_options": {
              "expression": " CONCAT(COALESCE(person_name.given_name, ''), ' ', COALESCE(person_name.middle_name, ''), ' ', COALESCE(person_name.family_name, ''))"
            }
          }
        ]
      };

      gen.addMissingColumns(baseReport, templateReport);

      expect(baseReport).to.deep.equal(expectedBaseReport);
    });
});
