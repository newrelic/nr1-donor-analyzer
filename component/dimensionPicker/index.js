import React from 'react';
import { Spinner, Dropdown, DropdownItem } from 'nr1';

import nrdbQuery from '../lib/nrdb-query';
import quote from '../lib/quote';
import { timePickerNrql } from './get-query';

export default class DimensionPicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount(prevProps) {
    // if (
    //   prevProps.account !== this.props.account ||
    //   prevProps.attribute !== this.props.attribute ||
    //   prevProps.eventType !== this.props.eventType ||
    //   prevProps.filterWhere !== this.props.filterWhere
    // ) {
    //   console.log('load called')
    //   this.loadDimensions();
    // }
    this.loadDimensions();
  }

  getNrql(select) {
    const { filterWhere, eventType, attribute, entity } = this.props;
    const timeRange = timePickerNrql(this.props);

    let whereClause = ['true'];
    if (eventType == 'Metric') {
      whereClause.push(`metricName = '${attribute}'`);
    }
    if (entity && entity.domain == 'INFRA') {
      whereClause.push(`entityGuid = '${entity.guid}'`);
    }
    // else if (entity) {
    //   whereClause.push(`appId = ${entity.applicationId}`);
    // }
    if (filterWhere) whereClause.push(`${filterWhere}`);

    const nrql = `SELECT ${select} FROM ${quote(
      eventType
    )} WHERE ${whereClause.join(' AND ')} ${timeRange}`;

    return nrql;
  }

  async loadDimensions() {
    const { account } = this.props;
    const dimensions = [];
    const attributes = [];

    this.setState({ dimensions: null });
    if (!this.props.eventType) return;

    // get all of the available string attributes
    let results = await nrdbQuery(account.id, this.getNrql('keySet()'));
    // const keys = results
    //   .filter(d => d.type == 'string' && d.key !== 'metricName')
    //   .map(d => {
    //     return { name: d.key };
    //   });

    // const BATCH_SIZE = 50;
    // for (var i = 0; i < keys.length; i += BATCH_SIZE) {
    //   const batch = keys.slice(i, i + BATCH_SIZE);

    //    get the # of unique values for each string attribute
    //   const select = batch.map(d => `uniqueCount(${quote(d.name)})`);
    //   results = await nrdbQuery(account.id, this.getNrql(select));
    //   batch.forEach(d => {
    //     d.count = results[0][`uniqueCount.${d.name}`];

    //     if (d.count == 1) attributes.push(d);
    //     if (d.count > 1) dimensions.push(d);
    //   });
    // }

    // get the attribute values
    // if (attributes.length > 0) {
    //   const select = attributes.map(d => `latest(${quote(d.name)})`).join(', ');
    //   const attributeValues = await nrdbQuery(account.id, this.getNrql(select));
    //   attributes.forEach(d => {
    //     d.latest = attributeValues[0][`latest.${d.name}`];
    //   });
    // }
    this.setState({ attributes: results });
  }

  renderAttributesTable() {
    const { attributes } = this.state;
    const { selectAttribute } = this.props;
    if (!attributes) return <div />;

    return (
      <Dropdown
        spacingType={[Dropdown.SPACING_TYPE.MEDIUM]}
        title="Select CRM Attribute"
        label="Please select your CRM attribute."
      >
        {attributes.map(a => {
          return (
            <DropdownItem
              key={`${a.key}`}
              onClick={() => this.props.selectAttribute(a)}
            >
              {a.key}
            </DropdownItem>
          );
        })}
      </Dropdown>
    );
  }

  render() {
    const { attribute } = this.props;
    return <div>{this.renderAttributesTable()}</div>;
  }
}
