import chai from 'chai';
// import mlog from 'mocha-logger';
// import * as Squel from 'squel';
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
      'columns': [
        {
          'type': 'column',
          'alias': 'gender',
          'column': 'hmrd.gender'
        },
        {
          'type': 'column',
          'column': 'hmrd.person_id'
        },
        {
          'type': 'column',
          'alias': 'person_id',
          'column': 'hmrd.person_id'
        }
      ]
    };

    let templateReport = {
      'columns': [
        {
          'type': 'simple_column',
          'alias': 'person_id',
          'column': 't1.person_id'
        },
        {
          'type': 'simple_column',
          'alias': 'person_id_2',
          'column': 't1.person_id'
        },
        {
          'type': 'derived_column',
          'alias': 'person_name',
          'expression_type': 'simple_expression',
          'expression_options': {
            'expression': " CONCAT(COALESCE(person_name.given_name, ''), ' ', COALESCE(person_name.middle_name, ''), ' ', COALESCE(person_name.family_name, ''))"
          }
        }
      ]
    };

    let expectedBaseReport = {
      'columns': [
        {
          'type': 'column',
          'alias': 'gender',
          'column': 'hmrd.gender'
        },
        {
          'type': 'column',
          'column': 'hmrd.person_id'
        },
        {
          'type': 'column',
          'alias': 'person_id',
          'column': 'hmrd.person_id'
        },
        {
          'type': 'simple_column',
          'alias': 'person_id_2',
          'column': 't1.person_id'
        },
        {
          'type': 'derived_column',
          'alias': 'person_name',
          'expression_type': 'simple_expression',
          'expression_options': {
            'expression': " CONCAT(COALESCE(person_name.given_name, ''), ' ', COALESCE(person_name.middle_name, ''), ' '," +
                " COALESCE(person_name.family_name, ''))"
          }
        }
      ]
    };

    gen.addMissingColumns(baseReport, templateReport);

    expect(baseReport).to.deep.equal(expectedBaseReport);
  });

  it('should add sources as specified in the dynamic query generation directives' +
    ' in aggregate report schema, in addition to base schema sources', () => {
    let aggregateSchema = {
      'dynamicJsonQueryGenerationDirectives': {
        'patientListGenerator': {
          'generated_query_name': 'patient_list',
          'generatingDirectives': {
            'use_template': 'patient_list_template',
            'use_template_version': '1.0',
            'joinDirectives': {
              'joinType': 'INNER',
              'joinCondition': '<<base_column>> = <<template_column>>',
              'baseColumn': 'person_id',
              'templateColumn': 'person_id'
            }
          }
        }
      }
    };

    let baseSchema = {
      'sources': [
        {
          'table': 'etl.hiv_monthly_report_dataset',
          'alias': 'hmrd'
        }
      ]
    };

    let templateSchema = {
      'sources': [
        {
          'table': 'amrs.person',
          'alias': 't1'
        },
        {
          'table': 'amrs.person_name',
          'alias': 'person_name',
          'join': {
            'type': 'INNER',
            'joinCondition': 't1.person_id = person_name.person_id AND (person_name.voided IS NULL || person_name.voided = 0)'
          }
        },
        {
          'table': 'amrs.patient_identifier',
          'alias': 'id',
          'join': {
            'type': 'LEFT OUTER',
            'joinCondition': 't1.person_id = person_name.person_id AND (person_name.voided IS NULL || person_name.voided = 0)'
          }
        }
      ]
    };

    let expectedDynamic = {
      'sources': [
        {
          'table': 'etl.hiv_monthly_report_dataset',
          'alias': 'hmrd'
        },
        {
          'table': 'amrs.person',
          'alias': 't1',
          'join': {
            'type': 'INNER',
            'joinCondition': 'hmrd.person_id = t1.person_id'
          }
        },
        {
          'table': 'amrs.person_name',
          'alias': 'person_name',
          'join': {
            'type': 'INNER',
            'joinCondition': 't1.person_id = person_name.person_id AND (person_name.voided IS NULL || person_name.voided = 0)'
          }
        },
        {
          'table': 'amrs.patient_identifier',
          'alias': 'id',
          'join': {
            'type': 'LEFT OUTER',
            'joinCondition': 't1.person_id = person_name.person_id AND (person_name.voided IS NULL || person_name.voided = 0)'
          }
        }
      ]
    };

    gen.mergeSources(aggregateSchema, baseSchema, templateSchema);
    expect(baseSchema).to.deep.equal(expectedDynamic);
  });
});
