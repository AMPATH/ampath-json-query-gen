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

}
