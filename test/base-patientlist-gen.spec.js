import chai from 'chai';
import * as sinon from 'sinon';
chai.use(require('chai-string'));
chai.use(require('sinon-chai'));
chai.expect();
import {
  BasePatientListGen
}
  from '../src';

// chai.config.includeStack = true;
global.expect = chai.expect;
global.should = chai.should;
global.Assertion = chai.Assertion;
global.assert = chai.assert;
let gen;

describe('BasePatientListGen:', () => {
  beforeEach(() => {
    gen = new BasePatientListGen(null, null, null);
  });
  it('should be defined', () => {
    expect(gen).to.exist;
  });

  it('should clone all the schemas during init', () => {
    let schemaA = {
      a: 1
    };
    let schemaB = {
      b: 'b'
    };

    let schemaC = {
      c: true
    };

    let sample = new BasePatientListGen(schemaA, schemaB, schemaC);

    expect(sample.baseSchema).to.not.equal(schemaA);
    expect(sample.baseSchema).to.deep.equal(schemaA);
    expect(sample.aggregateSchema).to.not.equal(schemaB);
    expect(sample.aggregateSchema).to.deep.equal(schemaB);
    expect(sample.patientListTemplateSchema).to.not.equal(schemaC);
    expect(sample.patientListTemplateSchema).to.deep.equal(schemaC);

  });

  it('should generate the patient list report', () => {

    let baseSchema = {
      columns: [],
      sources: []
    };

    let patientListTemplate = {
      columns: [],
      sources: []
    };

    let aggregateSchema = {
      columns: [],
      sources: []
    };

    let paramsObject = {
    };

    let expectedDynamicQuery = {
      params: { a: 'a' },
      generated: baseSchema
    };

    let plGen = new BasePatientListGen(baseSchema, aggregateSchema, patientListTemplate, paramsObject);

    let addMappedParamsStub = sinon.stub(plGen, 'addMappedParamsToParamsObject').returns(expectedDynamicQuery.params);
    let addMissingColumnsStub = sinon.stub(plGen, 'addMissingColumns').returns(undefined);
    let addSourcesToGeneratedSchemaStub = sinon.stub(plGen, 'addSourcesToGeneratedSchema').returns(undefined);
    let addMissingFiltersStub = sinon.stub(plGen, 'addMissingFilters').returns(undefined);
    let addPagingParamsStub = sinon.stub(plGen, 'addPagingParams').returns(undefined);
    let addGroupByParamsStub = sinon.stub(plGen, 'addGroupByParams').returns(undefined);

    let generated = plGen.generatePatientListSchema();

    // check params intergration
    expect(addMappedParamsStub.calledWithExactly(plGen.aggregateSchema.sources, plGen.params)).to.be.true;

    // add columns integration
    expect(addMissingColumnsStub.args[0][0]).to.deep.equal(baseSchema);
    expect(addMissingColumnsStub.args[0][1]).to.deep.equal(patientListTemplate);

    // add data sources integration
    expect(addSourcesToGeneratedSchemaStub.args[0][0]).to.deep.equal(aggregateSchema);
    expect(addSourcesToGeneratedSchemaStub.args[0][1]).to.deep.equal(baseSchema);
    expect(addSourcesToGeneratedSchemaStub.args[0][2]).to.deep.equal(patientListTemplate);

    // add missing filters
    expect(addMissingFiltersStub.args[0][0]).to.deep.equal(aggregateSchema);
    expect(addMissingFiltersStub.args[0][1]).to.deep.equal(baseSchema);
    expect(addMissingFiltersStub.args[0][2]).to.deep.equal(plGen.params);

    // add paging parameters
    expect(addPagingParamsStub.args[0][0]).to.deep.equal(baseSchema);

    // add paging parameters
    expect(addGroupByParamsStub.args[0][0]).to.deep.equal(baseSchema);
    expect(addGroupByParamsStub.args[0][1]).to.deep.equal(patientListTemplate);

    expect(generated).to.deep.equal(expectedDynamicQuery);

  });

  it('should add mapped params in data sources to the params object', () => {
    let datasources = [{
      table: 'etl.hiv_monthly_summary',
      alias: 'hms'
    },
    {
      dataSet: 'enrolledDataSet',
      alias: 'p',
      join: {
        type: 'inner',
        joinCondition: 'p.patient_id = hms.patient_id and p.voided is null'
      },
      forwardedParams: [
        {
          'mapping': 'endDate:eDate'
        }
      ]
    }];

    let params = {
      endDate: '2017-10-10'
    };

    let expectedParams = {
      endDate: '2017-10-10',
      eDate: '2017-10-10'
    };

    let mapped = gen.addMappedParamsToParamsObject(datasources, params);

    expect(mapped).to.deep.equal(expectedParams);

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
          'expressionType': 'simple_expression',
          'expressionOptions': {
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
          'expressionType': 'simple_expression',
          'expressionOptions': {
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

  it('should add grouping functions present in the template', () => {

    let templateSchema = {
      'groupBy': {
        'columns': ['t1.person_id']
      }
    };

    let baseSchema = {

    };

    let baseSchema2 = {
      'groupBy': {
        'columns': ['t1.uuid']
      }
    };

    let expectedBaseSchema = {
      'groupBy': {
        'columns': ['t1.person_id']
      }
    };

    let expectedBaseSchema2 = {
      'groupBy': {
        'columns': ['t1.uuid', 't1.person_id']
      }
    };

    gen.addGroupByParams(baseSchema, templateSchema);
    gen.addGroupByParams(baseSchema2, templateSchema);
    expect(baseSchema).to.deep.equal(expectedBaseSchema);
    expect(baseSchema2).to.deep.equal(expectedBaseSchema2);

  });

  it('should generate the dynamically generated json query filters', () => {
    let aggregateSchema = {
      'groupBy': {
        'columns': ['gender', 'age_range']
      }
    };

    let aggregateSchemaWithSkipParam = {
      'groupBy': {
        'columns': ['gender', 'age_range']
      },
      'dynamicJsonQueryGenerationDirectives': {
        'patientListGenerator': {
          'generatingDirectives': {
            'joinDirectives': {
              'joinType': 'INNER',
              'joinCondition': '<<base_column>> = <<template_column>>',
              'baseColumn': 'person_id',
              'templateColumn': 'person_id'
            },
            'skipParams': ['gender']
          }
        }
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
            'filterType': 'tableColumns',
            'conditionExpression': 'endDate = <<@endDate>>'
          }
        ]
      }
    };

    let baseSchemaSkip = {
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
            'filterType': 'tableColumns',
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
          'filterType': 'tableColumns',
          'conditionExpression': 'endDate = <<@endDate>>'
        },
        {
          'filterType': 'tableColumns',
          'conditionExpression': 'hmrd.gender = "F"',
          'parameterName': '',
          'dynamicallyGenerated': true
        },
        {
          'filterType': 'expressionColumns',
          'conditionExpression': 'hmrd.age between 1 and 9',
          'parameterName': '',
          'dynamicallyGenerated': true
        },
        {
          'filterType': 'expressionColumns',
          'conditionExpression': '1 = (CASE WHEN status = "active" AND on_art_this_month = 1 THEN 1 ELSE NULL)',
          'parameterName': '',
          'dynamicallyGenerated': true
        }
      ]
    };

    let expectedFilterMemberForSkipParam = {
      'conditionJoinOperator': 'AND',
      'conditions': [
        {
          'filterType': 'tableColumns',
          'conditionExpression': 'endDate = <<@endDate>>'
        },
        {
          'filterType': 'tableColumns',
          'conditionExpression': 'hmrd.gender = "F"',
          'parameterName': '',
          'dynamicallyGenerated': true
        },
        {
          'filterType': 'expressionColumns',
          'conditionExpression': 'hmrd.age between 1 and 9',
          'parameterName': '',
          'dynamicallyGenerated': true
        },
        {
          'filterType': 'expressionColumns',
          'conditionExpression': '1 = (CASE WHEN status = "active" AND on_art_this_month = 1 THEN 1 ELSE NULL)',
          'parameterName': '',
          'dynamicallyGenerated': true
        }
      ]
    };

    gen.addMissingFilters(aggregateSchema, baseSchema, passedParams);
    expect(baseSchema.filters).to.deep.equal(expectedFilterMember);

    gen.addMissingFilters(aggregateSchemaWithSkipParam, baseSchemaSkip, passedParams);
    expect(baseSchemaSkip.filters).to.deep.equal(expectedFilterMemberForSkipParam);
    // handle uncovered test cases on related functions
    // getParamValue case number
    expect(gen.getParamValue(1)).to.equal(1);

    // getCaseExpressionColumnFilterObject case else
    expect(gen.getCaseExpressionColumnFilterObject(baseSchema.columns[1], 'older_than_9'))
      .to.deep.equal({
        'filterType': 'expressionColumns',
        conditionExpression: '!((hmrd.age between 0 and 1) OR(hmrd.age between 1 and 9))',
        'parameterName': '',
        dynamicallyGenerated: true
      });

    // getFilterObject case unknown expression type
    expect(gen.getFilterObject({
      type: 'other',
      expressionType: 'other'
    })).to.be.null;
  });

  it('should add paging params to the generated json schema', () => {
    let baseSchema = {

    };
    let expectedPagedSchema = {
      paging: {
        offSetParam: 'offSetParam',
        limitParam: 'limitParam'
      }
    };

    gen.addPagingParams(baseSchema);

    expect(baseSchema).to.deep.equal(expectedPagedSchema);

    let baseWithPaging = {
      paging: {
        offSetParam: 'offset',
        limitParam: 'limit'
      }
    };

    let expectedWithPaging = {
      paging: {
        offSetParam: 'offset',
        limitParam: 'limit'
      }
    };

    gen.addPagingParams(baseWithPaging);
    expect(baseWithPaging).to.deep.equal(expectedWithPaging);

  });

});
