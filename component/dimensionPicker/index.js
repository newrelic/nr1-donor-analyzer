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
    if (filterWhere) whereClause.push(`${filterWhere}`);

    const nrql = `SELECT ${select} FROM ${quote(
      eventType
    )} WHERE ${whereClause.join(' AND ')} ${timeRange}`;

    return nrql;
  }

  async loadDimensions() {
    const { account } = this.props;

    this.setState({ dimensions: null });
    if (!this.props.eventType) return;

    // get all of the available string attributes
    let results = await nrdbQuery(account.id, this.getNrql('keySet()'));
    this.setState({ attributes: results });
  }

  renderAttributesTable() {
    const { attributes } = this.state;
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
    return <div>{this.renderAttributesTable()}</div>;
  }
}
