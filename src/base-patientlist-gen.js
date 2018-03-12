// import SqlGenerators from './sql-generators.js';
import * as Squel from 'squel';
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

    for(var i = 0; i < columnArray.length; i++) {
      if(this.willColumnTitlesCollide(column, columnArray[i])){
        return true;
      }
    }
    return false;
  }

  willColumnTitlesCollide(columnA, columnB){
    if((columnA.alias || columnB.alias) && columnA.alias === columnB.alias) {
      return true;
    }

    if(columnA.column && columnB.column && columnA.column === columnB.column) {
      return true;
    }
    return false;
  }

}
