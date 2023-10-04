import { DataProviderType } from '@baserow/modules/core/dataProviderTypes'

import _ from 'lodash'

export class DataSourceDataProviderType extends DataProviderType {
  constructor(...args) {
    super(...args)
    this.debouncedFetches = {}
  }

  static getType() {
    return 'data_source'
  }

  get needBackendContext() {
    return true
  }

  get name() {
    return this.app.i18n.t('dataProviderType.dataSource')
  }

  async init(applicationContext) {
    const dataSources = this.app.store.getters['dataSource/getPageDataSources'](
      applicationContext.page
    )

    // Dispatch the data sources
    await this.app.store.dispatch(
      'dataSourceContent/fetchPageDataSourceContent',
      {
        page: applicationContext.page,
        data: DataProviderType.getAllBackendContext(
          this.app.$registry.getAll('builderDataProvider'),
          applicationContext
        ),
        dataSources,
      }
    )
  }

  getDataChunk(applicationContext, [dataSourceId, ...rest]) {
    const dataSource = this.app.store.getters[
      'dataSource/getPageDataSourceById'
    ](applicationContext.page, parseInt(dataSourceId))

    const content = this.getDataSourceContent(applicationContext, dataSource)

    return content ? _.get(content, rest.join('.')) : null
  }

  getDataSourceContent(applicationContext, dataSource) {
    const dataSourceContents = this.app.store.getters[
      'dataSourceContent/getDataSourceContents'
    ](applicationContext.page)

    return dataSourceContents[dataSource.id]
  }

  getDataSourceSchema(dataSource) {
    if (dataSource?.type) {
      const serviceType = this.app.$registry.get('service', dataSource.type)
      return serviceType.getDataSchema(dataSource)
    }
    return null
  }

  getDataContent(applicationContext) {
    const page = applicationContext.page
    const dataSources =
      this.app.store.getters['dataSource/getPageDataSources'](page)

    return Object.fromEntries(
      dataSources.map((dataSource) => {
        return [
          dataSource.id,
          this.getDataSourceContent(applicationContext, dataSource),
        ]
      })
    )
  }

  getDataSchema(applicationContext) {
    const page = applicationContext.page
    const dataSources =
      this.app.store.getters['dataSource/getPageDataSources'](page)

    const dataSourcesSchema = Object.fromEntries(
      dataSources.map((dataSource) => {
        const dsSchema = this.getDataSourceSchema(dataSource)
        if (dsSchema) {
          delete dsSchema.$schema
        }
        return [dataSource.id, dsSchema]
      })
    )

    return { type: 'object', properties: dataSourcesSchema }
  }

  getPathTitle(applicationContext, pathParts) {
    if (pathParts.length === 2) {
      const page = applicationContext?.page
      const dataSourceId = parseInt(pathParts[1])
      return (
        this.app.store.getters['dataSource/getPageDataSourceById'](
          page,
          dataSourceId
        )?.name || `data_source_${dataSourceId}`
      )
    }
    return super.getPathTitle(applicationContext, pathParts)
  }
}

export class PageParameterDataProviderType extends DataProviderType {
  static getType() {
    return 'page_parameter'
  }

  get name() {
    return this.app.i18n.t('dataProviderType.pageParameter')
  }

  async init(applicationContext) {
    const { page, mode, pageParamsValue } = applicationContext
    if (mode === 'editing') {
      // Generate fake values for the parameters
      await Promise.all(
        page.path_params.map(({ name, type }) =>
          this.app.store.dispatch('pageParameter/setParameter', {
            page,
            name,
            value: type === 'numeric' ? 1 : 'test',
          })
        )
      )
    } else {
      // Read parameters from the application context
      await Promise.all(
        Object.entries(pageParamsValue).map(([name, value]) =>
          this.app.store.dispatch('pageParameter/setParameter', {
            page,
            name,
            value,
          })
        )
      )
    }
  }

  getDataChunk(applicationContext, path) {
    const content = this.getDataContent(applicationContext)
    return _.get(content, path.join('.'))
  }

  getBackendContext(applicationContext) {
    return this.getDataContent(applicationContext)
  }

  getDataContent(applicationContext) {
    return this.app.store.getters['pageParameter/getParameters'](
      applicationContext.page
    )
  }

  getDataSchema(applicationContext) {
    const page = applicationContext.page
    const toJSONType = { text: 'string', numeric: 'number' }

    return {
      type: 'object',
      properties: Object.fromEntries(
        (page?.path_params || []).map(({ name, type }) => [
          name,
          {
            title: name,
            type: toJSONType[type],
          },
        ])
      ),
    }
  }
}

export class CurrentRecordDataProviderType extends DataProviderType {
  static getType() {
    return 'current_record'
  }

  get name() {
    return this.app.i18n.t('dataProviderType.currentRecord')
  }

  get indexKey() {
    // Prevent collision with user data
    return '__idx__'
  }

  getDataChunk(applicationContext, path) {
    const content = this.getDataContent(applicationContext)
    return _.get(content, path.join('.'))
  }

  getDataContent(applicationContext) {
    const {
      page,
      element: { data_source_id: dataSourceId } = {},
      recordIndex = 0,
    } = applicationContext

    if (!dataSourceId) {
      return null
    }

    const dataSource = this.app.store.getters[
      'dataSource/getPageDataSourceById'
    ](applicationContext.page, dataSourceId)

    if (!dataSource) {
      return null
    }

    const rows =
      this.app.store.getters['dataSourceContent/getDataSourceContents'](page)[
        dataSource.id
      ] || []

    const row = { [this.indexKey]: recordIndex, ...(rows[recordIndex] || {}) }

    // Add the index value
    row[this.indexKey] = recordIndex

    return row
  }

  getDataSourceSchema(dataSource) {
    if (dataSource?.type) {
      const serviceType = this.app.$registry.get('service', dataSource.type)
      return serviceType.getDataSchema(dataSource)
    }
    return null
  }

  getDataSchema(applicationContext) {
    const { page, element: { data_source_id: dataSourceId } = {} } =
      applicationContext

    if (!dataSourceId) {
      return null
    }

    const dataSource = this.app.store.getters[
      'dataSource/getPageDataSourceById'
    ](page, dataSourceId)

    const schema = this.getDataSourceSchema(dataSource)
    const rowSchema = schema?.items?.properties || {}

    // Here we add the index property schema
    const properties = {
      [this.indexKey]: {
        type: 'number',
        title: this.app.i18n.t('currentRecordDataProviderType.index'),
      },
      ...rowSchema,
    }

    return { type: 'object', properties }
  }

  getPathTitle(applicationContext, pathParts) {
    if (pathParts.length === 1) {
      const { page, element: { data_source_id: dataSourceId } = {} } =
        applicationContext

      const dataSource = this.app.store.getters[
        'dataSource/getPageDataSourceById'
      ](page, dataSourceId)

      if (!dataSource) {
        return pathParts[0]
      }

      return this.app.i18n.t('currentRecordDataProviderType.firstPartName', {
        name: dataSource.name,
      })
    }

    return super.getPathTitle(applicationContext, pathParts)
  }
}
