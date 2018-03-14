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

    // handle other test cases in related functions
    // willColumnTitlesCollide case similar column members
    expect(gen.willColumnTitlesCollide({
      column: 'same'
    }, {
      column: 'same'
    })).to.be.true;
  });

  it('should create sources member as specified in the dynamic query generation directives' +
    ' in aggregate report schema, in addition to base schema sources', () => {
    let aggregateSchema = {
      'dynamicJsonQueryGenerationDirectives': {
        'patientListGenerator': {
          'generatingDirectives': {
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

    gen.addSourcesToGeneratedSchema(aggregateSchema, baseSchema, templateSchema);
    expect(baseSchema).to.deep.equal(expectedDynamic);
  });

  it('should generate the dynamically generated json query filters', () => {
    let aggregateSchema = {
      'groupBy': {
        'columns': [ 'gender', 'age_range']
      }
    };

    let baseSchema = {
      'columns': [
        {
          'type': 'simple_column',
          'alias': 'gender',
          'column': 'hmrd.gender'
        },
        {
          'type': 'derived_column',
          'alias': 'age_range',
          'expressionType': 'case_statement',
          'expressionOptions': {
            'caseOptions': [
              {
                'condition': 'hmrd.age between 0 and 1',
                'value': '0_to_1'
              },
              {
                'condition': 'hmrd.age between 1 and 9',
                'value': '1_to_9'
              },
              {
                'condition': 'else',
                'value': 'older_than_9'
              }
            ]
          }
        },
        {
          'type': 'derived_column',
          'alias': 'on_ctx_prophylaxis',
          'expressionType': 'simple_expression',
          'expressionOptions': {
            'expression': 'CASE WHEN status = "active" AND on_art_this_month = 1 THEN 1 ELSE NULL'
          }
        }
      ],
      'filters': {
        'conditionJoinOperator': 'AND',
        'conditions': [
          {
            'filterActingOn': 'simple_column',
            'conditionExpression': 'endDate = <<@endDate>>'
          }
        ]
      }
    };

    let passedParams = {
      'gender': 'F',
      'age_range': '1_to_9',
      'on_ctx_prophylaxis': 1,
      'endDate': '2018-01-01'
    };

    let expectedFilterMember = {
      'conditionJoinOperator': 'AND',
      'conditions': [
        {
          'filterActingOn': 'simple_column',
          'conditionExpression': 'endDate = <<@endDate>>'
        },
        {
          'filterActingOn': 'simple_column',
          'conditionExpression': 'gender = "F"',
          'dynamicallyGenerated': true
        },
        {
          'filterActingOn': 'derived_column',
          'conditionExpression': 'hmrd.age between 1 and 9',
          'dynamicallyGenerated': true
        },
        {
          'filterActingOn': 'derived_column',
          'conditionExpression': '1 = (CASE WHEN status = "active" AND on_art_this_month = 1 THEN 1 ELSE NULL)',
          'dynamicallyGenerated': true
        }
      ]
    };

    gen.addMissingFilters(aggregateSchema, baseSchema, passedParams);
    expect(baseSchema.filters).to.deep.equal(expectedFilterMember);

    // handle uncovered test cases on related functions
    // getParamValue case number
    expect(gen.getParamValue(1)).to.equal(1);

    // getCaseExpressionColumnFilterObject case else
    expect(gen.getCaseExpressionColumnFilterObject(baseSchema.columns[1], 'older_than_9'))
      .to.deep.equal({
        filterActingOn: 'derived_column',
        conditionExpression: '!((hmrd.age between 0 and 1) AND(hmrd.age between 1 and 9))',
        dynamicallyGenerated: true
      });

    // getFilterObject case unknown expression type
    expect(gen.getFilterObject({
      type: 'other',
      expressionType: 'other'
    })).to.be.null;
  });
});
