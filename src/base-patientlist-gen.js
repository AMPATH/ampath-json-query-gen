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

  mergeSources(aggregateSchema, baseSchema, templateSchema) {
    let genDirective = aggregateSchema.dynamicJsonQueryGenerationDirectives.patientListGenerator.generatingDirectives;

    this.modifyDynamicPLMainSourceObject(genDirective.joinDirectives,
      baseSchema.sources[0], templateSchema.sources[0]);

    templateSchema.sources.forEach(source => {
      baseSchema.sources.push(source);
    });
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

}
