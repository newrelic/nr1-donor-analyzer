import React from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownItem } from 'nr1';

import nrdbQuery from '../lib/nrdb-query';
import quote from '../lib/quote';
import { timePickerNrql } from './get-query';

export default class DimensionPicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.loadDimensions();
  }

  getNrql(select) {
    const { filterWhere, eventType, attribute, entity } = this.props;
    const timeRange = timePickerNrql(this.props);

    const whereClause = ['true'];
    if (eventType === 'Metric') {
      whereClause.push(`metricName = '${attribute}'`);
    }
    if (entity && entity.domain === 'INFRA') {
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

    if (!this.props.eventType) return;

    // get all of the available string attributes
    const results = await nrdbQuery(account.id, this.getNrql('keySet()'));
    this.setState({ attributes: results });
  }

  renderAttributesTable() {
    const { attributes } = this.state;
    if (!attributes) return <div />;

    return (
      <Dropdown
        spacingType={[Dropdown.SPACING_TYPE.MEDIUM]}
        title="Select CRM Attribute"
        placeholder="Please select your CRM attribute."
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

DimensionPicker.propTypes = {
  filterWhere: PropTypes.string,
  eventType: PropTypes.string,
  attribute: PropTypes.string,
  entity: PropTypes.object,
  account: PropTypes.object,
  selectAttribute: PropTypes.func
};
