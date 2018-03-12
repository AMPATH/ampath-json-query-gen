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

describe('BasePatientListGen', () => {
  beforeEach(() => {
    gen = new BasePatientListGen(null,null,null);
  });
  it('should be defined', () => {
    expect(gen).to.exist;
    expect(gen.generatePatientListSchema()).not.be.null;
  });
});
