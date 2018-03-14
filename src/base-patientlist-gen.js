// import SqlGenerators from './sql-generators.js';
// import * as Squel from 'squel';
export default class BasePatientListGen {
  baseSchema = null;
  aggregateSchema = null;
  patientListTemplateSchema = null;
  constructor(baseSchema, aggregateSchema, patientListTemplateSchema) {
    this.baseSchema = baseSchema;
    this.aggregateSchema = aggregateSchema;
    this.patientListTemplateSchema = patientListTemplateSchema;
  }

  generatePatientListSchema() {
    return {};
  }

  addMissingColumns(destinationSchema, sourceSchema) {
    sourceSchema.columns.forEach(column => {
      if (!this.columnExistsInColumnArray(column, destinationSchema.columns)) {
        destinationSchema.columns.push(column);
      }
    });
  }

  addSourcesToGeneratedSchema(aggregateSchema, baseSchema, templateSchema) {
    let genDirective = aggregateSchema.dynamicJsonQueryGenerationDirectives.patientListGenerator.generatingDirectives;

    this.modifyDynamicPLMainSourceObject(genDirective.joinDirectives,
      baseSchema.sources[0], templateSchema.sources[0]);

    templateSchema.sources.forEach(source => {
      baseSchema.sources.push(source);
    });
  }

  addMissingFilters(aggregateSchema, baseSchema, suppliedParams) {
    baseSchema.columns.forEach(column => {
      if (suppliedParams[column.alias] !== undefined) {
        let filter = this.getFilterObject(column, suppliedParams[column.alias]);

        if (filter !== null) {
          baseSchema.filters.conditions.push(filter);
        }
      }
    });
  }

  columnExistsInColumnArray(column, columnArray) {
    for (let i = 0; i < columnArray.length; i++) {
      if (this.willColumnTitlesCollide(column, columnArray[i])) {
        return true;
      }
    }
    return false;
  }

  willColumnTitlesCollide(columnA, columnB) {
    if ((columnA.alias || columnB.alias) && columnA.alias === columnB.alias) {
      return true;
    }

    if (columnA.column && columnB.column && columnA.column === columnB.column) {
      return true;
    }
    return false;
  }

  modifyDynamicPLMainSourceObject(joinDirective, baseTableSource, templateTableSource) {
    templateTableSource.join = {
      type: joinDirective.joinType,
      joinCondition: joinDirective.joinCondition
    };

    // replace base columns
    let baseColumn = baseTableSource.alias + '.' + joinDirective.baseColumn;
    let templateColumn = templateTableSource.alias + '.' + joinDirective.templateColumn;

    templateTableSource.join.joinCondition =
    templateTableSource.join.joinCondition.replace('<<base_column>>', baseColumn);

    templateTableSource.join.joinCondition =
    templateTableSource.join.joinCondition.replace('<<template_column>>', templateColumn);
  }

  getFilterObject(columnObject, param) {
    if (columnObject.type === 'simple_column') {
      return this.getSimpleColumnFilterObject(columnObject, param);
    }
    if (columnObject.expressionType === 'case_statement') {
      return this.getCaseExpressionColumnFilterObject(columnObject, param);
    }

    if (columnObject.expressionType === 'simple_expression') {
      return this.getSimpleExpressionColumnFilterObject(columnObject, param);
    }
    console.warn('Unknown expression type:', columnObject.expressionType);
    return null;
  }

  getSimpleColumnFilterObject(columnObject, param) {
    let expression = columnObject.alias + ' = ';

    expression = expression + this.getParamValue(param);

    return {
      filterActingOn: 'simple_column',
      conditionExpression: expression,
      dynamicallyGenerated: true
    };
  }

  getSimpleExpressionColumnFilterObject(columnObject, param) {
    let expression = '';

    expression = expression + this.getParamValue(param);

    expression = expression + ' = (' + columnObject.expressionOptions.expression + ')';

    return {
      filterActingOn: 'derived_column',
      conditionExpression: expression,
      dynamicallyGenerated: true
    };
  }

  getCaseExpressionColumnFilterObject(columnObject, param) {
    let expression = '';

    let elseExpression = '';
    let joinOperator = '';
    let previousCondition = '';

    columnObject.expressionOptions.caseOptions.forEach(option => {
      // Build the else condition bit
      if (previousCondition === '' && option.condition !== 'else') {
        elseExpression = elseExpression + '(' + option.condition + ')';
      }
      if (previousCondition !== '' && option.condition !== 'else') {
        elseExpression = elseExpression + ' ' + joinOperator + '(' + option.condition + ')';
      }
      previousCondition = option.condition;
      joinOperator = 'AND';

      if (option.value === param) {
        expression = option.condition;
      }
    });

    if (expression === 'else') {
      expression = '!(' + elseExpression + ')';
    }

    return {
      filterActingOn: 'derived_column',
      conditionExpression: expression,
      dynamicallyGenerated: true
    };
  }

  getParamValue(param) {
    if (this.isString(param)) {
      return '"' + param + '"';
    }
    return param;
  }

  // isNumber(val) {
  //   return typeof(val) === 'number';
  // }

  // isBoolean(val) {
  //   return typeof(val) === 'boolean';
  // }

  // isDate(val) {

  // }

  isString(val) {
    return typeof val === 'string';
  }

}
